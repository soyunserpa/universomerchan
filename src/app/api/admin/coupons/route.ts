import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const coupons = await db.query.coupons.findMany({
            orderBy: [desc(schema.coupons.createdAt)],
        });
        return NextResponse.json({ success: true, coupons });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        // Basic validation
        if (!body.code || !body.discountType || !body.discountValue) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const [newCoupon] = await db.insert(schema.coupons).values({
            code: body.code.toUpperCase().trim(),
            discountType: body.discountType,
            discountValue: String(body.discountValue),
            minOrderValue: body.minOrderValue ? String(body.minOrderValue) : null,
            usageLimit: body.usageLimit ? parseInt(body.usageLimit) : null,
            isActive: body.isActive !== undefined ? body.isActive : true,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        }).returning();

        return NextResponse.json({ success: true, coupon: newCoupon });
    } catch (error: any) {
        // Handle unique constraint violation on code
        if (error.code === '23505') {
            return NextResponse.json({ success: false, error: "El código de cupón ya existe" }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
