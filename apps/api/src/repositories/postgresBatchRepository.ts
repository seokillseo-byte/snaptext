import type { Pool } from "pg";
import type {
  BatchRecord,
  BatchRepository,
  NewSourceImage,
  PageResult,
  SourceImageRecord,
  UploadedSourceImageRecord,
  WorkspaceRecord
} from "./batchRepository.js";

function toWorkspace(row: { id: string; name: string; created_at: Date }): WorkspaceRecord {
  return { id: row.id, name: row.name, createdAt: row.created_at.toISOString() };
}

function toBatch(row: {
  id: string;
  workspace_id: string;
  name: string;
  status: string;
  total_images: number;
  created_at: Date;
}): BatchRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    status: row.status,
    totalImages: row.total_images,
    createdAt: row.created_at.toISOString()
  };
}

function toImage(row: {
  id: string;
  batch_id: string;
  original_filename: string;
  mime_type: string;
  size_bytes: string | number;
  sha256: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}): SourceImageRecord {
  return {
    id: row.id,
    batchId: row.batch_id,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    sha256: row.sha256.trim(),
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export class PostgresBatchRepository implements BatchRepository {
  constructor(private readonly pool: Pool) {}

  async createWorkspace(name: string): Promise<WorkspaceRecord> {
    const result = await this.pool.query<{ id: string; name: string; created_at: Date }>(
      "INSERT INTO workspaces (name) VALUES ($1) RETURNING id, name, created_at",
      [name]
    );
    return toWorkspace(result.rows[0]);
  }

  async getWorkspace(workspaceId: string): Promise<WorkspaceRecord | null> {
    const result = await this.pool.query<{ id: string; name: string; created_at: Date }>(
      "SELECT id, name, created_at FROM workspaces WHERE id = $1",
      [workspaceId]
    );
    return result.rowCount ? toWorkspace(result.rows[0]) : null;
  }

  async listWorkspaces(limit: number, offset: number): Promise<PageResult<WorkspaceRecord>> {
    const [rows, count] = await Promise.all([
      this.pool.query<{ id: string; name: string; created_at: Date }>(
        "SELECT id, name, created_at FROM workspaces ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2",
        [limit, offset]
      ),
      this.pool.query<{ count: string }>("SELECT count(*) FROM workspaces")
    ]);
    return { items: rows.rows.map(toWorkspace), total: Number(count.rows[0].count) };
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

    return toBatch(result.rows[0]);
  }

  async getBatch(workspaceId: string, batchId: string): Promise<BatchRecord | null> {
    const result = await this.pool.query<{
      id: string;
      workspace_id: string;
      name: string;
      status: string;
      total_images: number;
      created_at: Date;
    }>(
      "SELECT id, workspace_id, name, status, total_images, created_at FROM batches WHERE workspace_id = $1 AND id = $2",
      [workspaceId, batchId]
    );
    return result.rowCount ? toBatch(result.rows[0]) : null;
  }

  async listBatches(workspaceId: string, limit: number, offset: number): Promise<PageResult<BatchRecord>> {
    const [rows, count] = await Promise.all([
      this.pool.query<{
        id: string;
        workspace_id: string;
        name: string;
        status: string;
        total_images: number;
        created_at: Date;
      }>(
        "SELECT id, workspace_id, name, status, total_images, created_at FROM batches WHERE workspace_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3",
        [workspaceId, limit, offset]
      ),
      this.pool.query<{ count: string }>("SELECT count(*) FROM batches WHERE workspace_id = $1", [workspaceId])
    ]);
    return { items: rows.rows.map(toBatch), total: Number(count.rows[0].count) };
  }

  async listImages(workspaceId: string, batchId: string, limit: number, offset: number): Promise<PageResult<SourceImageRecord>> {
    const [rows, count] = await Promise.all([
      this.pool.query<{
        id: string;
        batch_id: string;
        original_filename: string;
        mime_type: string;
        size_bytes: string;
        sha256: string;
        status: string;
        created_at: Date;
        updated_at: Date;
      }>(
        `SELECT i.id, i.batch_id, i.original_filename, i.mime_type, i.size_bytes, i.sha256, i.status, i.created_at, i.updated_at
         FROM source_images i
         INNER JOIN batches b ON b.id = i.batch_id
         WHERE b.workspace_id = $1 AND b.id = $2
         ORDER BY i.created_at DESC, i.id DESC LIMIT $3 OFFSET $4`,
        [workspaceId, batchId, limit, offset]
      ),
      this.pool.query<{ count: string }>(
        `SELECT count(*) FROM source_images i
         INNER JOIN batches b ON b.id = i.batch_id
         WHERE b.workspace_id = $1 AND b.id = $2`,
        [workspaceId, batchId]
      )
    ]);
    return { items: rows.rows.map(toImage), total: Number(count.rows[0].count) };
  }

  async getImage(workspaceId: string, batchId: string, imageId: string): Promise<SourceImageRecord | null> {
    const result = await this.pool.query<{
      id: string;
      batch_id: string;
      original_filename: string;
      mime_type: string;
      size_bytes: string;
      sha256: string;
      status: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT i.id, i.batch_id, i.original_filename, i.mime_type, i.size_bytes, i.sha256, i.status, i.created_at, i.updated_at
       FROM source_images i
       INNER JOIN batches b ON b.id = i.batch_id
       WHERE b.workspace_id = $1 AND b.id = $2 AND i.id = $3`,
      [workspaceId, batchId, imageId]
    );
    return result.rowCount ? toImage(result.rows[0]) : null;
  }

  async batchExistsInWorkspace(workspaceId: string, batchId: string): Promise<boolean> {
    const result = await this.pool.query(
      "SELECT 1 FROM batches WHERE id = $1 AND workspace_id = $2",
      [batchId, workspaceId]
    );
    return result.rowCount === 1;
  }

  async insertSourceImage(image: NewSourceImage): Promise<UploadedSourceImageRecord | null> {
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
