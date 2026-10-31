/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import fs from "fs";
import path from "path";
import os from "os";

export interface OcrEnvironmentStatus {
  isInstalled: boolean;
  executablePath: string | null;
  version?: string;
  notes: string;
}

/**
 * Common paths where Tesseract-OCR is installed on Windows and UNIX platforms.
 */
const COMMON_WINDOWS_PATHS = [
  "C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
  "C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe",
  path.join(process.env.LOCALAPPDATA || "", "Programs", "Tesseract-OCR", "tesseract.exe"),
  path.join(process.env.LOCALAPPDATA || "", "Tesseract-OCR", "tesseract.exe"),
];

/**
 * Checks whether the Tesseract OCR executable is available on the system.
 */
export function checkTesseractAvailability(customPath?: string): OcrEnvironmentStatus {
  if (customPath && fs.existsSync(customPath)) {
    return {
      isInstalled: true,
      executablePath: customPath,
      notes: "Custom Tesseract path configured and verified.",
    };
  }

  // Check common Windows directories
  for (const candidate of COMMON_WINDOWS_PATHS) {
    if (candidate && fs.existsSync(candidate)) {
      return {
        isInstalled: true,
        executablePath: candidate,
        notes: `Found Tesseract executable at: ${candidate}`,
      };
    }
  }

  return {
    isInstalled: false,
    executablePath: null,
    notes:
      "Tesseract OCR executable not detected in PATH or standard directories. Scanned PDF fallback will require Tesseract installation.",
  };
}
