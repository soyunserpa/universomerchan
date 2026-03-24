import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-service";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/www/universomerchan/uploads";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req.headers.get("authorization"), "admin");
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category") || "blog-portadas"; // "blog-portadas" or "artworks" or "mockups"

    const baseDir = path.join(UPLOAD_DIR, category);
    
    // Safety check against directory traversal attacks
    if (!path.resolve(baseDir).startsWith(path.resolve(UPLOAD_DIR))) {
        return NextResponse.json({ error: "Acceso denegado a rutas ilegales" }, { status: 403 });
    }

    const files: any[] = [];
    
    async function scanDir(currentDir: string, relativeRoot: string = "") {
        try {
            const entries = await fs.readdir(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                const relPath = path.join(relativeRoot, entry.name);
                if (entry.isDirectory()) {
                    await scanDir(fullPath, relPath);
                } else if (entry.isFile() && !entry.name.startsWith(".")) {
                    const stats = await fs.stat(fullPath);
                    files.push({
                        name: entry.name,
                        url: `${SITE_URL}/uploads/${category}/${relPath.replace(/\\/g, "/")}`,
                        size: stats.size,
                        createdAt: stats.mtime,
                    });
                }
            }
        } catch(e) { 
            // Folder might not exist yet if no uploads were made, ignore harmlessly
        }
    }
    
    await scanDir(baseDir);

    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, files });
  } catch (error: any) {
    return NextResponse.json({ error: "No se pudieron cargar los medios" }, { status: 500 });
  }
}
