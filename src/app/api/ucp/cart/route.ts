import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { ucpCarts } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * UCP Cart Endpoint
 * Handles Google Universal Cart operations
 */

function generateUcpCartId() {
  return `ucp_cart_${crypto.randomBytes(16).toString('hex')}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cartId = searchParams.get('cart_id');
    
    if (!cartId) {
      return NextResponse.json({ error: 'Missing cart_id' }, { status: 400 });
    }

    const cartData = await db.query.ucpCarts.findFirst({
      where: eq(ucpCarts.ucpCartId, cartId)
    });

    if (!cartData) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    return NextResponse.json({
      cart_id: cartData.ucpCartId,
      items: cartData.items,
      total: {
        value: cartData.totalAmount,
        currency: cartData.currency
      },
      status: cartData.status
    });

  } catch (err: any) {
    console.error('UCP Cart GET Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { cart_id, items, action } = body;
    
    // Create new cart if missing
    if (!cart_id) {
      cart_id = generateUcpCartId();
      await db.insert(ucpCarts).values({
        ucpCartId: cart_id,
        items: JSON.stringify(items || []),
        totalAmount: "0"
      });
    } else {
      // Update existing cart
      const existing = await db.query.ucpCarts.findFirst({
        where: eq(ucpCarts.ucpCartId, cart_id)
      });
      
      if (!existing) {
        return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
      }

      await db.update(ucpCarts)
        .set({ 
          items: JSON.stringify(items || []),
          updatedAt: new Date()
        })
        .where(eq(ucpCarts.ucpCartId, cart_id));
    }

    return NextResponse.json({
      cart_id,
      status: 'success',
      items: items || []
    });

  } catch (err: any) {
    console.error('UCP Cart POST Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
