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

export interface SourceImageRecord {
  id: string;
  batchId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewSourceImage {
  batchId: string;
  originalFilename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
}

export interface UploadedSourceImageRecord {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  status: "UPLOADED";
}

export interface PageResult<T> {
  items: T[];
  total: number;
}

export interface BatchRepository {
  createWorkspace(name: string): Promise<WorkspaceRecord>;
  getWorkspace(workspaceId: string): Promise<WorkspaceRecord | null>;
  listWorkspaces(limit: number, offset: number): Promise<PageResult<WorkspaceRecord>>;
  createBatch(workspaceId: string, name: string): Promise<BatchRecord>;
  getBatch(workspaceId: string, batchId: string): Promise<BatchRecord | null>;
  listBatches(workspaceId: string, limit: number, offset: number): Promise<PageResult<BatchRecord>>;
  listImages(workspaceId: string, batchId: string, limit: number, offset: number): Promise<PageResult<SourceImageRecord>>;
  getImage(workspaceId: string, batchId: string, imageId: string): Promise<SourceImageRecord | null>;
  batchExistsInWorkspace(workspaceId: string, batchId: string): Promise<boolean>;
  insertSourceImage(image: NewSourceImage): Promise<UploadedSourceImageRecord | null>;
}
