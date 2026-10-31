import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

export interface StoredQuotationFile {
  id: string;
  originalName: string;
  sanitizedName: string;
  storedFileName: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  filePath: string;
}

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

let customStorageDir: string | null = null;

export function setCustomStorageDir(dir: string | null) {
  customStorageDir = dir;
}

function getStorageBaseDir(): string {
  return customStorageDir || path.join(os.tmpdir(), "gathbandhan_quotation_analyzer");
}

function getMetadataFilePath(): string {
  return path.join(getStorageBaseDir(), "quotations_index.json");
}

/**
 * Ensures the temporary directory and index file exist.
 */
async function ensureStorageDir(): Promise<void> {
  const dir = getStorageBaseDir();
  const metaFile = getMetadataFilePath();
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(metaFile);
  } catch {
    await fs.writeFile(metaFile, JSON.stringify([]), "utf-8");
  }
}

/**
 * Reads the stored quotation index.
 */
async function readIndex(): Promise<StoredQuotationFile[]> {
  await ensureStorageDir();
  try {
    const raw = await fs.readFile(getMetadataFilePath(), "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Writes the updated index.
 */
async function writeIndex(index: StoredQuotationFile[]): Promise<void> {
  await ensureStorageDir();
  await fs.writeFile(getMetadataFilePath(), JSON.stringify(index, null, 2), "utf-8");
}

/**
 * Validates whether the given buffer and filename represent a valid PDF.
 * Checks magic numbers (%PDF-) and file extensions.
 */
export function validatePDF(
  buffer: Buffer,
  originalName: string,
  mimeType?: string
): { valid: boolean; error?: string } {
  if (!originalName.toLowerCase().endsWith(".pdf")) {
    return { valid: false, error: "File extension must be .pdf" };
  }

  if (mimeType && mimeType !== "application/pdf" && mimeType !== "application/x-pdf") {
    return { valid: false, error: `Invalid MIME type: ${mimeType}. Expected application/pdf` };
  }

  if (buffer.length < 5) {
    return { valid: false, error: "File is empty or corrupted" };
  }

  const magicBytes = buffer.subarray(0, 5).toString("ascii");
  if (!magicBytes.startsWith("%PDF-")) {
    return { valid: false, error: "Invalid PDF header magic bytes (must start with %PDF-)" };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 25MB limit (${(buffer.length / (1024 * 1024)).toFixed(1)}MB)`,
    };
  }

  return { valid: true };
}

/**
 * Stores a PDF file temporarily in the storage directory.
 */
export async function saveQuotationFile(
  buffer: Buffer,
  originalName: string,
  mimeType = "application/pdf"
): Promise<StoredQuotationFile> {
  const validation = validatePDF(buffer, originalName, mimeType);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid PDF file");
  }

  await ensureStorageDir();

  const id = crypto.randomUUID();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedFileName = `${id}_${sanitizedName}`;
  const filePath = path.join(getStorageBaseDir(), storedFileName);

  await fs.writeFile(filePath, buffer);

  const metadata: StoredQuotationFile = {
    id,
    originalName,
    sanitizedName,
    storedFileName,
    sizeBytes: buffer.length,
    mimeType: "application/pdf",
    uploadedAt: new Date().toISOString(),
    filePath,
  };

  const index = await readIndex();
  index.unshift(metadata);
  await writeIndex(index);

  return metadata;
}

/**
 * Lists all active temporary quotation files.
 */
export async function listQuotationFiles(): Promise<StoredQuotationFile[]> {
  const index = await readIndex();
  const verified: StoredQuotationFile[] = [];
  for (const item of index) {
    try {
      await fs.access(item.filePath);
      verified.push(item);
    } catch {
      // file missing, omit
    }
  }

  if (verified.length !== index.length) {
    await writeIndex(verified);
  }

  return verified;
}

/**
 * Retrieves a quotation file by ID along with its buffer.
 */
export async function getQuotationFile(
  id: string
): Promise<{ metadata: StoredQuotationFile; buffer: Buffer } | null> {
  const index = await readIndex();
  const fileMeta = index.find((item) => item.id === id);
  if (!fileMeta) return null;

  try {
    const buffer = await fs.readFile(fileMeta.filePath);
    return { metadata: fileMeta, buffer };
  } catch {
    return null;
  }
}

/**
 * Deletes a single quotation file by ID.
 */
export async function deleteQuotationFile(id: string): Promise<boolean> {
  const index = await readIndex();
  const targetIndex = index.findIndex((item) => item.id === id);
  if (targetIndex === -1) return false;

  const [removed] = index.splice(targetIndex, 1);
  try {
    await fs.unlink(removed.filePath);
  } catch {
    // Ignore if file was already deleted
  }

  await writeIndex(index);
  return true;
}

/**
 * Clears all temporary quotation files.
 */
export async function clearAllQuotationFiles(): Promise<number> {
  const index = await readIndex();
  let count = 0;

  for (const item of index) {
    try {
      await fs.unlink(item.filePath);
      count++;
    } catch {
      // Ignore
    }
  }

  await writeIndex([]);
  return count;
}
