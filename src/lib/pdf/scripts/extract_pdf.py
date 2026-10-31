#!/usr/bin/env python3
"""
Gathbandhan Hybrid PDF Text Extractor & OCR Fallback Engine
Extracts page-by-page text from vendor quotation PDFs using pypdf,
with automatic Tesseract OCR fallback for scanned or image-heavy pages.
"""

import sys
import os
import io
import json
import argparse
import shutil
from typing import Dict, Any, List, Optional

try:
    import pypdf
except ImportError:
    pypdf = None

try:
    from PIL import Image
except ImportError:
    Image = None

try:
    import pytesseract
except ImportError:
    pytesseract = None


def find_tesseract_executable(custom_path: Optional[str] = None) -> Optional[str]:
    """Locates the Tesseract OCR executable on the host system."""
    if custom_path and os.path.isfile(custom_path):
        return custom_path

    # Check PATH first
    which_path = shutil.which("tesseract")
    if which_path:
        return which_path

    # Check common Windows paths
    candidates = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
        os.path.expandvars(r"%LOCALAPPDATA%\Tesseract-OCR\tesseract.exe"),
    ]
    for candidate in candidates:
        if os.path.isfile(candidate):
            return candidate

    return None


def run_hybrid_extraction(
    pdf_path: str,
    min_text_length: int = 50,
    mock_ocr: bool = False,
    custom_tesseract_path: Optional[str] = None
) -> Dict[str, Any]:
    """Runs the hybrid page-level extraction on the specified PDF."""
    if pypdf is None:
        return {
            "totalPages": 0,
            "status": "failed",
            "error": "pypdf library is not installed in the Python runtime environment.",
            "pages": [],
            "summary": {"textPages": 0, "ocrPages": 0, "failedPages": 0, "totalCharacters": 0, "totalWords": 0},
            "tesseractAvailable": False,
            "warnings": []
        }

    if not os.path.isfile(pdf_path):
        return {
            "totalPages": 0,
            "status": "failed",
            "error": "Target PDF file does not exist on disk.",
            "pages": [],
            "summary": {"textPages": 0, "ocrPages": 0, "failedPages": 0, "totalCharacters": 0, "totalWords": 0},
            "tesseractAvailable": False,
            "warnings": []
        }

    # Setup Tesseract if present
    tesseract_cmd = find_tesseract_executable(custom_tesseract_path)
    tesseract_available = tesseract_cmd is not None and pytesseract is not None and Image is not None
    if tesseract_cmd and pytesseract is not None:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    # Initialize reader
    try:
        reader = pypdf.PdfReader(pdf_path)
    except Exception as e:
        return {
            "totalPages": 0,
            "status": "failed",
            "error": f"Failed to parse PDF document (corrupted or malformed): {str(e)}",
            "pages": [],
            "summary": {"textPages": 0, "ocrPages": 0, "failedPages": 0, "totalCharacters": 0, "totalWords": 0},
            "tesseractAvailable": tesseract_available,
            "warnings": []
        }

    # Handle encryption
    if reader.is_encrypted:
        try:
            decrypt_res = reader.decrypt("")
            if decrypt_res == 0 and reader.is_encrypted:
                return {
                    "totalPages": 0,
                    "status": "failed",
                    "error": "PDF is password-protected and cannot be extracted.",
                    "pages": [],
                    "summary": {"textPages": 0, "ocrPages": 0, "failedPages": 0, "totalCharacters": 0, "totalWords": 0},
                    "tesseractAvailable": tesseract_available,
                    "warnings": ["Document requires a password for decryption."]
                }
        except Exception as e:
            return {
                "totalPages": 0,
                "status": "failed",
                "error": f"PDF decryption failed: {str(e)}",
                "pages": [],
                "summary": {"textPages": 0, "ocrPages": 0, "failedPages": 0, "totalCharacters": 0, "totalWords": 0},
                "tesseractAvailable": tesseract_available,
                "warnings": []
            }

    total_pages = len(reader.pages)
    if total_pages == 0:
        return {
            "totalPages": 0,
            "status": "failed",
            "error": "PDF document contains 0 pages.",
            "pages": [],
            "summary": {"textPages": 0, "ocrPages": 0, "failedPages": 0, "totalCharacters": 0, "totalWords": 0},
            "tesseractAvailable": tesseract_available,
            "warnings": ["Empty document."]
        }

    pages_result: List[Dict[str, Any]] = []
    text_page_count = 0
    ocr_page_count = 0
    failed_page_count = 0
    total_characters = 0
    total_words = 0
    global_warnings: List[str] = []

    if not tesseract_available and not mock_ocr:
        global_warnings.append(
            "Tesseract OCR executable is not installed or accessible on this system. Scanned pages will rely on digital text extraction only."
        )

    for i, page in enumerate(reader.pages):
        page_number = i + 1  # 1-based index
        page_warnings: List[str] = []
        page_error: Optional[str] = None
        extracted_text = ""
        method = "text"
        status = "success"
        confidence: Optional[float] = None

        try:
            # 1. Digital text extraction via pypdf
            raw_text = page.extract_text() or ""
            clean_text = raw_text.strip()

            # Inspect images in page safely
            page_images_count = 0
            try:
                page_images_count = len(page.images)
            except Exception:
                page_images_count = 0

            # 2. Evaluate if text is sufficient
            has_sufficient_text = len(clean_text) >= min_text_length

            if has_sufficient_text:
                # Digital text was sufficient! Use pypdf extraction
                extracted_text = clean_text
                method = "text"
                status = "success"
                text_page_count += 1
            elif page_images_count > 0:
                # Page has insufficient text but contains embedded images -> Scanned Page candidate
                if mock_ocr:
                    # Mock OCR for unit testing when Tesseract binary is not installed
                    extracted_text = f"[OCR Extracted from Page {page_number}]: Luxury Wedding Catering Package, 500 Guests, Rs 2,500/plate, Total Rs 12,50,000"
                    method = "ocr"
                    status = "success"
                    confidence = 94.2
                    ocr_page_count += 1
                elif tesseract_available:
                    # Run actual Tesseract OCR on page images
                    ocr_texts: List[str] = []
                    conf_scores: List[float] = []

                    for img_file in page.images:
                        try:
                            pil_img = Image.open(io.BytesIO(img_file.data))
                            text_out = pytesseract.image_to_string(pil_img)
                            if text_out and text_out.strip():
                                ocr_texts.append(text_out.strip())

                            # Extract confidence from tesseract data
                            data = pytesseract.image_to_data(pil_img, output_type=pytesseract.Output.DICT)
                            valid_confs = [
                                float(c) for c in data.get("conf", [])
                                if isinstance(c, (int, float, str)) and float(c) >= 0
                            ]
                            conf_scores.extend(valid_confs)
                        except Exception as img_err:
                            page_warnings.append(f"Failed OCR on image: {str(img_err)}")

                    combined_ocr = "\n\n".join(ocr_texts).strip()

                    if combined_ocr and len(combined_ocr) > len(clean_text):
                        extracted_text = combined_ocr
                        method = "ocr"
                        status = "success"
                        ocr_page_count += 1
                        if conf_scores:
                            confidence = round(sum(conf_scores) / len(conf_scores), 1)
                    else:
                        # Fallback to digital text if OCR produced nothing better
                        extracted_text = clean_text
                        method = "text"
                        status = "warning" if not clean_text else "success"
                        text_page_count += 1
                        page_warnings.append("OCR produced no substantial text; retained minimal digital text.")
                else:
                    # Insufficient text and Tesseract is unavailable
                    extracted_text = clean_text
                    method = "text"
                    status = "warning"
                    text_page_count += 1
                    page_warnings.append(
                        "Page appears to be scanned or image-based, but Tesseract OCR is not installed on the system."
                    )
            else:
                # No images and insufficient text -> empty page or minimal header/footer
                extracted_text = clean_text
                method = "text"
                if len(clean_text) == 0:
                    status = "warning"
                    page_warnings.append("Empty page: no text or image content detected.")
                else:
                    status = "success"
                    page_warnings.append(f"Sparse text content ({len(clean_text)} chars).")
                text_page_count += 1

        except Exception as page_ex:
            # Page level isolation: failure on this page does not fail the whole document
            status = "error"
            page_error = f"Page {page_number} extraction error: {str(page_ex)}"
            failed_page_count += 1

        char_count = len(extracted_text)
        word_count = len(extracted_text.split()) if extracted_text else 0
        total_characters += char_count
        total_words += word_count

        pages_result.append({
            "pageNumber": page_number,
            "text": extracted_text,
            "method": method,
            "status": status,
            "confidence": confidence,
            "charCount": char_count,
            "wordCount": word_count,
            "warnings": page_warnings,
            "error": page_error
        })

    # Determine overall status
    if failed_page_count == total_pages:
        overall_status = "failed"
    elif failed_page_count > 0 or any(p["status"] == "warning" for p in pages_result):
        overall_status = "partial"
    else:
        overall_status = "completed"

    return {
        "totalPages": total_pages,
        "status": overall_status,
        "error": None,
        "pages": pages_result,
        "summary": {
            "textPages": text_page_count,
            "ocrPages": ocr_page_count,
            "failedPages": failed_page_count,
            "totalCharacters": total_characters,
            "totalWords": total_words
        },
        "tesseractAvailable": tesseract_available,
        "warnings": global_warnings
    }


def main():
    parser = argparse.ArgumentParser(description="Gathbandhan Hybrid PDF Extractor")
    parser.add_argument("--input", required=True, help="Absolute path to PDF file")
    parser.add_argument("--min-text-length", type=int, default=50, help="Minimum characters for digital text")
    parser.add_argument("--mock-ocr", action="store_true", help="Enable mock OCR for testing")
    parser.add_argument("--tesseract-cmd", default=None, help="Explicit path to tesseract binary")

    args = parser.parse_args()

    result = run_hybrid_extraction(
        pdf_path=args.input,
        min_text_length=args.min_text_length,
        mock_ocr=args.mock_ocr,
        custom_tesseract_path=args.tesseract_cmd
    )

    # Output pure JSON
    sys.stdout.write(json.dumps(result, indent=2))
    sys.stdout.flush()


if __name__ == "__main__":
    main()
