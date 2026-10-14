import { createHash } from "node:crypto";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import type { BatchRepository } from "../repositories/batchRepository.js";
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
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function assertUuid(value: string, label: string): void {
  if (!uuidPattern.test(value)) {
    throw Object.assign(new Error(`${label} must be a valid UUID.`), { statusCode: 400, code: "INVALID_ID" });
  }
}


function normalizePagination(page: number, pageSize: number): { page: number; pageSize: number } {
  if (!Number.isInteger(page) || page < 1 || page > 1_000_000) {
    throw Object.assign(new Error("Page must be an integer between 1 and 1000000."), { statusCode: 400, code: "INVALID_PAGINATION" });
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw Object.assign(new Error("Page size must be an integer between 1 and 100."), { statusCode: 400, code: "INVALID_PAGINATION" });
  }
  return { page, pageSize };
}

export class BatchService {
  constructor(
    private readonly repository: BatchRepository,
    private readonly storage: ImageStorage
  ) {}

  async createWorkspace(name: string): Promise<{ id: string; name: string; createdAt: string }> {
    const normalizedName = name.trim();
    if (normalizedName.length < 1 || normalizedName.length > 160) {
      throw Object.assign(new Error("Workspace name must be between 1 and 160 characters."), { statusCode: 400, code: "INVALID_WORKSPACE_NAME" });
    }
    return this.repository.createWorkspace(normalizedName);
  }


  async getWorkspace(workspaceId: string) {
    assertUuid(workspaceId, "Workspace ID");
    const workspace = await this.repository.getWorkspace(workspaceId);
    if (!workspace) {
      throw Object.assign(new Error("Workspace was not found."), { statusCode: 404, code: "WORKSPACE_NOT_FOUND" });
    }
    return workspace;
  }

  async listWorkspaces(page = 1, pageSize = 20) {
    const pagination = normalizePagination(page, pageSize);
    const result = await this.repository.listWorkspaces(pagination.pageSize, (pagination.page - 1) * pagination.pageSize);
    return {
      items: result.items,
      pagination: { ...pagination, total: result.total, totalPages: Math.ceil(result.total / pagination.pageSize) }
    };
  }

  async listBatches(workspaceId: string, page = 1, pageSize = 20) {
    assertUuid(workspaceId, "Workspace ID");
    await this.getWorkspace(workspaceId);
    const pagination = normalizePagination(page, pageSize);
    const result = await this.repository.listBatches(workspaceId, pagination.pageSize, (pagination.page - 1) * pagination.pageSize);
    return {
      items: result.items,
      pagination: { ...pagination, total: result.total, totalPages: Math.ceil(result.total / pagination.pageSize) }
    };
  }

  async getBatch(workspaceId: string, batchId: string) {
    assertUuid(workspaceId, "Workspace ID");
    assertUuid(batchId, "Batch ID");
    const batch = await this.repository.getBatch(workspaceId, batchId);
    if (!batch) {
      throw Object.assign(new Error("Batch was not found in this workspace."), { statusCode: 404, code: "BATCH_NOT_FOUND" });
    }
    return batch;
  }

  async listImages(workspaceId: string, batchId: string, page = 1, pageSize = 20) {
    assertUuid(workspaceId, "Workspace ID");
    assertUuid(batchId, "Batch ID");
    await this.getBatch(workspaceId, batchId);
    const pagination = normalizePagination(page, pageSize);
    const result = await this.repository.listImages(workspaceId, batchId, pagination.pageSize, (pagination.page - 1) * pagination.pageSize);
    return {
      items: result.items,
      pagination: { ...pagination, total: result.total, totalPages: Math.ceil(result.total / pagination.pageSize) }
    };
  }

  async getImage(workspaceId: string, batchId: string, imageId: string) {
    assertUuid(workspaceId, "Workspace ID");
    assertUuid(batchId, "Batch ID");
    assertUuid(imageId, "Image ID");
    await this.getBatch(workspaceId, batchId);
    const image = await this.repository.getImage(workspaceId, batchId, imageId);
    if (!image) {
      throw Object.assign(new Error("Image was not found in this batch."), { statusCode: 404, code: "IMAGE_NOT_FOUND" });
    }
    return image;
  }

  async createBatch(workspaceId: string, name: string) {
    assertUuid(workspaceId, "Workspace ID");
    const normalizedName = name.trim();
    if (normalizedName.length < 1 || normalizedName.length > 200) {
      throw Object.assign(new Error("Batch name must be between 1 and 200 characters."), { statusCode: 400, code: "INVALID_BATCH_NAME" });
    }
    return this.repository.createBatch(workspaceId, normalizedName);
  }

  async uploadImages(workspaceId: string, batchId: string, files: UploadedImage[]): Promise<UploadResult> {
    assertUuid(workspaceId, "Workspace ID");
    assertUuid(batchId, "Batch ID");
    if (files.length < 1) {
      throw Object.assign(new Error("Select at least one image."), { statusCode: 400, code: "NO_IMAGES" });
    }

    if (!await this.repository.batchExistsInWorkspace(workspaceId, batchId)) {
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
        const saved = await this.repository.insertSourceImage({
          batchId,
          originalFilename: safeOriginalFilename(file.originalname),
          storageKey: stored.storageKey,
          mimeType: detected.mime,
          sizeBytes: file.size,
          sha256
        });

        if (!saved) {
          await this.storage.remove(stored.storageKey);
          stored = undefined;
          rejected.push({
            filename: safeOriginalFilename(file.originalname),
            code: "DUPLICATE_IMAGE",
            message: "An image with identical content already exists in this batch."
          });
          continue;
        }

        accepted.push({
          id: saved.id,
          filename: saved.originalFilename,
          mimeType: saved.mimeType,
          sizeBytes: saved.sizeBytes,
          sha256: saved.sha256,
          status: saved.status
        });
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
