import fs from "fs";
import path from "path";
import os from "os";

// Directory for temporary report exports
const TEMP_REPORTS_DIR = path.join(os.tmpdir(), "gathbandhan_quotation_reports");

/**
 * Ensures the temporary reports directory exists.
 */
function ensureTempDir(): void {
  if (!fs.existsSync(TEMP_REPORTS_DIR)) {
    fs.mkdirSync(TEMP_REPORTS_DIR, { recursive: true });
  }
}

/**
 * Generates a safe, sanitized filename.
 */
export function generateSafeReportFilename(
  format: "pdf" | "xlsx",
  eventName?: string
): { filename: string; reportId: string } {
  const reportId = crypto.randomUUID();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const cleanEvent = eventName
    ? eventName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30)
    : "Vendors";

  const filename = `Gathbandhan_Quotation_Comparison_${cleanEvent}_${timestamp}.${format}`;
  return { filename, reportId };
}

/**
 * Saves a report buffer to temporary storage.
 */
export async function saveTemporaryReport(
  buffer: Buffer | Uint8Array,
  filename: string
): Promise<{ filePath: string; filename: string }> {
  ensureTempDir();

  // Validate filename to prevent path traversal
  const safeBase = path.basename(filename);
  const targetPath = path.join(TEMP_REPORTS_DIR, safeBase);

  await fs.promises.writeFile(targetPath, buffer);
  return { filePath: targetPath, filename: safeBase };
}

/**
 * Deletes temporary report files older than specified age (default 30 mins).
 */
export async function cleanupExpiredReports(maxAgeMs: number = 30 * 60 * 1000): Promise<number> {
  if (!fs.existsSync(TEMP_REPORTS_DIR)) return 0;

  let cleaned = 0;
  const now = Date.now();

  try {
    const files = await fs.promises.readdir(TEMP_REPORTS_DIR);
    for (const file of files) {
      const fullPath = path.join(TEMP_REPORTS_DIR, file);
      try {
        const stats = await fs.promises.stat(fullPath);
        if (now - stats.mtimeMs >= maxAgeMs) {
          await fs.promises.unlink(fullPath);
          cleaned++;
        }
      } catch {
        // Ignore single file unlink error
      }
    }
  } catch {
    // Ignore dir read error
  }

  return cleaned;
}

/**
 * Clears all temporary reports (useful in tests).
 */
export async function clearAllTemporaryReports(): Promise<void> {
  if (!fs.existsSync(TEMP_REPORTS_DIR)) return;

  try {
    const files = await fs.promises.readdir(TEMP_REPORTS_DIR);
    for (const file of files) {
      await fs.promises.unlink(path.join(TEMP_REPORTS_DIR, file)).catch(() => {});
    }
  } catch {
    // Ignore
  }
}
