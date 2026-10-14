import { Router } from "express";
import multer from "multer";
import { getPool } from "../db/pool.js";
import { BatchService, toUploadedImage } from "../services/batchService.js";
import { LocalImageStorage } from "../storage/localImageStorage.js";

const maxFiles = Number.parseInt(process.env.UPLOAD_MAX_FILES ?? "50", 10);
const maxFileSizeMb = Number.parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB ?? "15", 10);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: Number.isInteger(maxFiles) && maxFiles > 0 ? maxFiles : 50,
    fileSize: (Number.isInteger(maxFileSizeMb) && maxFileSizeMb > 0 ? maxFileSizeMb : 15) * 1024 * 1024
  }
});
const storage = new LocalImageStorage();
export const batchesRouter = Router();

function service(): BatchService {
  return new BatchService(getPool(), storage);
}

function routeError(error: unknown, response: import("express").Response): void {
  const candidate = error as { statusCode?: number; code?: string; message?: string };
  const status = candidate.statusCode ?? 500;
  response.status(status).json({
    error: {
      code: candidate.code ?? "INTERNAL_ERROR",
      message: status === 500 ? "The request could not be completed." : candidate.message ?? "The request is invalid."
    }
  });
}

batchesRouter.post("/workspaces", async (request, response) => {
  try {
    const name = typeof request.body?.name === "string" ? request.body.name : "";
    const workspace = await service().createWorkspace(name);
    response.status(201).json({ data: workspace });
  } catch (error) {
    routeError(error, response);
  }
});

batchesRouter.post("/workspaces/:workspaceId/batches", async (request, response) => {
  try {
    const name = typeof request.body?.name === "string" ? request.body.name : "";
    const batch = await service().createBatch(request.params.workspaceId, name);
    response.status(201).json({ data: batch });
  } catch (error) {
    routeError(error, response);
  }
});

batchesRouter.post(
  "/workspaces/:workspaceId/batches/:batchId/images",
  (request, response, next) => {
    upload.array("images", Number.isInteger(maxFiles) && maxFiles > 0 ? maxFiles : 50)(request, response, (error: unknown) => {
      if (error) {
        const candidate = error as { code?: string };
        const isLimit = candidate.code === "LIMIT_FILE_SIZE" || candidate.code === "LIMIT_FILE_COUNT";
        response.status(isLimit ? 413 : 400).json({
          error: {
            code: isLimit ? "UPLOAD_LIMIT_EXCEEDED" : "INVALID_MULTIPART_UPLOAD",
            message: isLimit ? "The upload exceeds the configured file count or file size limit." : "The multipart upload is invalid."
          }
        });
        return;
      }
      next();
    });
  },
  async (request, response) => {
    try {
      const files = (request.files ?? []) as Express.Multer.File[];
      const result = await service().uploadImages(
        request.params.workspaceId,
        request.params.batchId,
        files.map(toUploadedImage)
      );
      response.status(200).json({ data: result });
    } catch (error) {
      routeError(error, response);
    }
  }
);
