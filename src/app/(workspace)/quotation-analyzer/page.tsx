/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  ScanText,
  Copy,
  Check,
  Download,
  Search,
  Cpu,
  Layers,
  AlertTriangle,
  Building2,
  Coins,
  Receipt,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Globe,
  Info,
  Scale,
  CheckSquare,
  XSquare,
  Square,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { ExtractionResult, ExtractedPage } from "@/lib/pdf/types";
import { QuotationAnalysisResult } from "@/lib/ai/types";
import { MultiVendorComparisonResult, ComparisonWeights } from "@/lib/ai/comparison-types";
import { VendorComparisonModal } from "./components/vendor-comparison-modal";

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
  // Milestone 2 extraction fields
  extractionStatus?: "idle" | "extracting" | "extracted" | "error";
  extractionResult?: ExtractionResult;
  extractionError?: string;
  // Milestone 3 AI analysis fields
  aiStatus?: "idle" | "analyzing" | "analyzed" | "error";
  aiResult?: QuotationAnalysisResult;
  aiError?: string;
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

function formatCurrency(amount: number | null | undefined, currency = "INR"): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return `${currency} ${amount.toLocaleString()}`;
}

export default function QuotationAnalyzerPage() {
  const [fileQueue, setFileQueue] = useState<QueueFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [isExtractingAll, setIsExtractingAll] = useState(false);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);

  // Modals
  const [previewFile, setPreviewFile] = useState<QueueFile | null>(null);
  const [inspectFile, setInspectFile] = useState<QueueFile | null>(null);
  const [aiModalFile, setAiModalFile] = useState<QueueFile | null>(null);

  // Milestone 4: Multi-vendor comparison state
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<MultiVendorComparisonResult | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isRecalculatingWeights, setIsRecalculatingWeights] = useState(false);

  const [selectedPageNumber, setSelectedPageNumber] = useState<number>(1);
  const [copiedText, setCopiedText] = useState(false);
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
          extractionStatus: "idle",
          aiStatus: "idle",
        }));

        setFileQueue((prev) => {
          const existingIds = new Set(existing.map((e) => e.serverId));
          const localPending = prev.filter((p) => p.status === "pending" && !existingIds.has(p.name));
          const merged = existing.map((newItem) => {
            const foundOld = prev.find((p) => p.serverId === newItem.serverId);
            if (foundOld) {
              return {
                ...newItem,
                extractionStatus: foundOld.extractionStatus,
                extractionResult: foundOld.extractionResult,
                aiStatus: foundOld.aiStatus,
                aiResult: foundOld.aiResult,
              };
            }
            return newItem;
          });
          return [...merged, ...localPending];
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

  // Stage files with validation
  const stageFiles = (files: FileList | File[]) => {
    const newItems: QueueFile[] = [];
    const rejectedFiles: string[] = [];
    const duplicateFiles: string[] = [];

    Array.from(files).forEach((file) => {
      const isPdfExtension = file.name.toLowerCase().endsWith(".pdf");
      const isPdfMime = file.type === "application/pdf" || file.type === "";

      if (!isPdfExtension || !isPdfMime) {
        rejectedFiles.push(`${file.name} (only PDF documents allowed)`);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        rejectedFiles.push(`${file.name} (${formatBytes(file.size)} exceeds 25MB limit)`);
        return;
      }

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
        extractionStatus: "idle",
        aiStatus: "idle",
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

  // Drag and drop handlers
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload single file
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

  // Upload all pending files
  const uploadAllPendingFiles = async () => {
    const pendingFiles = fileQueue.filter((item) => item.status === "pending" && item.file);
    if (pendingFiles.length === 0) {
      toast.info("No pending files to upload");
      return;
    }

    setIsUploadingAll(true);

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

  // Milestone 2: Execute hybrid text/OCR extraction for a single file
  const extractFileText = async (localId: string) => {
    const target = fileQueue.find((item) => item.localId === localId);
    if (!target || !target.serverId) {
      toast.error("File must be uploaded to server before text extraction.");
      return;
    }

    setFileQueue((prev) =>
      prev.map((item) =>
        item.localId === localId
          ? { ...item, extractionStatus: "extracting", extractionError: undefined }
          : item
      )
    );

    try {
      const res = await fetch("/api/quotation-analyzer/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId: target.serverId,
        }),
      });

      const data: ExtractionResult = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to extract text from PDF document.");
      }

      setFileQueue((prev) =>
        prev.map((item) =>
          item.localId === localId
            ? {
                ...item,
                extractionStatus: "extracted",
                extractionResult: data,
              }
            : item
        )
      );

      toast.success(`Extracted ${data.totalPages} page(s) from ${target.name}`, {
        description: `${data.summary.textPages} digital text, ${data.summary.ocrPages} OCR scanned pages`,
      });
    } catch (err: any) {
      setFileQueue((prev) =>
        prev.map((item) =>
          item.localId === localId
            ? {
                ...item,
                extractionStatus: "error",
                extractionError: err.message,
              }
            : item
        )
      );
      toast.error(`Extraction failed: ${target.name}`, { description: err.message });
    }
  };

  // Milestone 2: Extract all uploaded files
  const extractAllUploaded = async () => {
    const readyFiles = fileQueue.filter(
      (item) => item.status === "uploaded" && item.serverId && item.extractionStatus !== "extracting"
    );

    if (readyFiles.length === 0) {
      toast.info("No uploaded quotations available for extraction.");
      return;
    }

    setIsExtractingAll(true);
    let successCount = 0;

    for (const file of readyFiles) {
      try {
        await extractFileText(file.localId);
        successCount++;
      } catch (err) {
        console.warn(`Extraction error for ${file.name}:`, err);
      }
    }

    setIsExtractingAll(false);
    toast.info(`Completed extraction pipeline for ${successCount} document(s).`);
  };

  // Milestone 3: Run Groq AI Quotation Analysis & Financial Audit
  const analyzeFileWithAi = async (localId: string) => {
    const target = fileQueue.find((item) => item.localId === localId);
    if (!target || !target.serverId) {
      toast.error("File must be uploaded before running AI analysis.");
      return;
    }

    setFileQueue((prev) =>
      prev.map((item) =>
        item.localId === localId
          ? { ...item, aiStatus: "analyzing", aiError: undefined }
          : item
      )
    );

    try {
      const res = await fetch("/api/quotation-analyzer/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId: target.serverId,
        }),
      });

      const data: QuotationAnalysisResult = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Groq AI quotation analysis failed.");
      }

      setFileQueue((prev) =>
        prev.map((item) =>
          item.localId === localId
            ? {
                ...item,
                aiStatus: "analyzed",
                aiResult: data,
                extractionStatus: "extracted", // Automatically marked extracted if not already
              }
            : item
        )
      );

      const mathStatus = data.financialAudit.isValid
        ? "Deterministic Math: 100% Match"
        : `Flagged ${data.financialAudit.discrepancyFlags.length} math discrepancies`;

      toast.success(`AI Analysis Complete: ${data.vendorDetails.vendorName || target.name}`, {
        description: `${data.commercialDetails.lineItems.length} line items • ${mathStatus}`,
      });
    } catch (err: any) {
      setFileQueue((prev) =>
        prev.map((item) =>
          item.localId === localId
            ? {
                ...item,
                aiStatus: "error",
                aiError: err.message,
              }
            : item
        )
      );
      toast.error(`AI Analysis failed: ${target.name}`, { description: err.message });
    }
  };

  // Milestone 3: Analyze all uploaded quotations with AI
  const analyzeAllWithAi = async () => {
    const readyFiles = fileQueue.filter(
      (item) => item.status === "uploaded" && item.serverId && item.aiStatus !== "analyzing"
    );

    if (readyFiles.length === 0) {
      toast.info("No uploaded quotations ready for AI analysis.");
      return;
    }

    setIsAnalyzingAll(true);
    let successCount = 0;

    for (const file of readyFiles) {
      try {
        await analyzeFileWithAi(file.localId);
        successCount++;
      } catch (err) {
        console.warn(`AI Analysis error for ${file.name}:`, err);
      }
    }

    setIsAnalyzingAll(false);
    toast.info(`Completed AI quotation analysis for ${successCount} document(s).`);
  };

  // Remove single file
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
    if (inspectFile?.localId === localId) setInspectFile(null);
    if (aiModalFile?.localId === localId) setAiModalFile(null);
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
    setInspectFile(null);
    setAiModalFile(null);
    toast.success("Quotation queue cleared completely");
  };

  // Open text inspection modal
  const openInspector = (item: QueueFile) => {
    setInspectFile(item);
    setSelectedPageNumber(1);
  };

  // Open AI Intelligence modal
  const openAiIntelligenceModal = (item: QueueFile) => {
    setAiModalFile(item);
  };

  // Milestone 4: Multi-vendor selection & comparison
  const toggleSelectForComparison = (serverId: string) => {
    setSelectedForComparison((prev) =>
      prev.includes(serverId) ? prev.filter((id) => id !== serverId) : [...prev, serverId]
    );
  };

  const toggleSelectAllAnalyzed = () => {
    const analyzedIds = fileQueue
      .filter((f) => f.aiStatus === "analyzed" && f.serverId)
      .map((f) => f.serverId!);

    if (selectedForComparison.length === analyzedIds.length && analyzedIds.length > 0) {
      setSelectedForComparison([]);
    } else {
      setSelectedForComparison(analyzedIds);
    }
  };

  const handleCompareSelected = async (weights?: Partial<ComparisonWeights>) => {
    if (selectedForComparison.length < 2) {
      toast.warning("Select at least 2 analyzed vendor quotations to run comparison.");
      return;
    }

    setIsComparing(true);
    try {
      const res = await fetch("/api/quotation-analyzer/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadIds: selectedForComparison,
          weights,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Vendor comparison failed.");
      }

      setComparisonResult(data);
      setIsComparisonModalOpen(true);
      toast.success(`Generated comparison for ${data.vendors.length} vendors!`, {
        description: `Top Recommended: ${data.recommendation.recommendedVendorName}`,
      });
    } catch (err: any) {
      toast.error("Comparison failed", { description: err.message });
    } finally {
      setIsComparing(false);
    }
  };

  const handleRecalculateWeights = async (weights: Partial<ComparisonWeights>) => {
    if (selectedForComparison.length < 2) return;
    setIsRecalculatingWeights(true);
    try {
      const res = await fetch("/api/quotation-analyzer/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadIds: selectedForComparison,
          weights,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Weight adjustment failed.");
      }

      setComparisonResult(data);
    } catch (err: any) {
      toast.error("Failed to update weights", { description: err.message });
    } finally {
      setIsRecalculatingWeights(false);
    }
  };

  // Copy text helper
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    toast.success("Text copied to clipboard!");
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Computed metrics
  const totalFiles = fileQueue.length;
  const uploadedCount = fileQueue.filter((f) => f.status === "uploaded").length;
  const pendingCount = fileQueue.filter((f) => f.status === "pending").length;
  const extractedCount = fileQueue.filter((f) => f.extractionStatus === "extracted").length;
  const analyzedCount = fileQueue.filter((f) => f.aiStatus === "analyzed").length;
  const totalSizeBytes = fileQueue.reduce((acc, curr) => acc + curr.sizeBytes, 0);

  // Inspector current page
  const currentPage: ExtractedPage | undefined = inspectFile?.extractionResult?.pages.find(
    (p) => p.pageNumber === selectedPageNumber
  );

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="AI Quotation Analyzer"
        description="Luxury multi-vendor quotation ingestion, hybrid OCR extraction & Groq-powered financial intelligence engine."
      >
        <div className="flex items-center gap-2 flex-wrap">
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
              className="bg-gold hover:bg-gold-600 text-charcoal-900 font-semibold shadow-xs"
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

          {uploadedCount > 0 && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={extractAllUploaded}
                disabled={isExtractingAll}
                className="border-charcoal-300 text-charcoal-800 hover:bg-muted"
              >
                {isExtractingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-gold" />
                    Extracting All...
                  </>
                ) : (
                  <>
                    <ScanText className="w-4 h-4 mr-1.5 text-blue-600" />
                    Extract All Text ({uploadedCount})
                  </>
                )}
              </Button>

              <Button
                size="sm"
                onClick={analyzeAllWithAi}
                disabled={isAnalyzingAll}
                className="bg-gradient-to-r from-amber-500 via-gold to-amber-600 hover:from-amber-600 hover:to-amber-700 text-charcoal-950 font-bold shadow-xs border border-gold/40"
              >
                {isAnalyzingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-charcoal-900" />
                    Analyzing All with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5 text-charcoal-900" />
                    Analyze All with Groq AI ({uploadedCount})
                  </>
                )}
              </Button>

              {/* Milestone 4: Multi-Vendor Comparison Trigger */}
              <Button
                size="sm"
                onClick={() => handleCompareSelected()}
                disabled={selectedForComparison.length < 2 || isComparing}
                className={`font-bold shadow-xs transition-all ${
                  selectedForComparison.length >= 2
                    ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md border border-emerald-400/40"
                    : "bg-muted text-muted-foreground border border-border/70"
                }`}
                title={
                  selectedForComparison.length >= 2
                    ? "Compare selected analyzed vendor quotations"
                    : "Select at least 2 analyzed quotations below to compare"
                }
              >
                {isComparing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <Scale className="w-4 h-4 mr-1.5" />
                    Compare Selected ({selectedForComparison.length})
                  </>
                )}
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchExistingFiles}
            title="Refresh staged files"
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </PageHeader>

      {/* Milestone & Pipeline Status Banner */}
      <div className="bg-gradient-to-r from-emerald-500/15 via-gold/15 to-transparent border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 text-emerald-700 shrink-0">
            <Scale className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-charcoal-900 text-sm">
                Milestone 4: Multi-Vendor AI Comparison, Transparent Scoring & Recommendation
              </span>
              <Badge variant="outline" className="border-emerald-600 text-emerald-700 text-[10px] font-bold uppercase tracking-wider bg-emerald-50">
                Active
              </Badge>
            </div>
            <p className="text-xs text-charcoal-600 mt-0.5">
              Select 2 or more analyzed vendor quotes to generate side-by-side matrices, transparent weighted scores (Cost 30%, Scope 25%, Terms 10%, Audit 5%), Groq AI pros/cons, and exactly one final recommendation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-charcoal-600 font-medium">
          <span className="flex items-center gap-1">
            <Scale className="w-4 h-4 text-emerald-600" /> Transparent Scoring
          </span>
          <span className="text-charcoal-300">•</span>
          <span className="flex items-center gap-1">
            <Award className="w-4 h-4 text-gold-600" /> Single Final Recommendation
          </span>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              Staged on Server
            </div>
            <div className="text-2xl font-bold font-display text-emerald-700 mt-1">
              {uploadedCount}
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">
              Ready for processing
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/60 shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs uppercase font-semibold text-blue-700 tracking-wider">
              Text Extracted
            </div>
            <div className="text-2xl font-bold font-display text-blue-700 mt-1">
              {extractedCount}
            </div>
            <div className="text-[11px] text-blue-600/80 mt-0.5">
              pypdf & OCR parsed
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/60 shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs uppercase font-semibold text-gold-800 tracking-wider">
              AI Analyzed
            </div>
            <div className="text-2xl font-bold font-display text-gold-700 mt-1">
              {analyzedCount}
            </div>
            <div className="text-[11px] text-gold-600/80 mt-0.5">
              Audited by Groq
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
              Local queue items
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

      {/* Quotation Documents Queue List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Quotation Documents Queue
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review staged files, run text extraction, and analyze commercial proposals with Groq AI
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {analyzedCount >= 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAllAnalyzed}
                className="text-xs border-emerald-500/40 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-800"
              >
                <CheckSquare className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                {selectedForComparison.length === analyzedCount
                  ? "Deselect All"
                  : `Select All Analyzed (${analyzedCount})`}
              </Button>
            )}

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
              const res = item.extractionResult;
              const ai = item.aiResult;
              const hasMathDiscrepancy = ai && !ai.financialAudit.isValid;
              const isSelected = Boolean(item.serverId && selectedForComparison.includes(item.serverId));

              return (
                <div
                  key={item.localId}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isSelected ? "bg-emerald-500/10" : "hover:bg-muted/30"
                  }`}
                >
                  {/* File Info */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    {/* Checkbox for Milestone 4 Comparison */}
                    <div className="pt-0.5 sm:pt-0 shrink-0">
                      <button
                        type="button"
                        disabled={item.aiStatus !== "analyzed" || !item.serverId}
                        onClick={() => item.serverId && toggleSelectForComparison(item.serverId)}
                        title={
                          item.aiStatus === "analyzed"
                            ? isSelected
                              ? "Deselect from comparison"
                              : "Select for vendor comparison"
                            : "Analyze with Groq AI first to enable comparison"
                        }
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors border ${
                          isSelected
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                            : item.aiStatus === "analyzed"
                            ? "bg-card border-border/80 hover:border-emerald-500 text-transparent hover:text-muted-foreground"
                            : "bg-muted/50 border-border/40 text-transparent cursor-not-allowed opacity-40"
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>

                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 border border-red-200/70 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate max-w-md" title={item.name}>
                          {item.name}
                        </span>

                        {/* Status Badges */}
                        {item.status === "uploaded" && (
                          <Badge variant="outline" className="border-emerald-500 bg-emerald-50 text-emerald-700 text-[10px] font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Staged
                          </Badge>
                        )}

                        {item.status === "uploading" && (
                          <Badge variant="outline" className="border-gold bg-gold/15 text-gold-700 text-[10px] font-medium flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Uploading {item.progress}%
                          </Badge>
                        )}

                        {item.extractionStatus === "extracted" && res && (
                          <Badge variant="outline" className="border-blue-400 bg-blue-50 text-blue-700 text-[10px] font-medium flex items-center gap-1">
                            <ScanText className="w-3 h-3" /> Extracted ({res.totalPages} pgs)
                          </Badge>
                        )}

                        {item.aiStatus === "analyzing" && (
                          <Badge variant="outline" className="border-gold bg-gold/15 text-gold-800 text-[10px] font-medium flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin text-gold-700" /> Groq AI Analyzing...
                          </Badge>
                        )}

                        {item.aiStatus === "analyzed" && ai && (
                          <Badge variant="outline" className="border-gold bg-gold/20 text-gold-900 text-[10px] font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-gold-700" /> AI Analyzed
                          </Badge>
                        )}

                        {hasMathDiscrepancy && (
                          <Badge variant="outline" className="border-amber-500 bg-amber-50 text-amber-800 text-[10px] font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Math Discrepancy Flagged
                          </Badge>
                        )}

                        {item.aiStatus === "error" && (
                          <Badge variant="destructive" className="text-[10px] font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> AI Error
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span>{formatBytes(item.sizeBytes)}</span>
                        <span>•</span>
                        <span>PDF Document</span>
                        {item.uploadedAt && (
                          <>
                            <span>•</span>
                            <span>Uploaded {new Date(item.uploadedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </>
                        )}
                        {ai && (
                          <>
                            <span>•</span>
                            <span className="text-charcoal-800 font-semibold">
                              Vendor: {ai.vendorDetails.vendorName || "Unknown"}
                            </span>
                            <span>•</span>
                            <span className="text-gold-700 font-bold">
                              Total: {formatCurrency(ai.commercialDetails.statedGrandTotal, ai.commercialDetails.currency || "INR")}
                            </span>
                          </>
                        )}
                      </div>

                      {item.aiError && (
                        <p className="text-xs text-destructive mt-1 font-medium">
                          {item.aiError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                    {/* View AI Intelligence Modal Button */}
                    {item.aiStatus === "analyzed" && ai && (
                      <Button
                        size="sm"
                        onClick={() => openAiIntelligenceModal(item)}
                        className="text-xs h-8 px-2.5 bg-gold/25 text-gold-950 hover:bg-gold/35 border border-gold/50 font-semibold"
                        title="View extracted commercial details & financial audit"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-gold-700" />
                        View Intelligence
                      </Button>
                    )}

                    {/* Analyze with AI Button */}
                    {item.status === "uploaded" && (
                      <Button
                        size="sm"
                        disabled={item.aiStatus === "analyzing"}
                        onClick={() => analyzeFileWithAi(item.localId)}
                        className={`text-xs h-8 px-2.5 ${
                          item.aiStatus === "analyzed"
                            ? "bg-secondary text-secondary-foreground hover:bg-muted"
                            : "bg-gold hover:bg-gold-600 text-charcoal-900 font-semibold"
                        }`}
                        title="Analyze with Groq AI"
                      >
                        {item.aiStatus === "analyzing" ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                            Analyzing...
                          </>
                        ) : item.aiStatus === "analyzed" ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 mr-1" />
                            Re-Analyze
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 mr-1" />
                            Analyze with AI
                          </>
                        )}
                      </Button>
                    )}

                    {/* Inspect Extracted Raw Text */}
                    {item.extractionStatus === "extracted" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openInspector(item)}
                        className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground"
                        title="Inspect page-by-page raw extracted text"
                      >
                        <Layers className="w-3.5 h-3.5 mr-1" />
                        Raw Text
                      </Button>
                    )}

                    {/* Preview Original PDF */}
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

      {/* AI Quotation Intelligence & Financial Audit Modal */}
      {aiModalFile && aiModalFile.aiResult && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/30 flex-wrap gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gold/20 text-gold-700 border border-gold/40 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-lg text-foreground truncate">
                      {aiModalFile.aiResult.vendorDetails.vendorName || aiModalFile.name}
                    </h3>
                    {aiModalFile.aiResult.vendorDetails.category && (
                      <Badge variant="outline" className="border-gold/50 text-gold-800 bg-gold/10 text-xs">
                        {aiModalFile.aiResult.vendorDetails.category}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {aiModalFile.aiResult.modelUsed}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Quotation #{aiModalFile.aiResult.vendorDetails.quotationNumber || "N/A"} • Dated:{" "}
                    {aiModalFile.aiResult.vendorDetails.quotationDate || "Unspecified"} • Source:{" "}
                    {aiModalFile.name} ({aiModalFile.aiResult.sourcePageCount} pages)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAiModalFile(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Financial Verification Alert Banner */}
            <div
              className={`px-5 py-3 border-b text-xs flex items-center justify-between gap-4 flex-wrap ${
                aiModalFile.aiResult.financialAudit.isValid
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-amber-50 border-amber-300 text-amber-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {aiModalFile.aiResult.financialAudit.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div>
                  <span className="font-semibold">
                    {aiModalFile.aiResult.financialAudit.isValid
                      ? "Deterministic Financial Math: 100% Match Verified"
                      : `Financial Discrepancy Flagged (${aiModalFile.aiResult.financialAudit.discrepancyFlags.length} flags)`}
                  </span>
                  <span className="ml-2 text-muted-foreground">
                    Stated:{" "}
                    <strong>
                      {formatCurrency(
                        aiModalFile.aiResult.commercialDetails.statedGrandTotal,
                        aiModalFile.aiResult.commercialDetails.currency || "INR"
                      )}
                    </strong>{" "}
                    | Calculated:{" "}
                    <strong>
                      {formatCurrency(
                        aiModalFile.aiResult.financialAudit.calculatedGrandTotal,
                        aiModalFile.aiResult.commercialDetails.currency || "INR"
                      )}
                    </strong>
                  </span>
                </div>
              </div>

              <span className="text-[11px] text-muted-foreground italic">
                Verified via decimal-safe arithmetic
              </span>
            </div>

            {/* Modal Tabs Content */}
            <div className="flex-1 overflow-y-auto p-5">
              <Tabs defaultValue="commercial" className="space-y-5">
                <TabsList className="bg-muted/60 p-1 rounded-xl">
                  <TabsTrigger value="commercial" className="text-xs font-semibold">
                    <Receipt className="w-3.5 h-3.5 mr-1.5" /> Commercial & Audit
                  </TabsTrigger>
                  <TabsTrigger value="vendor" className="text-xs font-semibold">
                    <Building2 className="w-3.5 h-3.5 mr-1.5" /> Vendor & Terms
                  </TabsTrigger>
                  <TabsTrigger value="services" className="text-xs font-semibold">
                    <CheckSquare className="w-3.5 h-3.5 mr-1.5" /> Scope & Services
                  </TabsTrigger>
                  <TabsTrigger value="provenance" className="text-xs font-semibold">
                    <Scale className="w-3.5 h-3.5 mr-1.5" /> Provenance & Evidence
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Commercial & Financial Audit */}
                <TabsContent value="commercial" className="space-y-5">
                  {/* Summary Comparison Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl border border-border bg-card">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                        Stated Subtotal
                      </div>
                      <div className="text-lg font-bold font-display mt-0.5">
                        {formatCurrency(
                          aiModalFile.aiResult.commercialDetails.statedSubtotal,
                          aiModalFile.aiResult.commercialDetails.currency || "INR"
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Vendor stated before taxes
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-card">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                        Calculated Subtotal
                      </div>
                      <div className="text-lg font-bold font-display mt-0.5">
                        {formatCurrency(
                          aiModalFile.aiResult.financialAudit.calculatedSubtotal,
                          aiModalFile.aiResult.commercialDetails.currency || "INR"
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Sum of line-item totals
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-card">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                        Stated Grand Total
                      </div>
                      <div className="text-xl font-bold font-display text-gold-800 mt-0.5">
                        {formatCurrency(
                          aiModalFile.aiResult.commercialDetails.statedGrandTotal,
                          aiModalFile.aiResult.commercialDetails.currency || "INR"
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Vendor final payable figure
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-card">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                        Audit Math Check
                      </div>
                      <div
                        className={`text-lg font-bold font-display mt-0.5 ${
                          aiModalFile.aiResult.financialAudit.isValid
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      >
                        {aiModalFile.aiResult.financialAudit.isValid
                          ? "✓ Match"
                          : `Diff: ${formatCurrency(
                              Math.abs(
                                aiModalFile.aiResult.financialAudit.grandTotalDiscrepancy || 0
                              ),
                              aiModalFile.aiResult.commercialDetails.currency || "INR"
                            )}`}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Formula verification check
                      </div>
                    </div>
                  </div>

                  {/* Discrepancies Alert List if any */}
                  {aiModalFile.aiResult.financialAudit.discrepancyFlags.length > 0 && (
                    <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-xs text-amber-900 space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5 text-amber-950">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Discrepancies Flagged by Deterministic Audit Engine:
                      </div>
                      <ul className="list-disc list-inside space-y-1 pl-1 text-amber-800">
                        {aiModalFile.aiResult.financialAudit.discrepancyFlags.map((flag, idx) => (
                          <li key={idx}>{flag.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Line Items Table */}
                  <div className="border border-border rounded-xl overflow-hidden shadow-xs">
                    <div className="bg-muted/40 px-4 py-2.5 border-b border-border text-xs font-semibold flex items-center justify-between">
                      <span>Line Items ({aiModalFile.aiResult.commercialDetails.lineItems.length})</span>
                      <span className="text-muted-foreground">Verbatim vendor line items</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/20 text-muted-foreground border-b border-border">
                          <tr>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Description</th>
                            <th className="py-2.5 px-3">Qty × Unit</th>
                            <th className="py-2.5 px-3">Unit Price</th>
                            <th className="py-2.5 px-3">Stated Amount</th>
                            <th className="py-2.5 px-3">Calculated Check</th>
                            <th className="py-2.5 px-3">Page</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {aiModalFile.aiResult.commercialDetails.lineItems.map((item, idx) => {
                            const auditItem = aiModalFile.aiResult?.financialAudit.lineItemAudits.find(
                              (a) => a.itemIndex === idx
                            );
                            const hasMismatch = auditItem?.isMismatch;

                            return (
                              <tr
                                key={idx}
                                className={`hover:bg-muted/20 ${
                                  hasMismatch ? "bg-amber-50/60" : ""
                                }`}
                              >
                                <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-foreground max-w-xs">
                                  {item.description}
                                  {item.evidenceSnippet && (
                                    <span className="block text-[10px] text-muted-foreground italic mt-0.5 truncate">
                                      &quot;{item.evidenceSnippet}&quot;
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-muted-foreground">
                                  {item.quantity ?? "—"} {item.unit || ""}
                                </td>
                                <td className="py-2.5 px-3 font-mono">
                                  {formatCurrency(item.unitPrice, aiModalFile.aiResult?.commercialDetails.currency || "INR")}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-semibold">
                                  {formatCurrency(item.statedAmount, aiModalFile.aiResult?.commercialDetails.currency || "INR")}
                                </td>
                                <td className="py-2.5 px-3 font-mono">
                                  {auditItem ? (
                                    <span
                                      className={`inline-flex items-center gap-1 ${
                                        hasMismatch
                                          ? "text-destructive font-bold"
                                          : "text-emerald-700"
                                      }`}
                                    >
                                      {hasMismatch ? "⚠ " : "✓ "}
                                      {formatCurrency(
                                        auditItem.expectedAmount,
                                        aiModalFile.aiResult?.commercialDetails.currency || "INR"
                                      )}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-muted-foreground">
                                  {item.sourcePage ? `P.${item.sourcePage}` : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Taxes, Discounts, Logistics */}
                  <div className="grid md:grid-cols-3 gap-3">
                    {/* Discounts */}
                    <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                      <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>Discounts</span>
                        <span className="font-mono text-emerald-700">
                          -
                          {formatCurrency(
                            aiModalFile.aiResult.commercialDetails.totalDiscount,
                            aiModalFile.aiResult.commercialDetails.currency || "INR"
                          )}
                        </span>
                      </div>
                      {aiModalFile.aiResult.commercialDetails.discounts.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground">No discounts stated.</p>
                      ) : (
                        <ul className="text-xs space-y-1 text-muted-foreground">
                          {aiModalFile.aiResult.commercialDetails.discounts.map((d, i) => (
                            <li key={i} className="flex justify-between">
                              <span>{d.description}</span>
                              <span className="font-mono">
                                {formatCurrency(d.statedAmount, aiModalFile.aiResult?.commercialDetails.currency || "INR")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Taxes */}
                    <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                      <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>Taxes & Duties</span>
                        <span className="font-mono text-gold-800">
                          +
                          {formatCurrency(
                            aiModalFile.aiResult.commercialDetails.totalTax,
                            aiModalFile.aiResult.commercialDetails.currency || "INR"
                          )}
                        </span>
                      </div>
                      {aiModalFile.aiResult.commercialDetails.taxes.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground">No explicit tax items.</p>
                      ) : (
                        <ul className="text-xs space-y-1 text-muted-foreground">
                          {aiModalFile.aiResult.commercialDetails.taxes.map((t, i) => (
                            <li key={i} className="flex justify-between">
                              <span>
                                {t.description} {t.ratePercent ? `(${t.ratePercent}%)` : ""}
                              </span>
                              <span className="font-mono">
                                {formatCurrency(t.statedAmount, aiModalFile.aiResult?.commercialDetails.currency || "INR")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Additional Charges */}
                    <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                      <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>Additional Logistics & Fees</span>
                        <span className="font-mono text-foreground">
                          +
                          {formatCurrency(
                            aiModalFile.aiResult.commercialDetails.additionalCharges.reduce(
                              (s, c) => s + (c.statedAmount || 0),
                              0
                            ),
                            aiModalFile.aiResult.commercialDetails.currency || "INR"
                          )}
                        </span>
                      </div>
                      {aiModalFile.aiResult.commercialDetails.additionalCharges.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground">No additional charges.</p>
                      ) : (
                        <ul className="text-xs space-y-1 text-muted-foreground">
                          {aiModalFile.aiResult.commercialDetails.additionalCharges.map((c, i) => (
                            <li key={i} className="flex justify-between">
                              <span>{c.description}</span>
                              <span className="font-mono">
                                {formatCurrency(c.statedAmount, aiModalFile.aiResult?.commercialDetails.currency || "INR")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 2: Vendor & Agreement Terms */}
                <TabsContent value="vendor" className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Vendor Contact Profile */}
                    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                        <Building2 className="w-4 h-4 text-gold-600" /> Vendor Profile
                      </h4>
                      <div className="text-xs space-y-2 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground w-28">Company Name:</span>
                          <span>{aiModalFile.aiResult.vendorDetails.vendorName || "Not stated"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground w-28">Category:</span>
                          <span>{aiModalFile.aiResult.vendorDetails.category || "Unspecified"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{aiModalFile.aiResult.vendorDetails.contactPhone || "No phone stated"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{aiModalFile.aiResult.vendorDetails.contactEmail || "No email stated"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{aiModalFile.aiResult.vendorDetails.address || "No address stated"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5" />
                          <span>{aiModalFile.aiResult.vendorDetails.website || "No website stated"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quotation Validity & ID */}
                    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                        <Calendar className="w-4 h-4 text-gold-600" /> Quotation Validity
                      </h4>
                      <div className="text-xs space-y-2 text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">Quotation Number:</span>
                          <span className="font-mono">{aiModalFile.aiResult.vendorDetails.quotationNumber || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">Quotation Date:</span>
                          <span>{aiModalFile.aiResult.vendorDetails.quotationDate || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">Valid Until:</span>
                          <span className="text-gold-700 font-semibold">{aiModalFile.aiResult.vendorDetails.validityDate || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Schedule Table */}
                  <div className="border border-border rounded-xl overflow-hidden shadow-xs">
                    <div className="bg-muted/40 px-4 py-2.5 border-b border-border text-xs font-semibold flex items-center justify-between">
                      <span>Payment Schedule & Milestones</span>
                      <span className="text-muted-foreground">Contractual installments</span>
                    </div>

                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/20 text-muted-foreground border-b border-border">
                        <tr>
                          <th className="py-2.5 px-3">Milestone</th>
                          <th className="py-2.5 px-3">Percentage</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Due Date / Trigger</th>
                          <th className="py-2.5 px-3">Evidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {aiModalFile.aiResult.commercialDetails.paymentSchedule.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-muted-foreground italic">
                              No explicit payment schedule listed in quotation.
                            </td>
                          </tr>
                        ) : (
                          aiModalFile.aiResult.commercialDetails.paymentSchedule.map((p, idx) => (
                            <tr key={idx} className="hover:bg-muted/20">
                              <td className="py-2.5 px-3 font-medium">{p.milestone}</td>
                              <td className="py-2.5 px-3 font-mono">{p.percentage ? `${p.percentage}%` : "—"}</td>
                              <td className="py-2.5 px-3 font-mono font-semibold">
                                {formatCurrency(p.statedAmount, aiModalFile.aiResult?.commercialDetails.currency || "INR")}
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground">{p.dueDate || "—"}</td>
                              <td className="py-2.5 px-3 text-[10px] text-muted-foreground italic truncate max-w-xs">
                                {p.evidenceSnippet || "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Cancellation & Refund Terms */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                      <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                        Cancellation Policy
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {aiModalFile.aiResult.commercialDetails.cancellationTerms ||
                          "No explicit cancellation clause stated in document."}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                      <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                        Refund Terms
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {aiModalFile.aiResult.commercialDetails.refundTerms ||
                          "No explicit refund policy stated in document."}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 3: Scope & Services */}
                <TabsContent value="services" className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Services Included */}
                    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2 text-emerald-800">
                        <CheckSquare className="w-4 h-4 text-emerald-600" /> Services Included (
                        {aiModalFile.aiResult.serviceDetails.servicesIncluded.length})
                      </h4>
                      {aiModalFile.aiResult.serviceDetails.servicesIncluded.length === 0 ? (
                        <p className="text-xs text-muted-foreground">None explicitly listed.</p>
                      ) : (
                        <ul className="space-y-2 text-xs">
                          {aiModalFile.aiResult.serviceDetails.servicesIncluded.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-foreground">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <div>
                                <span>{s.text}</span>
                                {s.sourcePage && (
                                  <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">
                                    [P.{s.sourcePage}]
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Services Excluded */}
                    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2 text-destructive">
                        <XSquare className="w-4 h-4 text-destructive" /> Services Excluded (
                        {aiModalFile.aiResult.serviceDetails.servicesExcluded.length})
                      </h4>
                      {aiModalFile.aiResult.serviceDetails.servicesExcluded.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No exclusions specified.</p>
                      ) : (
                        <ul className="space-y-2 text-xs">
                          {aiModalFile.aiResult.serviceDetails.servicesExcluded.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-foreground">
                              <span className="text-destructive font-bold">✕</span>
                              <div>
                                <span>{s.text}</span>
                                {s.sourcePage && (
                                  <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">
                                    [P.{s.sourcePage}]
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Operational Logistics details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl border border-border bg-card text-xs">
                      <div className="text-muted-foreground font-semibold">Guest Limit</div>
                      <div className="text-base font-bold font-display mt-0.5">
                        {aiModalFile.aiResult.serviceDetails.guestLimit
                          ? `${aiModalFile.aiResult.serviceDetails.guestLimit} Guests`
                          : "Unspecified"}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-card text-xs">
                      <div className="text-muted-foreground font-semibold">Coverage Duration</div>
                      <div className="text-base font-bold font-display mt-0.5">
                        {aiModalFile.aiResult.serviceDetails.coverageHours
                          ? `${aiModalFile.aiResult.serviceDetails.coverageHours} Hours`
                          : "Unspecified"}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-card text-xs">
                      <div className="text-muted-foreground font-semibold">Overtime Rate</div>
                      <div className="text-xs font-semibold text-foreground mt-0.5">
                        {aiModalFile.aiResult.serviceDetails.overtimeCharges || "Unspecified"}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-card text-xs">
                      <div className="text-muted-foreground font-semibold">Setup Timeline</div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {aiModalFile.aiResult.serviceDetails.setupDetails || "Unspecified"}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 4: Provenance & Evidence */}
                <TabsContent value="provenance" className="space-y-5">
                  <div className="p-4 rounded-xl border border-border bg-muted/20 text-xs space-y-2">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-gold-600" /> Evidence Provenance Protocol
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Every commercial and contractual item above was extracted with direct page-level attribution from the source document.
                      Below is the checklist of missing fields and source citations.
                    </p>
                  </div>

                  {/* Missing information checklist */}
                  {aiModalFile.aiResult.missingFields.length > 0 && (
                    <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                      <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Missing Information Detected in Proposal ({aiModalFile.aiResult.missingFields.length})
                      </h4>
                      <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                        {aiModalFile.aiResult.missingFields.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-3 rounded-lg border border-border/80 bg-ivory-50 text-[11px] text-muted-foreground">
                    <strong>Notice:</strong> Extracted values represent parsed representations of the source vendor quotation and are validated independently with deterministic mathematical audits. Please confirm all details with the vendor before executing contracts.
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between bg-card text-xs text-muted-foreground">
              <span>
                Document: <strong className="text-foreground">{aiModalFile.name}</strong>
              </span>
              <Button size="sm" variant="outline" onClick={() => setAiModalFile(null)}>
                Close Intelligence Viewer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Raw Extracted Text Inspector Modal (Milestone 2) */}
      {inspectFile && inspectFile.extractionResult && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40 flex-wrap gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <ScanText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm truncate" title={inspectFile.name}>
                      {inspectFile.name}
                    </h4>
                    <Badge variant="outline" className="text-[10px]">
                      {inspectFile.extractionResult.totalPages} Pages
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {inspectFile.extractionResult.summary.totalWords} words •{" "}
                    {inspectFile.extractionResult.summary.totalCharacters} characters
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInspectFile(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[500px]">
              {/* Left Page List */}
              <div className="w-full md:w-60 border-r border-border bg-muted/20 p-3 overflow-y-auto space-y-1.5 shrink-0 max-h-48 md:max-h-none">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase px-2 mb-2 tracking-wider">
                  Pages ({inspectFile.extractionResult.pages.length})
                </div>

                {inspectFile.extractionResult.pages.map((p) => {
                  const isSelected = p.pageNumber === selectedPageNumber;
                  const isOcr = p.method === "ocr";
                  const hasWarning = p.warnings.length > 0;

                  return (
                    <button
                      key={p.pageNumber}
                      onClick={() => setSelectedPageNumber(p.pageNumber)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-gold/20 text-gold-900 border border-gold/40 shadow-xs"
                          : "text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <span className="font-semibold">Page {p.pageNumber}</span>
                      <div className="flex items-center gap-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            isOcr ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isOcr ? "OCR" : "TEXT"}
                        </span>
                        {hasWarning && <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Content */}
              <div className="flex-1 flex flex-col bg-card overflow-hidden">
                {currentPage ? (
                  <>
                    <div className="p-3.5 border-b border-border bg-muted/10 flex items-center justify-between">
                      <span className="font-bold text-sm">
                        Page {currentPage.pageNumber} of {inspectFile.extractionResult.totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyText(currentPage.text)}
                        className="text-xs h-7 px-2.5"
                        disabled={!currentPage.text}
                      >
                        {copiedText ? <Check className="w-3 h-3 mr-1 text-emerald-600" /> : <Copy className="w-3 h-3 mr-1" />}
                        Copy Page
                      </Button>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto bg-ivory-50/40">
                      <pre className="font-mono text-xs text-charcoal-800 whitespace-pre-wrap leading-relaxed select-text">
                        {currentPage.text || "[No extractable text on this page]"}
                      </pre>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            <div className="p-3 border-t border-border flex justify-end bg-card">
              <Button size="sm" variant="outline" onClick={() => setInspectFile(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Original Document Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold text-sm truncate">{previewFile.name}</h4>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPreviewFile(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

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

            <div className="p-3 border-t border-border flex justify-end bg-card">
              <Button size="sm" variant="outline" onClick={() => setPreviewFile(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Milestone 4: Multi-Vendor Comparison Modal */}
      <VendorComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        comparisonResult={comparisonResult}
        onRecalculateWeights={handleRecalculateWeights}
        isRecalculating={isRecalculatingWeights}
      />
    </div>
  );
}
