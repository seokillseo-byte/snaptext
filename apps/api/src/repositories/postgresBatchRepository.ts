import type { Pool } from "pg";
import type {
  BatchRecord,
  BatchRepository,
  NewSourceImage,
  SourceImageRecord,
  WorkspaceRecord
} from "./batchRepository.js";

export class PostgresBatchRepository implements BatchRepository {
  constructor(private readonly pool: Pool) {}

  async createWorkspace(name: string): Promise<WorkspaceRecord> {
    const result = await this.pool.query<{ id: string; name: string; created_at: Date }>(
      "INSERT INTO workspaces (name) VALUES ($1) RETURNING id, name, created_at",
      [name]
    );
    const row = result.rows[0];
    return { id: row.id, name: row.name, createdAt: row.created_at.toISOString() };
  }

  async createBatch(workspaceId: string, name: string): Promise<BatchRecord> {
    const result = await this.pool.query<{
      id: string;
      workspace_id: string;
      name: string;
      status: string;
      total_images: number;
      created_at: Date;
    }>(
      `INSERT INTO batches (workspace_id, name)
       SELECT $1, $2 WHERE EXISTS (SELECT 1 FROM workspaces WHERE id = $1)
       RETURNING id, workspace_id, name, status, total_images, created_at`,
      [workspaceId, name]
    );

    if (result.rowCount !== 1) {
      throw Object.assign(new Error("Workspace was not found."), { statusCode: 404, code: "WORKSPACE_NOT_FOUND" });
    }

    const row = result.rows[0];
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      status: row.status,
      totalImages: row.total_images,
      createdAt: row.created_at.toISOString()
    };
  }

  async batchExistsInWorkspace(workspaceId: string, batchId: string): Promise<boolean> {
    const result = await this.pool.query(
      "SELECT 1 FROM batches WHERE id = $1 AND workspace_id = $2",
      [batchId, workspaceId]
    );
    return result.rowCount === 1;
  }

  async insertSourceImage(image: NewSourceImage): Promise<SourceImageRecord | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<{
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
        [image.batchId, image.originalFilename, image.storageKey, image.mimeType, image.sizeBytes, image.sha256]
      );

      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      await client.query(
        "UPDATE batches SET total_images = total_images + 1, status = 'UPLOADING', updated_at = now() WHERE id = $1",
        [image.batchId]
      );
      await client.query("COMMIT");

      const row = result.rows[0];
      return {
        id: row.id,
        originalFilename: row.original_filename,
        mimeType: row.mime_type,
        sizeBytes: Number(row.size_bytes),
        sha256: row.sha256.trim(),
        status: row.status
      };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }
}
