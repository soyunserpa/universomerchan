import { notFound } from "next/navigation";
import { getProductDetail, getProductList, type CatalogProductResponse } from "@/lib/catalog-api";
import { ProductConfigurator } from "@/components/product/ProductConfigurator";
import { ProductAccordion } from "@/components/product/ProductAccordion";
import { ProductCard } from "@/components/catalog/ProductCard";

interface ProductPageProps {
  params: { code: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  // El slug puede ser "MO9222-botella-de-aluminio". Extraemos solo el Master Code.
  const masterCode = params.code.split('-')[0].toUpperCase();
  const product = await getProductDetail(masterCode);
  if (!product) return notFound();

  // Fetch related products
  let relatedProducts: CatalogProductResponse[] = [];
  try {
    const relatedData = await getProductList({
      category: product.category,
      limit: 10,
    });
    
    // Exclude the current product and grab exactly 4 items
    relatedProducts = relatedData.products
      .filter((p) => p.masterCode !== product.masterCode)
      .slice(0, 4);
      
  } catch (e) {
    // Fail silently so the product page doesn't break if suggestions fail
    console.error("Failed to load related products", e);
  }

  // Calcula la fecha de validez del precio (+90 días) para el Schema de Google
  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + 90);
  const priceValidUntilString = validUntilDate.toISOString().split('T')[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 overflow-hidden">
      {/* JSON-LD Breadcrumb for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Catálogo", item: "https://universomerchan.com/catalog" },
              { "@type": "ListItem", position: 2, name: product.category, item: `https://universomerchan.com/catalog?category=${encodeURIComponent(product.category)}` },
              { "@type": "ListItem", position: 3, name: product.name },
            ],
          }),
        }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-900 mb-6">
        <a href="/catalog" className="hover:text-gray-600 transition-colors">Catálogo</a>
        <span>›</span>
        <a href={`/catalog?category=${encodeURIComponent(product.category)}`} className="hover:text-gray-600 transition-colors">
          {product.category}
        </a>
        <span>›</span>
        <span className="text-gray-700 font-medium">{product.name}</span>
      </nav>

      {/* Configurator — client component handles all interactivity */}
      <ProductConfigurator product={product} />

      {/* Accordion extra product info */}
      <ProductAccordion product={product} />

      {/* ── RELATED PRODUCTS SECTION ──────────────────────── */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 border-t border-surface-200 pt-16 pb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-gray-900 mb-2">También te podría interesar</h2>
              <p className="text-gray-500 text-sm">Explora productos similares dentro de la familia <b>{product.category}</b></p>
            </div>
            <a href={`/catalog?category=${encodeURIComponent(product.category)}`} className="text-brand-red font-semibold text-sm bg-brand-red/10 px-4 py-2 rounded-lg hover:bg-brand-red/20 transition-colors">
              Ver más de esta categoría
            </a>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProducts.map((p, i) => (
              <ProductCard key={p.masterCode} product={p as CatalogProductResponse} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* JSON-LD Schema for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: product.variants?.filter(v => v.mainImage).map(v => v.mainImage) || [product.mainImage],
            description: product.shortDescription || product.longDescription,
            sku: product.masterCode,
            mpn: product.masterCode,
            material: product.material || undefined,
            category: product.category,
            brand: {
              "@type": "Brand",
              name: "Universo Merchan",
            },
            manufacturer: {
              "@type": "Organization",
              name: product.brand || "Midocean",
            },
            ...(product.isGreen ? { additionalProperty: { "@type": "PropertyValue", name: "Sostenible", value: "Sí" } } : {}),
            offers: {
              "@type": "AggregateOffer",
              url: `https://universomerchan.com/product/${product.masterCode.toLowerCase()}-${product.name ? product.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : ""}`,
              priceCurrency: "EUR",
              lowPrice: Math.min(...(product.priceScales?.length ? product.priceScales.map(s => s.pricePerUnitRaw) : [product.startingPriceRaw || 0]), product.startingPriceRaw || 0),
              highPrice: Math.max(...(product.priceScales?.length ? product.priceScales.map(s => s.pricePerUnitRaw) : [product.startingPriceRaw || 0]), product.startingPriceRaw || 0),
              offerCount: product.variants?.length || 1,
              priceValidUntil: priceValidUntilString,
              itemCondition: "https://schema.org/NewCondition",
              availability: product.totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              seller: {
                "@type": "Organization",
                name: "Universo Merchan",
                url: "https://universomerchan.com",
              },
              shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingRate: {
                  "@type": "MonetaryAmount",
                  value: 15.00,
                  currency: "EUR"
                },
                shippingDestination: {
                  "@type": "DefinedRegion",
                  addressCountry: "ES"
                },
                deliveryTime: {
                  "@type": "ShippingDeliveryTime",
                  handlingTime: {
                    "@type": "QuantitativeValue",
                    minValue: 1,
                    maxValue: 3,
                    unitCode: "d"
                  },
                  transitTime: {
                    "@type": "QuantitativeValue",
                    minValue: 3,
                    maxValue: 7,
                    unitCode: "d"
                  }
                }
              },
              hasMerchantReturnPolicy: {
                "@type": "MerchantReturnPolicy",
                applicableCountry: "ES",
                returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
                merchantReturnDays: 14,
                returnMethod: "https://schema.org/ReturnByMail",
                returnFees: "https://schema.org/ReturnShippingFees",
                description: "Devoluciones en 14 días aplicables ÚNICAMENTE a productos sin marcaje. Los productos personalizados no admiten devolución."
              }
            },
            isRelatedTo: relatedProducts.slice(0, 3).map(rp => ({
              "@type": "Product",
              name: rp.name,
              url: `https://universomerchan.com/product/${rp.masterCode.toLowerCase()}-${rp.name ? rp.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : ""}`,
              image: rp.mainImage,
            })),
          }),
        }}
      />
    </div>
  );
}

export async function generateMetadata({ params }: ProductPageProps) {
  const masterCode = params.code.split('-')[0].toUpperCase();
  const product = await getProductDetail(masterCode);
  if (!product) return { title: "Producto no encontrado" };

  const slug = product.name ? product.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : "";
  const deterministicUrl = `/product/${product.masterCode.toLowerCase()}-${slug}`;

  return {
    title: `${product.name} — Universo Merchan`,
    description: product.shortDescription,
    alternates: {
      canonical: deterministicUrl
    },
    openGraph: {
      title: `${product.name} — Personalízalo con tu marca`,
      description: product.shortDescription,
      images: product.mainImage ? [product.mainImage] : undefined,
      url: `https://universomerchan.com${deterministicUrl}`,
    },
  };
}
