export interface OcrWord {
  text: string;
  confidence?: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface OcrInput {
  imageBuffer: Buffer;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/tiff";
  languageHints?: string[];
}

export interface OcrResult {
  text: string;
  words: OcrWord[];
  provider: string;
  providerVersion: string;
  durationMs: number;
  warnings: string[];
}

export interface OcrProvider {
  readonly id: string;
  readonly version: string;
  recognize(input: OcrInput): Promise<OcrResult>;
}

export class OcrNotConfiguredError extends Error {
  readonly code = "OCR_NOT_CONFIGURED";
  constructor() {
    super("No local OCR provider is configured.");
    this.name = "OcrNotConfiguredError";
  }
}

/**
 * Provider-neutral orchestration contract. A real local engine must be explicitly
 * injected by application composition; no remote/AI fallback is performed implicitly.
 */
export class OcrService {
  constructor(private readonly provider?: OcrProvider) {}

  async recognize(input: OcrInput): Promise<OcrResult> {
    if (!this.provider) throw new OcrNotConfiguredError();
    if (!Buffer.isBuffer(input.imageBuffer) || input.imageBuffer.length === 0) {
      throw Object.assign(new Error("Image content is required."), { code: "INVALID_IMAGE", statusCode: 400 });
    }
    const result = await this.provider.recognize(input);
    return {
      ...result,
      provider: this.provider.id,
      providerVersion: this.provider.version,
      durationMs: Math.max(0, result.durationMs),
      warnings: [...result.warnings]
    };
  }
}
