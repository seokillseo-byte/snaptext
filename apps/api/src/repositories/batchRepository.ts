export interface WorkspaceRecord {
  id: string;
  name: string;
  createdAt: string;
}

export interface BatchRecord {
  id: string;
  workspaceId: string;
  name: string;
  status: string;
  totalImages: number;
  createdAt: string;
}

export interface NewSourceImage {
  batchId: string;
  originalFilename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
}

export interface SourceImageRecord {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  status: "UPLOADED";
}

export interface BatchRepository {
  createWorkspace(name: string): Promise<WorkspaceRecord>;
  createBatch(workspaceId: string, name: string): Promise<BatchRecord>;
  batchExistsInWorkspace(workspaceId: string, batchId: string): Promise<boolean>;
  insertSourceImage(image: NewSourceImage): Promise<SourceImageRecord | null>;
}
