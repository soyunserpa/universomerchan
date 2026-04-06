import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const body = await req.json();

        const [updatedCoupon] = await db.update(schema.coupons).set({
            code: body.code?.toUpperCase().trim(),
            discountType: body.discountType,
            discountValue: body.discountValue ? String(body.discountValue) : undefined,
            minOrderValue: body.minOrderValue ? String(body.minOrderValue) : null,
            usageLimit: body.usageLimit ? parseInt(body.usageLimit) : null,
            freeShipping: body.freeShipping !== undefined ? body.freeShipping : false,
            isActive: body.isActive,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
            updatedAt: new Date(),
        }).where(eq(schema.coupons.id, id)).returning();

        return NextResponse.json({ success: true, coupon: updatedCoupon });
    } catch (error: any) {
        if (error.code === '23505') {
            return NextResponse.json({ success: false, error: "El código de cupón ya existe" }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        await db.delete(schema.coupons).where(eq(schema.coupons.id, id));
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
