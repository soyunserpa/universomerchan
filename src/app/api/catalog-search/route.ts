import { getProductList } from '../../../lib/catalog-api';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ products: [] });
    }

    const res = await getProductList({
      search: query.trim(),
      limit: 5,
      sort: 'newest'
    });

    const products = res.products.map(p => ({
      name: p.name,
      masterCode: p.masterCode,
      image: p.mainImage || '',
      price: p.startingPrice ?? null,
      url: `https://universomerchan.com/product/${p.masterCode}`,
      colors: p.variants.length > 0
        ? Array.from(new Set(p.variants.map(v => v.color))).slice(0, 4).join(', ')
        : '',
    }));

    return NextResponse.json({ products });
  } catch (err: any) {
    console.error('Error in catalog-search:', err);
    return NextResponse.json({ products: [] });
  }
}
