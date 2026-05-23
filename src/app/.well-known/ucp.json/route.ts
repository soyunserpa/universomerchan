import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    ucp_version: "1.0",
    merchant_info: {
      name: "Universo Merchan",
      website: "https://universomerchan.com",
      google_merchant_id: "", // The user will need to configure this later in admin if needed, but not strictly required for discovery yet.
    },
    capabilities: {
      cart_management: true,
      product_sync: true,
      checkout_modes: ["redirect"]
    },
    endpoints: {
      products: "https://universomerchan.com/api/ucp/products",
      cart: "https://universomerchan.com/api/ucp/cart",
      checkout: "https://universomerchan.com/api/ucp/checkout"
    },
    auth: {
      type: "bearer" // We'll implement a simple bearer token for Google's agent
    }
  };

  return NextResponse.json(manifest, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    }
  });
}
