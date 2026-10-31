import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { ExtractionOptions, ExtractionResult } from "./types";
import { checkTesseractAvailability } from "./ocr-extractor";

const SCRIPT_PATH = path.join(
  process.cwd(),
  "src",
  "lib",
  "pdf",
  "scripts",
  "extract_pdf.py"
);

/**
 * Runs the hybrid text/OCR extraction script on a PDF file.
 */
export async function runPdfExtractionScript(
  filePath: string,
  uploadId: string,
  originalName: string,
  options: ExtractionOptions = {}
): Promise<ExtractionResult> {
  if (!fs.existsSync(filePath)) {
    throw new Error("PDF file not found at temporary storage location");
  }

  const ocrEnv = checkTesseractAvailability(options.tesseractPath);

  const args: string[] = [
    SCRIPT_PATH,
    "--input",
    filePath,
    "--min-text-length",
    (options.minTextLength ?? 50).toString(),
  ];

  if (options.mockOcr) {
    args.push("--mock-ocr");
  }

  if (options.tesseractPath || ocrEnv.executablePath) {
    const tessPath = options.tesseractPath || ocrEnv.executablePath;
    if (tessPath) {
      args.push("--tesseract-cmd", tessPath);
    }
  }

  // Find python command
  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  return new Promise((resolve, reject) => {
    const proc = spawn(pythonCmd, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let isTimedOut = false;

    const timeout = setTimeout(() => {
      isTimedOut = true;
      proc.kill("SIGTERM");
      reject(new Error("PDF text extraction timed out after 45 seconds"));
    }, 45000);

    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf-8");
    });

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf-8");
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      if (!isTimedOut) {
        reject(
          new Error(
            `Failed to start Python extraction process: ${err.message}. Ensure Python 3 and pypdf are available.`
          )
        );
      }
    });

    proc.on("close", (code) => {
      clearTimeout(timeout);
      if (isTimedOut) return;

      if (code !== 0 && !stdout.trim()) {
        reject(
          new Error(
            `PDF extraction process exited with code ${code}. Error: ${
              stderr.trim() || "Unknown error"
            }`
          )
        );
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        const result: ExtractionResult = {
          success: parsed.status !== "failed",
          uploadId,
          originalName,
          totalPages: parsed.totalPages || 0,
          status: parsed.status || "failed",
          pages: parsed.pages || [],
          summary: parsed.summary || {
            textPages: 0,
            ocrPages: 0,
            failedPages: 0,
            totalCharacters: 0,
            totalWords: 0,
          },
          tesseractAvailable: parsed.tesseractAvailable ?? ocrEnv.isInstalled,
          warnings: parsed.warnings || [],
          error: parsed.error || null,
        };

        resolve(result);
      } catch (err: any) {
        reject(
          new Error(
            `Failed to parse extraction output JSON: ${err.message}. Raw output: ${stdout.slice(
              0,
              200
            )}`
          )
        );
      }
    });
  });
}
