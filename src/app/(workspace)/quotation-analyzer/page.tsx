"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UploadCloud,
  FileText,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  FolderOpen,
  ArrowUpRight,
  ShieldCheck,
  FileCheck2,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface QueueFile {
  localId: string;
  file?: File;
  name: string;
  sizeBytes: number;
  status: "pending" | "uploading" | "uploaded" | "error";
  progress: number;
  serverId?: string;
  serverPath?: string;
  uploadedAt?: string;
  errorMessage?: string;
  previewUrl?: string;
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function QuotationAnalyzerPage() {
  const [fileQueue, setFileQueue] = useState<QueueFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [previewFile, setPreviewFile] = useState<QueueFile | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch already uploaded temporary files on initial mount
  const fetchExistingFiles = useCallback(async () => {
    try {
      setIsLoadingExisting(true);
      const res = await fetch("/api/quotation-analyzer/upload");
      if (!res.ok) throw new Error("Failed to load existing files");
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        const existing: QueueFile[] = data.files.map((f: any) => ({
          localId: f.id,
          name: f.originalName,
          sizeBytes: f.sizeBytes,
          status: "uploaded",
          progress: 100,
          serverId: f.id,
          serverPath: f.filePath,
          uploadedAt: f.uploadedAt,
          previewUrl: `/api/quotation-analyzer/upload?id=${f.id}`,
        }));

        setFileQueue((prev) => {
          // Merge avoiding duplicates by serverId/localId
          const existingIds = new Set(existing.map((e) => e.serverId));
          const localPending = prev.filter((p) => p.status === "pending" && !existingIds.has(p.name));
          return [...existing, ...localPending];
        });
      }
    } catch (err: any) {
      console.warn("Could not retrieve initial files:", err);
    } finally {
      setIsLoadingExisting(false);
    }
  }, []);

  useEffect(() => {
    fetchExistingFiles();
  }, [fetchExistingFiles]);

  // Handle validating and staging files
  const stageFiles = (files: FileList | File[]) => {
    const newItems: QueueFile[] = [];
    const rejectedFiles: string[] = [];
    const duplicateFiles: string[] = [];

    Array.from(files).forEach((file) => {
      // 1. Extension and MIME type check
      const isPdfExtension = file.name.toLowerCase().endsWith(".pdf");
      const isPdfMime = file.type === "application/pdf" || file.type === "";

      if (!isPdfExtension || !isPdfMime) {
        rejectedFiles.push(`${file.name} (only PDF documents allowed)`);
        return;
      }

      // 2. Size validation
      if (file.size > MAX_FILE_SIZE_BYTES) {
        rejectedFiles.push(`${file.name} (${formatBytes(file.size)} exceeds 25MB limit)`);
        return;
      }

      // 3. Duplicate check in current queue
      const isDuplicate = fileQueue.some(
        (q) => q.name.toLowerCase() === file.name.toLowerCase() && q.sizeBytes === file.size
      );

      if (isDuplicate) {
        duplicateFiles.push(file.name);
        return;
      }

      const previewUrl = URL.createObjectURL(file);

      newItems.push({
        localId: crypto.randomUUID(),
        file,
        name: file.name,
        sizeBytes: file.size,
        status: "pending",
        progress: 0,
        previewUrl,
      });
    });

    if (rejectedFiles.length > 0) {
      toast.error(`Rejected ${rejectedFiles.length} file(s)`, {
        description: rejectedFiles.join(", "),
      });
    }

    if (duplicateFiles.length > 0) {
      toast.warning(`Skipped ${duplicateFiles.length} duplicate file(s)`, {
        description: duplicateFiles.join(", "),
      });
    }

    if (newItems.length > 0) {
      setFileQueue((prev) => [...prev, ...newItems]);
      toast.success(`Added ${newItems.length} quotation PDF(s) to queue`);
    }
  };

  // Drag and Drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      stageFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      stageFiles(e.target.files);
    }
    // Reset input so same file can be selected again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload an individual file to backend
  const uploadSingleFile = async (localId: string) => {
    const target = fileQueue.find((item) => item.localId === localId);
    if (!target || !target.file) return;

    setFileQueue((prev) =>
      prev.map((item) =>
        item.localId === localId
          ? { ...item, status: "uploading", progress: 25, errorMessage: undefined }
          : item
      )
    );

    try {
      const formData = new FormData();
      formData.append("files", target.file);

      // Simulate step progress for visual polish
      setFileQueue((prev) =>
        prev.map((item) => (item.localId === localId ? { ...item, progress: 65 } : item))
      );

      const res = await fetch("/api/quotation-analyzer/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.uploaded || data.uploaded.length === 0) {
        const errorMsg =
          data.errors?.[0]?.error || data.error || "Server upload validation failed";
        throw new Error(errorMsg);
      }

      const uploadedInfo = data.uploaded[0];

      setFileQueue((prev) =>
        prev.map((item) =>
          item.localId === localId
            ? {
                ...item,
                status: "uploaded",
                progress: 100,
                serverId: uploadedInfo.id,
                serverPath: uploadedInfo.filePath,
                uploadedAt: uploadedInfo.uploadedAt,
                previewUrl: `/api/quotation-analyzer/upload?id=${uploadedInfo.id}`,
              }
            : item
        )
      );

      toast.success(`Uploaded ${target.name} successfully!`);
    } catch (err: any) {
      setFileQueue((prev) =>
        prev.map((item) =>
          item.localId === localId
            ? { ...item, status: "error", progress: 0, errorMessage: err.message }
            : item
        )
      );
      toast.error(`Upload failed: ${target.name}`, { description: err.message });
    }
  };

  // Upload all pending files in batch
  const uploadAllPendingFiles = async () => {
    const pendingFiles = fileQueue.filter((item) => item.status === "pending" && item.file);
    if (pendingFiles.length === 0) {
      toast.info("No pending files to upload");
      return;
    }

    setIsUploadingAll(true);

    // Set all pending to uploading
    setFileQueue((prev) =>
      prev.map((item) =>
        item.status === "pending" ? { ...item, status: "uploading", progress: 20 } : item
      )
    );

    try {
      const formData = new FormData();
      pendingFiles.forEach((item) => {
        if (item.file) {
          formData.append("files", item.file);
        }
      });

      const res = await fetch("/api/quotation-analyzer/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok && (!data.uploaded || data.uploaded.length === 0)) {
        throw new Error(data.error || "Failed to upload batch");
      }

      // Update state with results
      setFileQueue((prev) =>
        prev.map((item) => {
          if (item.status !== "uploading") return item;

          const match = data.uploaded?.find(
            (u: any) => u.originalName.toLowerCase() === item.name.toLowerCase()
          );

          if (match) {
            return {
              ...item,
              status: "uploaded",
              progress: 100,
              serverId: match.id,
              serverPath: match.filePath,
              uploadedAt: match.uploadedAt,
              previewUrl: `/api/quotation-analyzer/upload?id=${match.id}`,
            };
          }

          const errorMatch = data.errors?.find(
            (e: any) => e.fileName.toLowerCase() === item.name.toLowerCase()
          );

          if (errorMatch) {
            return {
              ...item,
              status: "error",
              progress: 0,
              errorMessage: errorMatch.error,
            };
          }

          return item;
        })
      );

      const count = data.uploadedCount || data.uploaded?.length || 0;
      toast.success(`Successfully uploaded ${count} quotation(s) to temporary storage!`);

      if (data.errors && data.errors.length > 0) {
        toast.warning(`${data.errors.length} file(s) encountered errors`);
      }
    } catch (err: any) {
      toast.error("Batch upload failed", { description: err.message });
      setFileQueue((prev) =>
        prev.map((item) =>
          item.status === "uploading"
            ? { ...item, status: "error", progress: 0, errorMessage: err.message }
            : item
        )
      );
    } finally {
      setIsUploadingAll(false);
    }
  };

  // Remove a single file from queue and temporary server storage
  const removeFile = async (localId: string) => {
    const item = fileQueue.find((f) => f.localId === localId);
    if (!item) return;

    if (item.serverId) {
      try {
        await fetch(`/api/quotation-analyzer/upload?id=${item.serverId}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.warn("Failed to delete file on server:", err);
      }
    }

    if (item.previewUrl && item.file) {
      URL.revokeObjectURL(item.previewUrl);
    }

    setFileQueue((prev) => prev.filter((f) => f.localId !== localId));
    toast.info(`Removed ${item.name}`);
  };

  // Clear all files
  const clearAllFiles = async () => {
    if (fileQueue.length === 0) return;

    try {
      await fetch("/api/quotation-analyzer/upload?all=true", {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Failed to clear server temporary storage:", err);
    }

    fileQueue.forEach((item) => {
      if (item.previewUrl && item.file) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    setFileQueue([]);
    toast.success("Quotation queue cleared completely");
  };

  // Computed summary metrics
  const totalFiles = fileQueue.length;
  const uploadedCount = fileQueue.filter((f) => f.status === "uploaded").length;
  const pendingCount = fileQueue.filter((f) => f.status === "pending").length;
  const errorCount = fileQueue.filter((f) => f.status === "error").length;
  const totalSizeBytes = fileQueue.reduce((acc, curr) => acc + curr.sizeBytes, 0);

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="AI Quotation Analyzer"
        description="Luxury multi-vendor quotation ingestion engine. Upload and stage PDF proposals for automated line-item extraction and landed-cost audits."
      >
        <div className="flex items-center gap-2">
          {totalFiles > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFiles}
              className="border-charcoal-200 text-charcoal-700 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Clear Queue
            </Button>
          )}

          {pendingCount > 0 && (
            <Button
              size="sm"
              onClick={uploadAllPendingFiles}
              disabled={isUploadingAll}
              className="bg-gold hover:bg-gold-600 text-charcoal-900 font-semibold shadow-sm"
            >
              {isUploadingAll ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Uploading ({pendingCount})...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 mr-1.5" />
                  Upload All Pending ({pendingCount})
                </>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchExistingFiles}
            title="Refresh temporary storage"
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </PageHeader>

      {/* Milestone & Pipeline Status Banner */}
      <div className="bg-gradient-to-r from-gold/15 via-gold/5 to-transparent border border-gold/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center border border-gold/40 text-gold-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-charcoal-900 text-sm">
                Milestone 1: Multi-PDF Ingestion Pipeline
              </span>
              <Badge variant="outline" className="border-gold text-gold-600 text-[10px] font-bold uppercase tracking-wider">
                Active
              </Badge>
            </div>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Secure PDF upload, integrity verification, and temporary staging ready. OCR & Groq AI extraction activate in Milestone 2.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-charcoal-600 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Client & Server Verified
          </span>
          <span className="text-charcoal-300">•</span>
          <span className="flex items-center gap-1">
            <FileCheck2 className="w-4 h-4 text-gold-600" /> PDF Only
          </span>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border/60 shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              Total In Queue
            </div>
            <div className="text-2xl font-bold font-display text-foreground mt-1">
              {totalFiles}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {totalSizeBytes > 0 ? formatBytes(totalSizeBytes) : "0 MB payload"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/60 shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs uppercase font-semibold text-emerald-700 tracking-wider">
              Uploaded to Staging
            </div>
            <div className="text-2xl font-bold font-display text-emerald-700 mt-1">
              {uploadedCount}
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">
              Ready for AI extraction
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/60 shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs uppercase font-semibold text-amber-700 tracking-wider">
              Pending Upload
            </div>
            <div className="text-2xl font-bold font-display text-amber-700 mt-1">
              {pendingCount}
            </div>
            <div className="text-[11px] text-amber-600/80 mt-0.5">
              Awaiting push to server
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/60 shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs uppercase font-semibold text-charcoal-500 tracking-wider">
              Verification Status
            </div>
            <div className="text-2xl font-bold font-display text-foreground mt-1">
              {errorCount === 0 ? "100%" : `${errorCount} Issues`}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {errorCount === 0 ? "All files validated" : "Requires attention"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-gold bg-gold/10 scale-[1.008] shadow-lg ring-4 ring-gold/20"
            : "border-gold/40 hover:border-gold hover:bg-gold/5 bg-ivory-50/70"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center mx-auto text-gold-600 transition-transform group-hover:scale-110">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-display text-xl font-bold text-charcoal-900">
              Drag & Drop Vendor Quotation PDFs
            </h3>
            <p className="text-sm text-charcoal-500 mt-1">
              or <span className="text-gold font-semibold underline underline-offset-4">browse files</span> from your computer
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-charcoal-100 text-charcoal-700 font-medium">
              📄 PDF Only (.pdf)
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-charcoal-100 text-charcoal-700 font-medium">
              ⚡ Max 25 MB / file
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-charcoal-100 text-charcoal-700 font-medium">
              📁 Batch Multiple Uploads
            </span>
          </div>
        </div>
      </div>

      {/* Uploaded Quotation List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Quotation Documents Queue
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and manage staged quotation files ready for analysis
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs border-gold/40 hover:border-gold hover:bg-gold/10 text-charcoal-800"
            >
              <FolderOpen className="w-3.5 h-3.5 mr-1 text-gold-600" />
              Add More PDFs
            </Button>
          </div>
        </div>

        {isLoadingExisting ? (
          <div className="p-12 text-center border border-border/60 rounded-xl bg-card">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" />
            <p className="text-sm text-muted-foreground mt-2">Checking staged files...</p>
          </div>
        ) : fileQueue.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border/70 rounded-xl bg-card/60">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-foreground text-sm">No quotations in queue</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Drag and drop your vendor PDF proposals into the box above to start building your quotation analysis queue.
            </p>
          </div>
        ) : (
          <div className="border border-border/70 rounded-xl bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
            {fileQueue.map((item) => {
              return (
                <div
                  key={item.localId}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  {/* File Info */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 border border-red-200/70 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate max-w-md" title={item.name}>
                          {item.name}
                        </span>

                        {item.status === "uploaded" && (
                          <Badge variant="outline" className="border-emerald-500 bg-emerald-50 text-emerald-700 text-[10px] font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Staged on Server
                          </Badge>
                        )}

                        {item.status === "uploading" && (
                          <Badge variant="outline" className="border-gold bg-gold/15 text-gold-700 text-[10px] font-medium flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Uploading {item.progress}%
                          </Badge>
                        )}

                        {item.status === "pending" && (
                          <Badge variant="secondary" className="text-[10px] font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" /> Pending Upload
                          </Badge>
                        )}

                        {item.status === "error" && (
                          <Badge variant="destructive" className="text-[10px] font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Error
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{formatBytes(item.sizeBytes)}</span>
                        <span>•</span>
                        <span>PDF Document</span>
                        {item.uploadedAt && (
                          <>
                            <span>•</span>
                            <span>Uploaded {new Date(item.uploadedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </>
                        )}
                        {item.serverId && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-charcoal-400">ID: {item.serverId.slice(0, 8)}...</span>
                          </>
                        )}
                      </div>

                      {/* Error details if failed */}
                      {item.errorMessage && (
                        <p className="text-xs text-destructive mt-1 font-medium">
                          {item.errorMessage}
                        </p>
                      )}

                      {/* Inline Progress Bar */}
                      {item.status === "uploading" && (
                        <div className="w-full max-w-xs bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                          <div
                            className="bg-gold h-full rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Preview Button */}
                    {item.previewUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewFile(item)}
                        className="text-xs h-8 px-2.5 hover:bg-muted"
                        title="Preview PDF"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Preview
                      </Button>
                    )}

                    {/* Single Upload Trigger */}
                    {item.status === "pending" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => uploadSingleFile(item.localId)}
                        className="text-xs h-8 px-2.5 bg-gold/15 text-gold-700 hover:bg-gold/25"
                      >
                        <UploadCloud className="w-3.5 h-3.5 mr-1" />
                        Upload
                      </Button>
                    )}

                    {/* Remove File Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(item.localId)}
                      className="text-xs h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Milestone 2 AI Extraction Roadmap Teaser */}
      <Card className="bg-charcoal text-ivory border-charcoal-700/60 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center border border-gold/40">
                <Sparkles className="w-4 h-4 text-gold" />
              </div>
              <CardTitle className="text-base font-display text-ivory">
                Upcoming: Milestone 2 & Intelligence Pipeline
              </CardTitle>
            </div>
            <Badge variant="outline" className="border-gold/40 text-gold text-[10px]">
              Preview
            </Badge>
          </div>
          <CardDescription className="text-charcoal-200 text-xs mt-1">
            Once files are staged, the Gathbandhan AI pipeline will execute deep document analysis:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-charcoal-800/80 border border-charcoal-700/40">
              <div className="font-semibold text-gold">1. OCR & Groq Parsing</div>
              <p className="text-charcoal-300 mt-1">
                Extracts raw line items, per-plate/per-hour rates, taxes, and service charges.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-charcoal-800/80 border border-charcoal-700/40">
              <div className="font-semibold text-gold">2. Landed Cost Engine</div>
              <p className="text-charcoal-300 mt-1">
                Computes true total expenditure including hidden fees, overtime, and logistics.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-charcoal-800/80 border border-charcoal-700/40">
              <div className="font-semibold text-gold">3. Multi-Vendor Matrix</div>
              <p className="text-charcoal-300 mt-1">
                Side-by-side comparison with AI anomaly detection and discrepancy flags.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-md bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm truncate" title={previewFile.name}>
                    {previewFile.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(previewFile.sizeBytes)} • {previewFile.status === "uploaded" ? "Server Staged" : "Local Preview"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewFile.previewUrl && (
                  <a
                    href={previewFile.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted text-foreground transition-colors"
                  >
                    Open in New Tab <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewFile(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Modal Body / PDF iframe */}
            <div className="flex-1 min-h-[500px] bg-neutral-900 flex items-center justify-center">
              {previewFile.previewUrl ? (
                <iframe
                  src={previewFile.previewUrl}
                  title={previewFile.name}
                  className="w-full h-[600px] border-none"
                />
              ) : (
                <div className="text-center p-8 text-neutral-400">
                  <p className="text-sm">Preview unavailable for this document.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-border flex justify-end bg-card">
              <Button size="sm" variant="outline" onClick={() => setPreviewFile(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
