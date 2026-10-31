import { NextRequest, NextResponse } from "next/server";
import {
  saveQuotationFile,
  listQuotationFiles,
  getQuotationFile,
  deleteQuotationFile,
  clearAllQuotationFiles,
  StoredQuotationFile,
} from "@/lib/storage/temp-quotations";

export const dynamic = "force-dynamic";

/**
 * GET: Lists all uploaded temporary quotation files or streams a file if ?id=... is provided.
 */
export async function GET(request: NextRequest | Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("id");

    if (fileId) {
      const fileData = await getQuotationFile(fileId);
      if (!fileData) {
        return NextResponse.json(
          { success: false, error: "File not found" },
          { status: 404 }
        );
      }

      return new NextResponse(fileData.buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${encodeURIComponent(
            fileData.metadata.originalName
          )}"`,
          "Content-Length": fileData.buffer.length.toString(),
        },
      });
    }

    const files = await listQuotationFiles();
    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve quotation files" },
      { status: 500 }
    );
  }
}

/**
 * POST: Handles multiple PDF file uploads in multipart/form-data.
 */
export async function POST(request: NextRequest | Request) {
  try {
    const formData = await request.formData();
    const rawFiles: File[] = [];

    // Extract all files from formData (both 'files' and 'file' keys or any file values)
    for (const [key, value] of formData.entries()) {
      if (value && typeof value === "object" && "name" in value) {
        rawFiles.push(value as File);
      }
    }

    if (rawFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided in request" },
        { status: 400 }
      );
    }

    const uploaded: StoredQuotationFile[] = [];
    const errors: Array<{ fileName: string; error: string }> = [];

    for (const file of rawFiles) {
      try {
        let buffer: Buffer;
        if (typeof file.arrayBuffer === "function") {
          const ab = await file.arrayBuffer();
          buffer = Buffer.from(ab);
        } else if (typeof (file as any).bytes === "function") {
          const bytes = await (file as any).bytes();
          buffer = Buffer.from(bytes);
        } else if (typeof (file as any).text === "function") {
          const text = await (file as any).text();
          buffer = Buffer.from(text, "utf-8");
        } else {
          buffer = Buffer.from("");
        }

        const stored = await saveQuotationFile(
          buffer,
          file.name,
          file.type || "application/pdf"
        );
        uploaded.push(stored);
      } catch (err: any) {
        errors.push({
          fileName: file.name,
          error: err.message || "Validation or storage failed",
        });
      }
    }

    const isAllFailed = uploaded.length === 0 && errors.length > 0;
    const statusCode = isAllFailed ? 400 : 200;

    return NextResponse.json(
      {
        success: uploaded.length > 0,
        uploadedCount: uploaded.length,
        uploaded,
        errors,
      },
      { status: statusCode }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process PDF upload" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Deletes an individual file by ?id=... or clears all files if ?all=true.
 */
export async function DELETE(request: NextRequest | Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clearAll = searchParams.get("all") === "true";
    const fileId = searchParams.get("id");

    if (clearAll) {
      const removedCount = await clearAllQuotationFiles();
      return NextResponse.json({
        success: true,
        message: `Successfully cleared ${removedCount} temporary files`,
        clearedCount: removedCount,
      });
    }

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: "Missing required 'id' parameter or 'all=true'" },
        { status: 400 }
      );
    }

    const deleted = await deleteQuotationFile(fileId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "File not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "File successfully removed from temporary storage",
      id: fileId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete file" },
      { status: 500 }
    );
  }
}
