import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { getPool } from "../db/pool.js";
import { BatchService, type UploadedImage } from "../services/batchService.js";
import { LocalImageStorage } from "../storage/localImageStorage.js";

const maxFiles = Number.parseInt(process.env.UPLOAD_MAX_FILES ?? "20", 10);
const maxFileSizeMb = Number.parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB ?? "10", 10);
const maxTotalSizeMb = Number.parseInt(process.env.UPLOAD_MAX_TOTAL_SIZE_MB ?? "100", 10);
const safeMaxFiles = Number.isInteger(maxFiles) && maxFiles > 0 ? Math.min(maxFiles, 50) : 20;
const safeMaxFileBytes = (Number.isInteger(maxFileSizeMb) && maxFileSizeMb > 0 ? Math.min(maxFileSizeMb, 25) : 10) * 1024 * 1024;
const safeMaxTotalBytes = (Number.isInteger(maxTotalSizeMb) && maxTotalSizeMb > 0 ? Math.min(maxTotalSizeMb, 250) : 100) * 1024 * 1024;
const tempRoot = path.resolve(process.env.UPLOAD_TEMP_ROOT ?? path.resolve(process.cwd(), ".snaptext-data/tmp"));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => {
      mkdir(tempRoot, { recursive: true, mode: 0o700 })
        .then(() => callback(null, tempRoot))
        .catch((error: NodeJS.ErrnoException) => callback(error, tempRoot));
    },
    filename: (_request, _file, callback) => callback(null, randomUUID())
  }),
  limits: {
    files: safeMaxFiles,
    fileSize: safeMaxFileBytes
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

async function cleanupTempFiles(files: Express.Multer.File[]): Promise<void> {
  await Promise.all(files.map((file) => rm(file.path, { force: true }).catch(() => undefined)));
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
    upload.array("images", safeMaxFiles)(request, response, (error: unknown) => {
      if (error) {
        const candidate = error as { code?: string };
        const isLimit = candidate.code === "LIMIT_FILE_SIZE" || candidate.code === "LIMIT_FILE_COUNT";
        response.status(isLimit ? 413 : 400).json({
          error: {
            code: isLimit ? "UPLOAD_LIMIT_EXCEEDED" : "INVALID_MULTIPART_UPLOAD",
            message: isLimit
              ? "The upload exceeds the configured file count or per-file size limit."
              : "The multipart upload is invalid."
          }
        });
        return;
      }
      next();
    });
  },
  async (request, response) => {
    const files = (request.files ?? []) as Express.Multer.File[];
    try {
      if (files.length === 0) {
        const result = await service().uploadImages(request.params.workspaceId, request.params.batchId, []);
        response.status(200).json({ data: result });
        return;
      }

      const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
      if (totalBytes > safeMaxTotalBytes) {
        response.status(413).json({
          error: {
            code: "UPLOAD_TOTAL_LIMIT_EXCEEDED",
            message: `The combined upload must not exceed ${Math.round(safeMaxTotalBytes / (1024 * 1024))} MB.`
          }
        });
        return;
      }

      const accepted: Awaited<ReturnType<BatchService["uploadImages"]>>["accepted"] = [];
      const rejected: Awaited<ReturnType<BatchService["uploadImages"]>>["rejected"] = [];
      for (const file of files) {
        try {
          const image: UploadedImage = {
            buffer: await readFile(file.path),
            originalname: file.originalname,
            size: file.size
          };
          const result = await service().uploadImages(
            request.params.workspaceId,
            request.params.batchId,
            [image]
          );
          accepted.push(...result.accepted);
          rejected.push(...result.rejected);
        } catch {
          rejected.push({
            filename: path.basename(file.originalname).slice(0, 255) || "image",
            code: "STORAGE_OR_DATABASE_ERROR",
            message: "This image could not be saved. Other images in the batch may still have been accepted."
          });
        }
      }
      response.status(200).json({ data: { accepted, rejected } });
    } catch (error) {
      routeError(error, response);
    } finally {
      await cleanupTempFiles(files);
    }
  }
);
