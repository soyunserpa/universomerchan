import { NextResponse } from "next/server";
import { readdir, stat, unlink } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/www/universomerchan/uploads";
const MAX_AGE_DAYS = 30; // Los mockups vivirán 30 días

// Función recursiva para buscar archivos en las subcarpetas YYYY/MM
async function traverseAndClean(dir: string, now: number, maxAgeMs: number): Promise<{ deleted: number; scanned: number }> {
    let deletedCount = 0;
    let scannedCount = 0;

    try {
        const entries = await readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                // Explorar subcarpeta (ej. "2026", "04")
                const stats = await traverseAndClean(fullPath, now, maxAgeMs);
                deletedCount += stats.deleted;
                scannedCount += stats.scanned;
            } else if (entry.isFile()) {
                scannedCount++;
                try {
                    const fileStats = await stat(fullPath);
                    const ageMs = now - fileStats.mtime.getTime();

                    if (ageMs > maxAgeMs) {
                        await unlink(fullPath);
                        deletedCount++;
                        console.log(`[Clean Mockups] Eliminado fichero antiguo: ${fullPath} (${Math.floor(ageMs / 1000 / 60 / 60 / 24)} días)`);
                    }
                } catch (err) {
                    console.error(`[Clean Mockups] Error analizando archivo ${fullPath}:`, err);
                }
            }
        }
    } catch (err: any) {
        if (err.code !== 'ENOENT') {
            console.error(`[Clean Mockups] Error leyendo carpeta ${dir}:`, err);
        }
    }

    return { deleted: deletedCount, scanned: scannedCount };
}

export async function GET(request: Request) {
    try {
        // Simple security layer: Authorization header token
        const authHeader = request.headers.get("authorization");
        if (
            process.env.CRON_SECRET &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
            request.headers.get("x-cron-secret") !== process.env.CRON_SECRET
        ) {
            // Permite invocación local de emergencia si no hay secret configurado (sólo en dev)
            if (process.env.NODE_ENV === "production") {
               return new NextResponse("Unauthorized", { status: 401 });
            }
        }

        const mockupsDir = path.join(UPLOAD_DIR, "mockups");
        const artworksDir = path.join(UPLOAD_DIR, "artworks");
        const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
        const now = Date.now();

        const mockupsResult = await traverseAndClean(mockupsDir, now, maxAgeMs);
        const artworksResult = await traverseAndClean(artworksDir, now, maxAgeMs);

        const totalDeleted = mockupsResult.deleted + artworksResult.deleted;
        const totalScanned = mockupsResult.scanned + artworksResult.scanned;

        return NextResponse.json({
            status: "success",
            message: `Limpieza ejecutada. Archivos comprobados: ${totalScanned}. Archivos eliminados (>30 días): ${totalDeleted}.`,
            deletedCount: totalDeleted,
            scannedCount: totalScanned,
            details: {
                mockups: mockupsResult,
                artworks: artworksResult
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
