import { describe, it, expect, beforeEach, afterAll } from "vitest";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { execSync } from "child_process";
import { extractQuotationPdf, clearExtractionCache } from "@/lib/pdf/extraction-service";
import { POST as extractPostRoute } from "@/app/api/quotation-analyzer/extract/route";
import {
  saveQuotationFile,
  clearAllQuotationFiles,
  setCustomStorageDir,
} from "@/lib/storage/temp-quotations";

describe("Milestone 2: Hybrid PDF Text Extraction & OCR Pipeline", { timeout: 30000 }, () => {
  const testDir = path.join(os.tmpdir(), "gath_test_extract_service_" + Date.now());

  beforeEach(async () => {
    setCustomStorageDir(testDir);
    clearExtractionCache();
    await clearAllQuotationFiles();
    await fs.mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    await clearAllQuotationFiles();
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
    setCustomStorageDir(null);
  });

  // Helper to generate a digital PDF with exact text
  function createDigitalPdfBuffer(text: string): Buffer {
    const rawPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length ${text.length + 50} >> stream
BT
/F1 12 Tf
50 700 Td
(${text}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000224 00000 n 
0000000293 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
450
%%EOF`;
    return Buffer.from(rawPdf, "utf-8");
  }

  // Reliable helper to run a python snippet via a temporary script
  async function generatePythonPdf(pyScript: string) {
    const scriptPath = path.join(
      testDir,
      `gen_${Date.now()}_${Math.random().toString(36).slice(2)}.py`
    );
    await fs.writeFile(scriptPath, pyScript, "utf-8");
    try {
      execSync(`python "${scriptPath}"`, { stdio: "pipe" });
    } finally {
      try {
        await fs.unlink(scriptPath);
      } catch {}
    }
  }

  it("extracts digital text from digitally generated PDFs", async () => {
    const digitalText =
      "Royal Palace Caterers - Grand Wedding Package - Rs 3,500 per plate with 5% GST included.";
    const buffer = createDigitalPdfBuffer(digitalText);
    const file = await saveQuotationFile(buffer, "digital_catering.pdf");

    const result = await extractQuotationPdf(file.id);

    expect(result.success).toBe(true);
    expect(result.totalPages).toBe(1);
    expect(result.status).toBe("completed");
    expect(result.pages[0].pageNumber).toBe(1);
    expect(result.pages[0].method).toBe("text");
    expect(result.pages[0].text).toContain("Royal Palace Caterers");
    expect(result.pages[0].confidence).toBeNull(); // Confidence is not invented for digital text
    expect(result.summary.textPages).toBe(1);
    expect(result.summary.ocrPages).toBe(0);
  });

  it("handles scanned PDFs using OCR fallback (with mock OCR)", async () => {
    const scannedPdfPath = path.join(testDir, "scanned_invoice.pdf").replace(/\\/g, "/");

    await generatePythonPdf(`
from PIL import Image
img = Image.new('RGB', (200, 200), color='white')
img.save('${scannedPdfPath}')
`);

    const buffer = await fs.readFile(scannedPdfPath);
    const file = await saveQuotationFile(buffer, "scanned_invoice.pdf");

    const result = await extractQuotationPdf(file.id, { mockOcr: true });

    expect(result.success).toBe(true);
    expect(result.totalPages).toBe(1);
    expect(result.pages[0].method).toBe("ocr");
    expect(result.pages[0].confidence).toBeGreaterThan(0);
    expect(result.summary.ocrPages).toBe(1);
    expect(result.pages[0].text).toContain("OCR Extracted from Page 1");
  });

  it("extracts mixed PDFs containing digital and scanned pages with preserved order", async () => {
    const mixedPdfPath = path.join(testDir, "mixed_proposal.pdf").replace(/\\/g, "/");

    const pyCode = `
import pypdf
from PIL import Image
import io

writer = pypdf.PdfWriter()

# Page 1: Digital text page
raw_p1 = b'''%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 90 >> stream
BT
/F1 12 Tf
50 700 Td
(Page 1: Digital Overview of Decor Services, Lighting and Floral Arrangements) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000224 00000 n 
0000000293 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
420
%%EOF'''
r1 = pypdf.PdfReader(io.BytesIO(raw_p1))
writer.add_page(r1.pages[0])

# Page 2: Scanned image page via PIL
img_stream = io.BytesIO()
Image.new('RGB', (300, 300), color='white').save(img_stream, format='PDF')
img_stream.seek(0)
r2 = pypdf.PdfReader(img_stream)
writer.add_page(r2.pages[0])

with open('${mixedPdfPath}', 'wb') as f:
    writer.write(f)
`;
    await generatePythonPdf(pyCode);

    const buffer = await fs.readFile(mixedPdfPath);
    const file = await saveQuotationFile(buffer, "mixed_proposal.pdf");

    const result = await extractQuotationPdf(file.id, { mockOcr: true });

    expect(result.success).toBe(true);
    expect(result.totalPages).toBe(2);
    expect(result.pages[0].pageNumber).toBe(1);
    expect(result.pages[0].method).toBe("text");
    expect(result.pages[0].text).toContain("Digital Overview");

    expect(result.pages[1].pageNumber).toBe(2);
    expect(result.pages[1].method).toBe("ocr");
    expect(result.pages[1].text).toContain("OCR Extracted from Page 2");

    expect(result.summary.textPages).toBe(1);
    expect(result.summary.ocrPages).toBe(1);
  });

  it("detects empty pages and reports them with warnings without failing", async () => {
    const emptyPdfPath = path.join(testDir, "empty_pages.pdf").replace(/\\/g, "/");

    const pyCode = `
import pypdf
writer = pypdf.PdfWriter()
writer.add_blank_page(width=300, height=300)
with open('${emptyPdfPath}', 'wb') as f:
    writer.write(f)
`;
    await generatePythonPdf(pyCode);

    const buffer = await fs.readFile(emptyPdfPath);
    const file = await saveQuotationFile(buffer, "empty_pages.pdf");

    const result = await extractQuotationPdf(file.id);

    expect(result.success).toBe(true);
    expect(result.totalPages).toBe(1);
    expect(result.pages[0].status).toBe("warning");
    expect(result.pages[0].warnings.some((w) => w.toLowerCase().includes("empty"))).toBe(true);
  });

  it("handles corrupted or malformed PDFs safely", async () => {
    const corruptBuffer = Buffer.from("%PDF-1.4 corrupted invalid content %%EOF", "utf-8");
    const file = await saveQuotationFile(corruptBuffer, "corrupt.pdf");

    const result = await extractQuotationPdf(file.id);

    expect(result.success).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.error).toBeDefined();
    expect(result.pages.length).toBe(0);
  });

  it("handles password-protected encrypted PDFs safely", async () => {
    const encryptedPdfPath = path.join(testDir, "encrypted.pdf").replace(/\\/g, "/");

    const pyCode = `
import pypdf
writer = pypdf.PdfWriter()
writer.add_blank_page(width=300, height=300)
writer.encrypt('top_secret_pass')
with open('${encryptedPdfPath}', 'wb') as f:
    writer.write(f)
`;
    await generatePythonPdf(pyCode);

    const buffer = await fs.readFile(encryptedPdfPath);
    const file = await saveQuotationFile(buffer, "encrypted.pdf");

    const result = await extractQuotationPdf(file.id);

    expect(result.success).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.error?.toLowerCase()).toContain("password");
  });

  it("rejects extraction for unknown or missing upload IDs", async () => {
    await expect(extractQuotationPdf("non-existent-uuid")).rejects.toThrow(
      /not found/i
    );
  });

  it("ensures no server filesystem paths are exposed in results", async () => {
    const digitalText = "Sample Vendor Quote - Rs 50,000";
    const buffer = createDigitalPdfBuffer(digitalText);
    const file = await saveQuotationFile(buffer, "quote_clean.pdf");

    const result = await extractQuotationPdf(file.id);

    const resultJson = JSON.stringify(result);
    // Ensure no Windows drives or temp directory names leak
    expect(resultJson).not.toContain("C:\\");
    expect(resultJson).not.toContain("D:\\");
    expect(resultJson).not.toContain("gathbandhan_quotation_analyzer");
  });

  it("handles POST /api/quotation-analyzer/extract API route successfully", async () => {
    const text = "Mandap Decor Proposal - Floral canopy, royal aisle, LED backdrops - Total Rs 4,50,000";
    const buffer = createDigitalPdfBuffer(text);
    const file = await saveQuotationFile(buffer, "mandap_decor.pdf");

    const req = {
      json: async () => ({ uploadId: file.id }),
    } as any;

    const res = await extractPostRoute(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.uploadId).toBe(file.id);
    expect(data.pages[0].text).toContain("Mandap Decor Proposal");
  });

  it("returns 400 when POST /api/quotation-analyzer/extract is called without uploadId", async () => {
    const req = {
      json: async () => ({}),
    } as any;

    const res = await extractPostRoute(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain("uploadId");
  });
});

