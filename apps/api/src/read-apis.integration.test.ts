import assert from "node:assert/strict";
import { after, test } from "node:test";
import request from "supertest";
import { app } from "./app.js";
import { closePool, getPool } from "./db/pool.js";
import { LocalImageStorage } from "./storage/localImageStorage.js";
import { createTestSession } from "./testing/testSession.js";

const databaseAvailable = Boolean(process.env.DATABASE_URL);
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS8sAAAAASUVORK5CYII=",
  "base64"
);

after(async () => {
  await closePool();
});

test("workspace, batch, and image read endpoints paginate persisted records and enforce parent scope", {
  skip: !databaseAvailable
}, async () => {
  const pool = getPool();
  const testSession = await createTestSession(pool);
  const api = {
    get: (url: string) => request(app).get(url).set("Cookie", testSession.cookie),
    post: (url: string) => request(app).post(url).set("Host", "app.example.test").set("Origin", "http://app.example.test").set("Cookie", testSession.cookie)
  };
  const storage = new LocalImageStorage();
  const workspaceIds: string[] = [];

  try {
    for (const name of ["Read API workspace A", "Read API workspace B"]) {
      const response = await api.post("/api/workspaces").send({ name });
      assert.equal(response.status, 201);
      workspaceIds.push(response.body.data.id as string);
    }

    const workspaceId = workspaceIds[0];
    const otherWorkspaceId = workspaceIds[1];

    const firstWorkspaceDetail = await api.get(`/api/workspaces/${workspaceId}`);
    assert.equal(firstWorkspaceDetail.status, 200);
    assert.equal(firstWorkspaceDetail.body.data.id, workspaceId);

    const workspacePage = await api.get("/api/workspaces?page=1&pageSize=1");
    assert.equal(workspacePage.status, 200);
    assert.equal(workspacePage.body.data.items.length, 1);
    assert.equal(workspacePage.body.data.pagination.page, 1);
    assert.equal(workspacePage.body.data.pagination.pageSize, 1);
    assert.ok(workspacePage.body.data.pagination.total >= 2);
    assert.ok(workspacePage.body.data.pagination.totalPages >= 2);

    const batchIds: string[] = [];
    for (const name of ["Read batch A", "Read batch B", "Read batch C"]) {
      const response = await api.post(`/api/workspaces/${workspaceId}/batches`)
        .send({ name });
      assert.equal(response.status, 201);
      batchIds.push(response.body.data.id as string);
    }

    const firstBatchPage = await api.get(`/api/workspaces/${workspaceId}/batches?page=1&pageSize=2`);
    assert.equal(firstBatchPage.status, 200);
    assert.equal(firstBatchPage.body.data.items.length, 2);
    assert.equal(firstBatchPage.body.data.pagination.total, 3);
    assert.equal(firstBatchPage.body.data.pagination.totalPages, 2);

    const secondBatchPage = await api.get(`/api/workspaces/${workspaceId}/batches?page=2&pageSize=2`);
    assert.equal(secondBatchPage.status, 200);
    assert.equal(secondBatchPage.body.data.items.length, 1);

    const batchDetail = await api.get(`/api/workspaces/${workspaceId}/batches/${batchIds[0]}`);
    assert.equal(batchDetail.status, 200);
    assert.equal(batchDetail.body.data.id, batchIds[0]);
    assert.equal(batchDetail.body.data.totalImages, 0);

    const wrongWorkspaceBatch = await api.get(`/api/workspaces/${otherWorkspaceId}/batches/${batchIds[0]}`);
    assert.equal(wrongWorkspaceBatch.status, 404);
    assert.equal(wrongWorkspaceBatch.body.error.code, "BATCH_NOT_FOUND");

    const uploadResponse = await api.post(`/api/workspaces/${workspaceId}/batches/${batchIds[0]}/images`)
      .attach("images", tinyPng, { filename: "read-api.png", contentType: "image/png" });
    assert.equal(uploadResponse.status, 200);
    assert.equal(uploadResponse.body.data.accepted.length, 1);
    const imageId = uploadResponse.body.data.accepted[0].id as string;

    const imagePage = await api.get(`/api/workspaces/${workspaceId}/batches/${batchIds[0]}/images?page=1&pageSize=1`);
    assert.equal(imagePage.status, 200);
    assert.equal(imagePage.body.data.items.length, 1);
    assert.equal(imagePage.body.data.pagination.total, 1);
    assert.equal(imagePage.body.data.items[0].id, imageId);
    assert.equal("storageKey" in imagePage.body.data.items[0], false);

    const imageDetail = await api.get(`/api/workspaces/${workspaceId}/batches/${batchIds[0]}/images/${imageId}`);
    assert.equal(imageDetail.status, 200);
    assert.equal(imageDetail.body.data.id, imageId);
    assert.equal(imageDetail.body.data.mimeType, "image/png");
    assert.equal("storageKey" in imageDetail.body.data, false);

    const wrongScopeImage = await api.get(`/api/workspaces/${otherWorkspaceId}/batches/${batchIds[0]}/images/${imageId}`);
    assert.equal(wrongScopeImage.status, 404);

    const invalidPage = await api.get(`/api/workspaces/${workspaceId}/batches?page=0&pageSize=2`);
    assert.equal(invalidPage.status, 400);
    assert.equal(invalidPage.body.error.code, "INVALID_PAGINATION");
  } finally {
    for (const workspaceId of workspaceIds) {
      const images = await pool.query<{ storage_key: string }>(
        `SELECT i.storage_key
         FROM source_images i
         INNER JOIN batches b ON b.id = i.batch_id
         WHERE b.workspace_id = $1`,
        [workspaceId]
      );
      for (const image of images.rows) {
        await storage.remove(image.storage_key).catch(() => undefined);
      }
      await pool.query("DELETE FROM workspaces WHERE id = $1", [workspaceId]);
    }
    await testSession.cleanup();
  }
});
