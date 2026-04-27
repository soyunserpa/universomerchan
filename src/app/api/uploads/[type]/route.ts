import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";
const ImageTracer = require("imagetracerjs");

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/www/universomerchan/uploads";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";

export async function POST(
    req: NextRequest,
    { params }: { params: { type: string } }
) {
    try {
        const { type } = params; // 'mockup' or 'artwork'
        if (!["mockup", "artwork"].includes(type)) {
            return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
        }

        const { dataUrl, ref, extension: extParam } = await req.json();

        if (!dataUrl || !dataUrl.startsWith("data:")) {
            return NextResponse.json({ error: "Invalid dataUrl format" }, { status: 400 });
        }

        // Format: data:image/png;base64,iVBORw0KGgo...
        const matches = dataUrl.match(/^data:([^;]*);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return NextResponse.json({ error: "Invalid base64 encoding" }, { status: 400 });
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        let buffer = Buffer.from(base64Data, "base64");

        // Determine extension (trust extParam if valid)
        let extension = extParam ? extParam.toLowerCase().replace(/[^a-z0-9]/g, "") : null;
        if (!extension) {
            if (mimeType === "image/jpeg") extension = "jpg";
            else if (mimeType === "image/webp") extension = "webp";
            else if (mimeType === "application/pdf") extension = "pdf";
            else if (mimeType === "image/svg+xml") extension = "svg";
            else extension = "png";
        }

        // [Midocean Compatibility Layer] - Auto Vectorization Engine
        // Midocean strictly requires vector files (.pdf, .ai, .eps) for most printing techniques.
        // If a user uploads a raster image (PNG/JPG), we automatically trace it into an SVG
        // and compile it into a print-ready native PDF document.
        if (type === "artwork" && !["application/pdf", "image/svg+xml"].includes(mimeType)) {
            try {
                // 1. Clean the image and extract raw RGBA pixel data
                const { data, info } = await sharp(buffer)
                    .ensureAlpha()
                    .raw()
                    .toBuffer({ resolveWithObject: true });

                const imgData = {
                    width: info.width,
                    height: info.height,
                    data: data
                };

                // 2. AI Vector Trace (Raster -> SVG string)
                // Options configured for high quality vectorization suitable for logos
                const svgString = ImageTracer.imagedataToSVG(imgData, { 
                    ltres: 1, 
                    qtres: 1, 
                    pathomit: 8, 
                    colorsampling: 1, 
                    numberofcolors: 16 
                });

                // 3. Compile SVG to Native PDF using a Promise
                buffer = await new Promise<Buffer>((resolve, reject) => {
                    const doc = new PDFDocument({ size: [info.width, info.height] });
                    const pdfBuffers: Buffer[] = [];
                    doc.on('data', pdfBuffers.push.bind(pdfBuffers));
                    doc.on('end', () => resolve(Buffer.concat(pdfBuffers)));
                    doc.on('error', reject);
                    
                    SVGtoPDF(doc, svgString, 0, 0, { assumePt: true });
                    doc.end();
                });

                extension = "pdf"; // Override extension to standard vector format
                
            } catch (vectorError) {
                console.error("[Upload API] Vectorization error:", vectorError);
                // Fallback to basic Sharp conversion if tracing fails
                try {
                    buffer = await sharp(buffer)
                        .toColorspace('srgb')
                        .withMetadata({ density: 300 })
                        .toFormat('png')
                        .png({ quality: 100 })
                        .toBuffer();
                    extension = "png";
                } catch (e) {}
            }
        }

        const hash = crypto.randomBytes(8).toString("hex");
        const safeRef = (ref || "file").replace(/[^a-zA-Z0-9-]/g, "_");
        const fileName = `${safeRef}-${hash}.${extension}`;

        const now = new Date();
        const yearMonth = now.getFullYear() + "/" + String(now.getMonth() + 1).padStart(2, "0");
        const targetDir = path.join(UPLOAD_DIR, type + "s", yearMonth); // uploads/mockups/YYYY/MM

        if (!existsSync(targetDir)) {
            await mkdir(targetDir, { recursive: true });
        }

        await writeFile(path.join(targetDir, fileName), buffer);

        // Return the public URL
        const publicUrl = `${SITE_URL}/uploads/${type}s/${yearMonth}/${fileName}`;

        return NextResponse.json({ url: publicUrl }, { status: 200 });
    } catch (error: any) {
        console.error(`[Upload API] ${params.type} error:`, error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
