import { NextResponse } from 'next/server';
import { getProductList } from '@/lib/catalog-api';

/**
 * GET /api/ucp/products
 * Implements UCP Product Sync. Google Universal Cart bots use this endpoint
 * to query realtime pricing and stock before adding items to the universal cart.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const masterCode = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Auth check - Basic protection to ensure only authorized bots call this
    const authHeader = req.headers.get('authorization');
    if (process.env.UCP_API_KEY && authHeader !== `Bearer ${process.env.UCP_API_KEY}`) {
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      // Skipping strict auth for now until waitlist is approved
    }

    const options: any = { limit };
    if (masterCode) {
      options.masterCodes = [masterCode];
    }
    
    const res = await getProductList(options);
    
    // Transform to UCP Product Schema
    const ucpProducts = res.products.map(p => ({
      id: p.masterCode,
      title: p.name,
      description: p.shortDescription || p.name,
      link: `https://universomerchan.com/product/${p.masterCode}`,
      image_link: p.mainImage || '',
      price: {
        value: p.startingPriceRaw.toFixed(2),
        currency: "EUR"
      },
      availability: p.totalStock > 0 ? "in_stock" : "out_of_stock",
      condition: "new",
      variants: p.variants.map(v => ({
        id: v.sku,
        title: `${p.name} - ${v.color}`,
        price: {
          value: p.startingPriceRaw.toFixed(2), // We simplify for the starting price
          currency: "EUR"
        },
        availability: v.stock > 0 ? "in_stock" : "out_of_stock",
        image_link: v.mainImage || p.mainImage || ''
      }))
    }));

    return NextResponse.json({ items: ucpProducts });

  } catch (err: any) {
    console.error('Error in UCP products API:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
