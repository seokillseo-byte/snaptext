import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import type { Pool } from "pg";
import type { Express } from "express";
import type { ImageStorage } from "../storage/localImageStorage.js";

const allowedImageTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/tiff",
  "image/bmp"
]);

const maxOriginalFilenameLength = 255;

export interface UploadedImage {
  buffer: Buffer;
  originalname: string;
  size: number;
}

export interface UploadIssue {
  filename: string;
  code: "UNSUPPORTED_TYPE" | "DUPLICATE_IMAGE" | "STORAGE_OR_DATABASE_ERROR";
  message: string;
}

export interface UploadResult {
  accepted: Array<{
    id: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    sha256: string;
    status: "UPLOADED";
  }>;
  rejected: UploadIssue[];
}

function safeOriginalFilename(filename: string): string {
  const basename = path.basename(filename.replace(/\\/g, "/")).replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return (basename || "image").slice(0, maxOriginalFilenameLength);
}

export class BatchService {
  constructor(
    private readonly pool: Pool,
    private readonly storage: ImageStorage
  ) {}

  async createWorkspace(name: string): Promise<{ id: string; name: string; createdAt: string }> {
    const normalizedName = name.trim();
    if (normalizedName.length < 1 || normalizedName.length > 160) {
      throw Object.assign(new Error("Workspace name must be between 1 and 160 characters."), { statusCode: 400, code: "INVALID_WORKSPACE_NAME" });
    }
    const result = await this.pool.query<{ id: string; name: string; created_at: Date }>(
      "INSERT INTO workspaces (name) VALUES ($1) RETURNING id, name, created_at",
      [normalizedName]
    );
    const row = result.rows[0];
    return { id: row.id, name: row.name, createdAt: row.created_at.toISOString() };
  }

  async createBatch(workspaceId: string, name: string): Promise<{ id: string; workspaceId: string; name: string; status: string; totalImages: number; createdAt: string }> {
    const normalizedName = name.trim();
    if (normalizedName.length < 1 || normalizedName.length > 200) {
      throw Object.assign(new Error("Batch name must be between 1 and 200 characters."), { statusCode: 400, code: "INVALID_BATCH_NAME" });
    }
    const result = await this.pool.query<{ id: string; workspace_id: string; name: string; status: string; total_images: number; created_at: Date }>(
      "INSERT INTO batches (workspace_id, name) VALUES ($1, $2) RETURNING id, workspace_id, name, status, total_images, created_at",
      [workspaceId, normalizedName]
    );
    const row = result.rows[0];
    return { id: row.id, workspaceId: row.workspace_id, name: row.name, status: row.status, totalImages: row.total_images, createdAt: row.created_at.toISOString() };
  }

  async uploadImages(workspaceId: string, batchId: string, files: UploadedImage[]): Promise<UploadResult> {
    if (files.length < 1) {
      throw Object.assign(new Error("Select at least one image."), { statusCode: 400, code: "NO_IMAGES" });
    }

    const batch = await this.pool.query<{ id: string }>(
      "SELECT id FROM batches WHERE id = $1 AND workspace_id = $2",
      [batchId, workspaceId]
    );
    if (batch.rowCount !== 1) {
      throw Object.assign(new Error("Batch was not found in this workspace."), { statusCode: 404, code: "BATCH_NOT_FOUND" });
    }

    const accepted: UploadResult["accepted"] = [];
    const rejected: UploadIssue[] = [];

    for (const file of files) {
      const detected = await fileTypeFromBuffer(file.buffer);
      if (!detected || !allowedImageTypes.has(detected.mime)) {
        rejected.push({
          filename: safeOriginalFilename(file.originalname),
          code: "UNSUPPORTED_TYPE",
          message: "File content is not a supported image (PNG, JPEG, WEBP, GIF, TIFF, or BMP)."
        });
        continue;
      }

      const sha256 = createHash("sha256").update(file.buffer).digest("hex");
      let stored: Awaited<ReturnType<ImageStorage["put"]>> | undefined;
      try {
        stored = await this.storage.put(file.buffer, detected.mime);
        const client = await this.pool.connect();
        try {
          await client.query("BEGIN");
          const insert = await client.query<{
            id: string;
            original_filename: string;
            mime_type: string;
            size_bytes: string;
            sha256: string;
            status: "UPLOADED";
          }>(
            `INSERT INTO source_images (batch_id, original_filename, storage_key, mime_type, size_bytes, sha256)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (batch_id, sha256) DO NOTHING
             RETURNING id, original_filename, mime_type, size_bytes, sha256, status`,
            [batchId, safeOriginalFilename(file.originalname), stored.storageKey, detected.mime, file.size, sha256]
          );

          if (insert.rowCount === 0) {
            await client.query("ROLLBACK");
            await this.storage.remove(stored.storageKey);
            rejected.push({
              filename: safeOriginalFilename(file.originalname),
              code: "DUPLICATE_IMAGE",
              message: "An image with identical content already exists in this batch."
            });
            continue;
          }

          await client.query(
            "UPDATE batches SET total_images = total_images + 1, status = 'UPLOADING', updated_at = now() WHERE id = $1",
            [batchId]
          );
          await client.query("COMMIT");
          const row = insert.rows[0];
          accepted.push({
            id: row.id,
            filename: row.original_filename,
            mimeType: row.mime_type,
            sizeBytes: Number(row.size_bytes),
            sha256: row.sha256.trim(),
            status: row.status
          });
        } catch (error) {
          await client.query("ROLLBACK").catch(() => undefined);
          throw error;
        } finally {
          client.release();
        }
      } catch {
        if (stored) {
          await this.storage.remove(stored.storageKey).catch(() => undefined);
        }
        rejected.push({
          filename: safeOriginalFilename(file.originalname),
          code: "STORAGE_OR_DATABASE_ERROR",
          message: "This image could not be saved. Other images in the batch may still have been accepted."
        });
      }
    }

    return { accepted, rejected };
  }
}

export function toUploadedImage(file: Express.Multer.File): UploadedImage {
  return { buffer: file.buffer, originalname: file.originalname, size: file.size };
}

export function newWorkspaceIdForTests(): string {
  return randomUUID();
}
