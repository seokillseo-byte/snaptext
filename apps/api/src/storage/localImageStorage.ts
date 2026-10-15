import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const extensionByMime: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/tiff": ".tif",
  "image/bmp": ".bmp"
};

export interface StoredImage {
  storageKey: string;
  absolutePath: string;
}

export interface ImageStorage {
  put(bytes: Buffer, mimeType: string): Promise<StoredImage>;
  remove(storageKey: string): Promise<void>;
}

export class LocalImageStorage implements ImageStorage {
  private readonly root: string;

  constructor(root = process.env.STORAGE_ROOT ?? path.resolve(process.cwd(), ".snaptext-data/images")) {
    this.root = path.resolve(root);
  }

  async put(bytes: Buffer, mimeType: string): Promise<StoredImage> {
    const extension = extensionByMime[mimeType];
    if (!extension) {
      throw new Error("Unsupported image media type.");
    }

    await mkdir(this.root, { recursive: true, mode: 0o700 });
    const storageKey = `${randomUUID()}${extension}`;
    const absolutePath = path.join(this.root, storageKey);
    await writeFile(absolutePath, bytes, { flag: "wx", mode: 0o600 });
    return { storageKey, absolutePath };
  }

  async remove(storageKey: string): Promise<void> {
    if (path.basename(storageKey) !== storageKey) {
      throw new Error("Invalid storage key.");
    }
    await rm(path.join(this.root, storageKey), { force: true });
  }
}
