import { describe, it, expect, beforeEach, afterAll } from "vitest";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { GET, POST, DELETE } from "@/app/api/quotation-analyzer/upload/route";
import {
  clearAllQuotationFiles,
  saveQuotationFile,
  setCustomStorageDir,
} from "@/lib/storage/temp-quotations";

describe("Quotation Analyzer API Endpoints", () => {
  const dummyPdfHeader = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
  const dummyBuffer = Buffer.from(dummyPdfHeader, "utf-8");
  const testApiStorageDir = path.join(os.tmpdir(), "gath_test_api_storage_" + Date.now());

  beforeEach(async () => {
    setCustomStorageDir(testApiStorageDir);
    await clearAllQuotationFiles();
  });

  afterAll(async () => {
    await clearAllQuotationFiles();
    try {
      await fs.rm(testApiStorageDir, { recursive: true, force: true });
    } catch {}
    setCustomStorageDir(null);
  });

  it("handles valid multiple PDF uploads via POST", async () => {
    const formData = new Map();
    const mockFile1 = {
      name: "Quote_Catering.pdf",
      type: "application/pdf",
      arrayBuffer: async () => dummyBuffer.buffer.slice(dummyBuffer.byteOffset, dummyBuffer.byteOffset + dummyBuffer.byteLength),
    };
    const mockFile2 = {
      name: "Quote_Photography.pdf",
      type: "application/pdf",
      arrayBuffer: async () => dummyBuffer.buffer.slice(dummyBuffer.byteOffset, dummyBuffer.byteOffset + dummyBuffer.byteLength),
    };

    formData.set("file_0", mockFile1);
    formData.set("file_1", mockFile2);

    const req = {
      formData: async () => formData,
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.uploadedCount).toBe(2);
    expect(data.uploaded.length).toBe(2);
    expect(data.uploaded[0].originalName).toBe("Quote_Catering.pdf");
  });

  it("rejects non-PDF files in upload request", async () => {
    const formData = new Map();
    const badFile = {
      name: "notes.txt",
      type: "text/plain",
      arrayBuffer: async () => Buffer.from("plain text notes").buffer,
    };
    formData.set("file_0", badFile);

    const req = {
      formData: async () => formData,
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.errors.length).toBe(1);
    expect(data.errors[0].error).toContain("must be .pdf");
  });

  it("lists all stored quotations via GET", async () => {
    await saveQuotationFile(dummyBuffer, "Test_Quote.pdf");

    const req = {
      url: "http://localhost:3000/api/quotation-analyzer/upload",
    } as any;

    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.files)).toBe(true);
    expect(data.files.length).toBe(1);
    expect(data.files[0].originalName).toBe("Test_Quote.pdf");
  });

  it("clears all uploaded quotations via DELETE with ?all=true", async () => {
    await saveQuotationFile(dummyBuffer, "To_Delete.pdf");

    const req = {
      url: "http://localhost:3000/api/quotation-analyzer/upload?all=true",
    } as any;

    const res = await DELETE(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.clearedCount).toBe(1);
  });
});
