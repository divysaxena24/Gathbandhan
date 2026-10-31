import { describe, it, expect, beforeEach, afterAll } from "vitest";
import path from "path";
import os from "os";
import fs from "fs/promises";
import {
  validatePDF,
  saveQuotationFile,
  listQuotationFiles,
  getQuotationFile,
  deleteQuotationFile,
  clearAllQuotationFiles,
  setCustomStorageDir,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/storage/temp-quotations";

describe("Temporary Quotation Storage & PDF Validation Pipeline", () => {
  const testStorageDir = path.join(os.tmpdir(), "gath_test_storage_unit_" + Date.now());

  beforeEach(async () => {
    setCustomStorageDir(testStorageDir);
    await clearAllQuotationFiles();
  });

  afterAll(async () => {
    await clearAllQuotationFiles();
    try {
      await fs.rm(testStorageDir, { recursive: true, force: true });
    } catch {}
    setCustomStorageDir(null);
  });

  const dummyPdfHeader = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
  const validPdfBuffer = Buffer.from(dummyPdfHeader, "utf-8");

  describe("PDF Validation", () => {
    it("accepts a valid PDF buffer with .pdf extension and proper magic bytes", () => {
      const result = validatePDF(validPdfBuffer, "proposal_catering.pdf", "application/pdf");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("rejects files with non-pdf extensions", () => {
      const result = validatePDF(validPdfBuffer, "proposal_catering.docx", "application/pdf");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("must be .pdf");
    });

    it("rejects files with invalid MIME types", () => {
      const result = validatePDF(validPdfBuffer, "proposal.pdf", "image/png");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid MIME type");
    });

    it("rejects files missing the %PDF- header magic bytes", () => {
      const invalidBuffer = Buffer.from("NOT_A_PDF_FILE_HEADER", "utf-8");
      const result = validatePDF(invalidBuffer, "fake.pdf", "application/pdf");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid PDF header magic bytes");
    });

    it("rejects files that exceed the maximum size limit", () => {
      const oversizedBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 100);
      oversizedBuffer.write("%PDF-", 0, "ascii");

      const result = validatePDF(oversizedBuffer, "large.pdf", "application/pdf");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds the 25MB limit");
    });
  });

  describe("File CRUD Operations", () => {
    it("successfully saves a PDF file and retrieves its metadata", async () => {
      const stored = await saveQuotationFile(
        validPdfBuffer,
        "Royal_Catering_Quote.pdf",
        "application/pdf"
      );

      expect(stored.id).toBeDefined();
      expect(stored.originalName).toBe("Royal_Catering_Quote.pdf");
      expect(stored.sizeBytes).toBe(validPdfBuffer.length);

      const files = await listQuotationFiles();
      expect(files.some((f) => f.id === stored.id)).toBe(true);
    });

    it("retrieves stored file content matching original buffer", async () => {
      const stored = await saveQuotationFile(
        validPdfBuffer,
        "Photography_Vendor.pdf",
        "application/pdf"
      );

      const retrieved = await getQuotationFile(stored.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.metadata.id).toBe(stored.id);
      expect(retrieved?.buffer.toString("utf-8")).toBe(validPdfBuffer.toString("utf-8"));
    });

    it("deletes a specific file by ID", async () => {
      const stored = await saveQuotationFile(
        validPdfBuffer,
        "Decor_Vendor.pdf",
        "application/pdf"
      );

      const deleteResult = await deleteQuotationFile(stored.id);
      expect(deleteResult).toBe(true);

      const retrieved = await getQuotationFile(stored.id);
      expect(retrieved).toBeNull();
    });

    it("clears all stored files", async () => {
      await saveQuotationFile(validPdfBuffer, "Quote_1.pdf");
      await saveQuotationFile(validPdfBuffer, "Quote_2.pdf");

      let files = await listQuotationFiles();
      expect(files.length).toBe(2);

      const clearedCount = await clearAllQuotationFiles();
      expect(clearedCount).toBe(2);

      files = await listQuotationFiles();
      expect(files.length).toBe(0);
    });
  });
});
