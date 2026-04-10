import { ImageResponse } from 'next/og';
import { db } from "@/lib/database";
import { products, productVariants } from "@/lib/schema";
import { eq, sql, notInArray } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // Para modo seguro en el servidor real:
    // const auth = searchParams.get('token');
    // if (auth !== "whsec_UMblog_9Xq...");

    // Filtramos las categorías de textil/ropa que suelen inundar la base de datos
    // y dejamos que la IA rote aleatoriamente entre miles de opciones Premium reales de forma infinita
    const excludeCategories = [
      "Ropa y accesorios", 
      "Accesorios para la cabeza y multiusos"
    ];

    // 1. Fetch random visible products with variants to get real images
    const candidateProducts = await db.select({
      masterCode: products.masterCode,
      productName: products.productName,
      shortDescription: products.shortDescription,
      categoryLevel1: products.categoryLevel1,
      productAssets: products.digitalAssets,
      rawApiData: products.rawApiData,
    })
    .from(products)
    .where(notInArray(products.categoryLevel1, excludeCategories))
    .orderBy(sql`RANDOM()`)
    .limit(800);

    // 2. Filter 3 products with images and format text nicely
    const topProducts: any[] = [];
    const usedCategories = new Set<string>();

    for (const prod of candidateProducts) {
      if (topProducts.length >= 3) break;
      
      const displayName = prod.shortDescription || prod.productName;
      if (!displayName || topProducts.some(p => p.name === displayName)) continue;

      // Evitar que salgan catálogos o productos promocionales internos 
      if (displayName.toLowerCase().includes("catalog") || displayName.toLowerCase().includes("cat polish") || displayName.toLowerCase().includes("cat ")) continue;
      
      const cat = prod.categoryLevel1 || "General";
      // Exigir estricta variedad: Si ya usamos esta categoría, saltamos al siguiente producto
      if (usedCategories.has(cat)) continue;
      
      let imageUrl = "";
      
      // Intentar primero con las imágenes del producto principal (Suelen estar en products.digitalAssets)
      if (Array.isArray(prod.productAssets) && prod.productAssets.length > 0) {
        const prodImage = prod.productAssets.find((a: any) => a.type === "image" && a.subtype === "MAIN") 
          || prod.productAssets.find((a: any) => a.type === "image")
          || prod.productAssets[0];
          
        if (prodImage && typeof prodImage === 'object') {
          imageUrl = prodImage.url || prodImage.url_highres || prodImage.url_highress || prodImage.link || prodImage.src || "";
        }
      }

      // Fallback 2: Usar rawApiData
      if (!imageUrl && prod.rawApiData && typeof prod.rawApiData === 'object') {
          const raw = prod.rawApiData as any;
          if (Array.isArray(raw.images) && raw.images.length > 0) {
              const mainImg = raw.images.find((i: any) => i.is_main) || raw.images[0];
              imageUrl = mainImg.url || mainImg.url_highres || "";
          } else if (Array.isArray(raw.digital_assets) && raw.digital_assets.length > 0) {
              const mainImg = raw.digital_assets.find((a: any) => a.type === "image" && a.subtype === "MAIN") || raw.digital_assets.find((a: any) => a.type === "image");
              if (mainImg) imageUrl = mainImg.url || mainImg.url_highress || mainImg.url_highres || mainImg.src || "";
          }
          
          if (!imageUrl && Array.isArray(raw.variants) && raw.variants.length > 0) {
              for (const variant of raw.variants) {
                  if (Array.isArray(variant.digital_assets) && variant.digital_assets.length > 0) {
                      const mainImg = variant.digital_assets.find((a: any) => a.type === "image" && a.subtype === "item_picture_front") 
                        || variant.digital_assets.find((a: any) => a.type === "image");
                      if (mainImg) {
                          imageUrl = mainImg.url || mainImg.url_highress || mainImg.url_highres || "";
                          break;
                      }
                  }
              }
          }
      }

      if (!imageUrl || imageUrl.trim() === '' || imageUrl.endsWith('.eps') || imageUrl.endsWith('.pdf')) {
        continue;
      }
      
      // Fix protocol if missing
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      }

      const marketingTexts = [
        "Premia a tu equipo o sorprende a tus mejores clientes con este regalo corporativo de alto impacto.",
        "El detalle perfecto para fidelizar a clientes estratégicos y potenciar el Employer Branding.",
        "Máxima calidad para representar tu marca. Un básico imprescindible para el día a día.",
        "Un obsequio premium, práctico e inolvidable para destacar en tus próximas reuniones y eventos.",
        "Eleva la imagen de tu empresa con este regalo exclusivo, diseñado para dejar huella."
      ];
      const randomText = marketingTexts[topProducts.length % marketingTexts.length];

      topProducts.push({
        name: displayName,
        desc: randomText,
        image: imageUrl
      });
      usedCategories.add(cat);
    }

    // Fallback if db is empty, errors, or fails to find enough distinct valid products
    const fallbacks = [
      { name: "Botella Doble Pared 480ml", desc: "Mantiene la temperatura 12h. El welcome pack definitivo.", image: "https://cdn1.midocean.com/image/700X700/mo6327-40.jpg" },
      { name: "Vela de cera vegetal 280 gr", desc: "Aporta un ambiente cálido y sofisticado. Un detalle único.", image: "https://cdn1.midocean.com/image/700X700/mo6621-03.jpg" },
      { name: "Mochila Impermeable RPET", desc: "Diseño elegante y seguro. Protege los portátiles de tus directivos.", image: "https://cdn1.midocean.com/image/700X700/mo2181-03.jpg" }
    ];
    
    let fIdx = 0;
    while (topProducts.length < 3 && fIdx < fallbacks.length) {
       topProducts.push(fallbacks[fIdx]);
       fIdx++;
    }

    // 3. Render Image using Tailwind/Satori (Instagram Story Size 1080x1920)
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            padding: '60px',
            fontFamily: 'sans-serif',
            justifyContent: 'space-between',
          }}
        >
          {/* Top Header - Logo y Título */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <img src="https://universomerchan.com/images/logo.png" alt="Universo Merchan" width="349" height="120" style={{ objectFit: 'contain' }} />
            </div>
            <p style={{ fontSize: 32, color: '#e63946', margin: 0, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '4px', borderBottom: '4px solid #e63946', paddingBottom: '15px' }}>
              Top Novedades B2B
            </p>
            <p style={{ fontSize: 26, color: '#475569', marginTop: '25px', textAlign: 'center', maxWidth: '800px' }}>
              Personaliza estos increíbles regalos premium con tu logotipo y fideliza a tus mejores clientes o directivos.
            </p>
          </div>

          {/* Lista de 3 Productos Atractivos */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '30px', justifyContent: 'center' }}>
            {topProducts.slice(0, 3).map((prod, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: '#F8FAFC', 
                borderRadius: '24px', 
                padding: '25px 30px', 
                boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                border: '1px solid #F1F5F9'
              }}>
                <div style={{ position: 'relative', width: '280px', height: '280px', backgroundColor: 'white', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
                  <img src={prod.image} alt={prod.name} width="260" height="260" style={{ objectFit: 'contain' }} />
                  {/* Watermark Universo Merchan Logo */}
                  <div style={{ position: 'absolute', bottom: '10px', right: '10px', opacity: 0.9, display: 'flex' }}>
                    <img src="https://universomerchan.com/images/logo.png" alt="Universo Merchan" width="102" height="35" style={{ objectFit: 'contain' }} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginLeft: '40px' }}>
                  <h2 style={{ color: '#0f172a', fontSize: 38, margin: '0 0 15px 0', fontWeight: 'bold', lineHeight: 1.2 }}>
                    {prod.name.length > 40 ? prod.name.substring(0, 40) + '...' : prod.name}
                  </h2>
                  <p style={{ color: '#475569', fontSize: 28, margin: '0 0 20px 0', lineHeight: 1.4 }}>
                    {prod.desc}
                  </p>
                  <div style={{ display: 'flex' }}>
                    <span style={{ backgroundColor: '#e63946', color: 'white', padding: '10px 24px', borderRadius: '50px', fontSize: 24, fontWeight: 'bold' }}>
                      Pide Presupuesto
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Promocional */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: '#0f172a', 
            borderRadius: '24px',
            padding: '35px',
            marginTop: '20px'
          }}>
            <p style={{ display: 'flex', flexDirection: 'row', color: 'white', fontSize: 34, margin: 0, fontWeight: 'bold' }}>
              <span>Descubre más en</span>
              <span style={{ color: '#f87171', marginLeft: '12px' }}>universomerchan.com</span>
            </p>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1920,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate the image: ${e.message}`, { status: 500 });
  }
}
