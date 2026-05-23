import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { ucpCarts } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * UCP Checkout Endpoint
 * Handles Universal Cart checkout intent.
 * In Redirect Mode, this returns a URL to the merchant's checkout page.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cart_id } = body;

    if (!cart_id) {
      return NextResponse.json({ error: 'Missing cart_id' }, { status: 400 });
    }

    // Verify cart exists
    const cartData = await db.query.ucpCarts.findFirst({
      where: eq(ucpCarts.ucpCartId, cart_id)
    });

    if (!cartData) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    // Generate redirect URL to our store where the UCP cart will be hydrated
    // and passed to Stripe Checkout
    const checkoutUrl = `https://universomerchan.com/cart?ucp_transfer=${cart_id}`;

    // Mark cart as checked out in UCP tracking (optional, depends on specific flow)
    await db.update(ucpCarts)
      .set({ status: 'checked_out', updatedAt: new Date() })
      .where(eq(ucpCarts.ucpCartId, cart_id));

    return NextResponse.json({
      status: 'success',
      checkout_type: 'redirect',
      redirect_url: checkoutUrl
    });

  } catch (err: any) {
    console.error('UCP Checkout POST Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
