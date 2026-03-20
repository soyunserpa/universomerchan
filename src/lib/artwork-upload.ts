// ============================================================
// UNIVERSO MERCHAN — Artwork Upload Service
// ============================================================
// Handles customer logo/design uploads with validation.
// 
// Accepted formats: PDF, AI, EPS, SVG, PNG (high res)
// Max file size: 25MB
// Storage: Local filesystem or S3-compatible
//
// The uploaded artwork URL is used in two places:
//   1. Our visualizer (mockup preview)
//   2. Midocean's print_artwork_url field in Order Entry API
// ============================================================

import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/www/universomerchan/uploads";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/postscript": [".ai", ".eps"],
  "image/svg+xml": [".svg"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "application/illustrator": [".ai"],
  "application/eps": [".eps"],
};

const ALLOWED_EXTENSIONS = [".pdf", ".ai", ".eps", ".svg", ".png", ".jpg", ".jpeg"];

export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  error?: string;
  warnings?: string[];
}

export interface ArtworkValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    extension: string;
  };
}

// ============================================================
// VALIDATE ARTWORK FILE
// ============================================================

export function validateArtwork(
  fileName: string,
  fileSize: number,
  fileType: string,
): ArtworkValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const extension = path.extname(fileName).toLowerCase();
  
  // Check extension
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    errors.push(
      `Formato no soportado (${extension}). Formatos aceptados: PDF, AI, EPS, SVG, PNG`
    );
  }
  
  // Check size
  if (fileSize > MAX_FILE_SIZE) {
    const sizeMB = Math.round(fileSize / 1024 / 1024);
    errors.push(`Archivo demasiado grande (${sizeMB}MB). Máximo: 25MB`);
  }
  
  if (fileSize < 1024) {
    warnings.push("El archivo es muy pequeño. Asegúrate de que es el archivo correcto.");
  }
  
  // Warnings for non-vector formats
  if (extension === ".png" || extension === ".jpg" || extension === ".jpeg") {
    warnings.push(
      "Recomendamos formato vectorial (PDF, AI, EPS, SVG) para mejor calidad de impresión. " +
      "Las imágenes rasterizadas pueden perder calidad en tamaños grandes."
    );
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileInfo: {
      name: fileName,
      size: fileSize,
      type: fileType,
      extension,
    },
  };
}

// ============================================================
// UPLOAD ARTWORK — Save to local filesystem
// ============================================================

export async function uploadArtwork(
  fileBuffer: Buffer,
  fileName: string,
  fileType: string,
  userId?: number,
): Promise<UploadResult> {
  try {
    // Validate
    const validation = validateArtwork(fileName, fileBuffer.length, fileType);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(". "),
      };
    }
    
    // Generate unique filename
    const hash = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(fileName).toLowerCase();
    const safeName = `artwork_${Date.now()}_${hash}${ext}`;
    
    // Create directory structure: /uploads/artworks/YYYY/MM/
    const now = new Date();
    const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
    const dir = path.join(UPLOAD_DIR, "artworks", yearMonth);
    
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    
    // Save file
    const filePath = path.join(dir, safeName);
    await writeFile(filePath, fileBuffer);
    
    // Generate public URL
    const relativePath = `/uploads/artworks/${yearMonth}/${safeName}`;
    const fileUrl = `${SITE_URL}${relativePath}`;
    
    console.log(`[Artwork] Uploaded: ${fileName} → ${filePath} (${Math.round(fileBuffer.length / 1024)}KB)`);
    
    return {
      success: true,
      fileUrl,
      fileName: safeName,
      fileSize: fileBuffer.length,
      fileType,
      warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
    };
    
  } catch (error: any) {
    console.error("[Artwork] Upload error:", error.message);
    return {
      success: false,
      error: "Error interno al subir el archivo. Inténtalo de nuevo.",
    };
  }
}

// ============================================================
// UPLOAD MOCKUP — Save the generated mockup image
// ============================================================

export async function uploadMockup(
  imageDataUrl: string, // data:image/png;base64,...
  orderRef: string,
): Promise<string | null> {
  try {
    // Extract base64 data
    const matches = imageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      console.error("[Mockup] Invalid data URL format");
      return null;
    }
    
    const ext = matches[1]; // "png"
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");
    
    // Save
    const hash = crypto.randomBytes(4).toString("hex");
    const safeName = `mockup_${orderRef}_${hash}.${ext}`;
    const now = new Date();
    const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
    const dir = path.join(UPLOAD_DIR, "mockups", yearMonth);
    
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    
    const filePath = path.join(dir, safeName);
    await writeFile(filePath, buffer);
    
    const relativePath = `/uploads/mockups/${yearMonth}/${safeName}`;
    const fileUrl = `${SITE_URL}${relativePath}`;
    
    console.log(`[Mockup] Saved: ${filePath} (${Math.round(buffer.length / 1024)}KB)`);
    
    return fileUrl;
    
  } catch (error: any) {
    console.error("[Mockup] Save error:", error.message);
    return null;
  }
}

// ============================================================
// FORMAT FILE SIZE — Human readable
// ============================================================

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
