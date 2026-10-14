import assert from "node:assert/strict";
import { after, test } from "node:test";
import request from "supertest";
import { app } from "./app.js";
import { closePool, getPool } from "./db/pool.js";
import { LocalImageStorage } from "./storage/localImageStorage.js";

const databaseAvailable = Boolean(process.env.DATABASE_URL);
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS8sAAAAASUVORK5CYII=",
  "base64"
);

after(async () => {
  await closePool();
});

test("workspace batch upload validates actual file content and flags duplicates", {
  skip: !databaseAvailable
}, async () => {
  const pool = getPool();
  const storage = new LocalImageStorage();
  let workspaceId: string | undefined;

  try {
    const workspaceResponse = await request(app)
      .post("/api/workspaces")
      .send({ name: "Upload integration test" });
    assert.equal(workspaceResponse.status, 201);
    workspaceId = workspaceResponse.body.data.id;

    const batchResponse = await request(app)
      .post(`/api/workspaces/${workspaceId}/batches`)
      .send({ name: "Image upload test" });
    assert.equal(batchResponse.status, 201);
    const batchId = batchResponse.body.data.id;

    const uploadResponse = await request(app)
      .post(`/api/workspaces/${workspaceId}/batches/${batchId}/images`)
      .attach("images", tinyPng, { filename: "../../tiny.png", contentType: "image/png" })
      .attach("images", tinyPng, { filename: "duplicate.png", contentType: "image/png" })
      .attach("images", Buffer.from("this is not an image"), { filename: "fake.png", contentType: "image/png" });

    assert.equal(uploadResponse.status, 201);
    assert.equal(uploadResponse.body.data.accepted.length, 1);
    assert.equal(uploadResponse.body.data.accepted[0].filename, "tiny.png");
    assert.equal(uploadResponse.body.data.accepted[0].mimeType, "image/png");
    assert.equal(uploadResponse.body.data.rejected.length, 2);
    assert.deepEqual(
      uploadResponse.body.data.rejected.map((item: { code: string }) => item.code).sort(),
      ["DUPLICATE_IMAGE", "UNSUPPORTED_TYPE"]
    );

    const batchState = await pool.query<{ total_images: number }>(
      "SELECT total_images FROM batches WHERE id = $1",
      [batchId]
    );
    assert.equal(batchState.rows[0].total_images, 1);

    const storedImages = await pool.query<{ storage_key: string }>(
      "SELECT storage_key FROM source_images WHERE batch_id = $1",
      [batchId]
    );
    for (const row of storedImages.rows) {
      await storage.remove(row.storage_key);
    }
  } finally {
    if (workspaceId) {
      await pool.query("DELETE FROM workspaces WHERE id = $1", [workspaceId]);
    }
  }
});
