import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const { code, subtotal } = await req.json();

        if (!code) {
            return NextResponse.json({ success: false, error: "El código es requerido" }, { status: 400 });
        }

        const coupon = await db.query.coupons.findFirst({
            where: eq(schema.coupons.code, code.toUpperCase().trim()),
        });

        if (!coupon) {
            return NextResponse.json({ success: false, error: "Cupón no válido" });
        }

        if (!coupon.isActive) {
            return NextResponse.json({ success: false, error: "Cupón inactivo" });
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return NextResponse.json({ success: false, error: "Este cupón ha caducado" });
        }

        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return NextResponse.json({ success: false, error: "Este cupón ha agotado su límite de usos" });
        }

        if (coupon.minOrderValue && subtotal < parseFloat(coupon.minOrderValue.toString())) {
            return NextResponse.json({ success: false, error: `Este cupón requiere un pedido mínimo de ${coupon.minOrderValue}€` });
        }

        return NextResponse.json({
            success: true,
            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: parseFloat(coupon.discountValue.toString()),
            }
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
