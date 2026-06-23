# 🧭 Bitácora del Sistema — Universo Merchan

> **Para quién lee esto:** este documento es el **testigo** que se pasa de una sesión de desarrollo a la siguiente (humano o IA). Antes de tocar nada, léelo entero: explica QUÉ hay, CÓMO está conectado y QUÉ no se debe romper. Se actualiza **en detalle en cada deploy a producción o cambio importante**.

---

## 0. Cómo está organizada esta documentación

| Documento | Qué contiene |
|-----------|--------------|
| **`docs/BITACORA.md`** (este) | Estado vivo del sistema + historial detallado de cambios importantes |
| `docs/PROJECT_MAP.md` | Mapa de rutas (front-store, admin, APIs) |
| `docs/ENVIRONMENT_VARIABLES.md` | Variables de entorno |
| `docs/SERVER_CRONTAB.md` | Crons del servidor |
| `docs/PENDING_TASKS.md` | Tareas pendientes |
| `CLAUDE.md` (raíz) | Roadmap y arquitectura general + reglas de mantenimiento |

---

## 1. Cómo se despliega (CRÍTICO — leer antes de tocar producción)

- **Servidor:** `root@212.227.90.110` (VPS Linux, sin escritorio).
- **Ruta del proyecto en el servidor:** `/var/www/universomerchan`
  ⚠️ NO es `/root/universomerchan` (rutas de scripts antiguos ya borrados).
- **Proceso PM2:** `universo-tienda` (NO `universomerchan` ni `all`).
- **Deploy manual por SSH.** Script reutilizable: **`./deploy.sh <archivo...>`** (en la raíz del proyecto). Hace:
  1. `scp` de los archivos al servidor (preservando subcarpetas)
  2. `cd /var/www/universomerchan && npm run build && pm2 restart universo-tienda`
  3. sincroniza `docs/` al servidor (para que la bitácora viva también allí)
- **No hay CI/CD.** La documentación oficial (`DEPLOY.md`) menciona GitHub Actions, pero **no existe**.

### ⚠️ Trampa conocida: variables `NEXT_PUBLIC_*`
En Next.js, las `NEXT_PUBLIC_*` se **incrustan en el momento del build**, no en runtime. Si el servidor hace `npm run build` sin esa variable definida, se queda el valor de fallback del código. Por eso conviene **hardcodear valores públicos críticos** (como el ID de Google Analytics) en lugar de depender solo del `.env`.

---

## 2. Stack y arquitectura (resumen)

- **Framework:** Next.js 14 (App Router) + TypeScript + Tailwind. App Router con i18n: todo cuelga de `src/app/[locale]/`.
- **BD:** PostgreSQL + Drizzle ORM.
- **Integraciones:** Midocean (catálogo/stock, +4.000 productos), Stripe (pagos B2C), SendGrid/Nodemailer (emails), Google Apps Script (flyer de los lunes), OpenAI + DALL-E (blog automático), LinkedIn (auto-publicación).
- **Layout raíz que envuelve TODAS las páginas:** `src/app/[locale]/layout.tsx`. Aquí viven los `<head>` globales y los scripts de tracking.

---

## 3. Tracking / Analítica (NO BORRAR)

Todo el tracking vive en `src/app/[locale]/layout.tsx`. **Prohibido borrarlo o desactivarlo salvo orden explícita de Marina.**

| Herramienta | ID | Notas |
|-------------|-----|-------|
| Google Analytics 4 (gtag.js) | `G-D24Y09H8SM` | Hardcodeado en el layout (a prueba de build sin env). Estrategia `afterInteractive`. |
| Google Tag Manager | `GTM-K7XX7K68` | |
| Meta Pixel | env `NEXT_PUBLIC_META_PIXEL_ID` | |
| Microsoft Clarity | `s21obhozfe` | También visible en `/admin/clarity` |

---

## 4. Historial de cambios importantes

<!-- Entrada más reciente arriba. Plantilla al final del archivo. -->

### 2026-06-23 — CRO Batch 1: conversión (guest checkout, sin Midocean, margen ×1,55, Avísame, muestra, reseñas)
- **Qué se cambió (desplegado con OK de Marina):**
  - **Margen ×1,40 → ×1,55** (`admin_settings.margin_product_pct` 40→55). OJO: sube TODOS los PVP ~10,7% (BAI ROLL 19,21€ → 21,27€). El margen real pasa de 28,6% a 35,5%. Tras cambiarlo hay que reiniciar PM2 (caché de precios catalog-api).
  - **Guest checkout:** carrito ya no muestra "Iniciar sesión para comprar" → siempre "Continuar al pago" (`cart/page.tsx`). El checkout invitado YA funcionaba; solo era la etiqueta. La clave `login_to_buy` sigue en messages (sin usar) — aparece en el HTML solo por el catálogo de next-intl, no se renderiza.
  - **Sin "Midocean" visible al cliente:** `Checkout.shipping_method_title` y `Account.proof_sending_order` neutralizados en 7 idiomas.
  - **"Consultar precio"** en productos sin precio (en vez de "Desde 0,00€"); **stock claro** en tarjetas ("{n} en stock" / "Bajo pedido" si 0) — `ProductCard.tsx`.
  - **"Avísame" en agotados:** `StockNotifyForm.tsx` + `/api/notify-stock` + `sendStockNotifyRequest()` → aviso a **universomerchan7@gmail.com**. Integrado en el configurador solo cuando `variant.stock<=0` y `!hasSize`.
  - **Muestra reembolsable AUTOMÁTICA:** cupón **`MUESTRA`** (fixed 20€, min_order_value 500€, activo) creado en tabla `coupons`. Mensaje en ficha (`Configurator.sample_desc`) indica el código. NO toca el flujo de pago (decisión segura). Marina puede ajustar valor/límite en /admin.
  - **Reseñas Google:** badge "★★★★★ Valoración 5/5 en Google" junto al CTA de producto (`Configurator.google_rating_note`).
- **Deploy:** tarball 14 archivos → build OK → UPDATE margen + INSERT cupón → `pm2 restart`. Commits locales `2ec189c` + `dd4c3e4`. **Verificado en vivo:** todas las páginas 200, BAI ROLL 21,27€ (margen nuevo), 0 "Midocean", "Continuar al pago" OK, `/api/notify-stock` valida (400 email inválido), cupón MUESTRA aplica a 600€ y rechaza a 100€ ("mínimo 500€").
- **Conexiones / qué NO romper:** el cupón MUESTRA es de momento PÚBLICO (cualquiera con un pedido ≥500€ puede usarlo) — abuso bajo por el mínimo; si se quiere único por cliente hace falta tocar el flujo de pago (v2, requiere test). Apple Pay ya activo en Stripe (sin código). Pago exprés sale solo en Stripe Checkout hospedado. Decisiones de negocio en memoria [[um-business-decisions]].
- **PENDIENTE del plan CRO (no desplegado):** tabla de precios por volumen visible, cross-sell en carrito, fecha estimada de entrega en checkout, consolidar líneas idénticas, recuperación de carrito abandonado (cron existe), auditoría móvil dedicada, imágenes WebP/AVIF, catálogo propio branded (Marina lo enviará — chip task_ee511a17).

### 2026-06-23 — País de envío por IP en el checkout (Cloudflare CF-IPCountry)
- **Qué pasaba / por qué:** desde que Cloudflare está activo, el visitante llega con la cabecera `CF-IPCountry` (país ISO-2 real). Se quería usar para pre-seleccionar el país en el checkout (y a futuro, el IVA por país).
- **Qué se cambió:** (1) **nuevo `src/app/api/geo/route.ts`** (GET, `force-dynamic`, `Cache-Control: no-store`): lee `headers().get("cf-ipcountry")`, filtra `XX`/`T1`/inválidos y devuelve `{ country: "ES" | null }`. (2) **`checkout/address/page.tsx`** (client): al cargar hace `fetch("/api/geo")` y pre-selecciona el país **SOLO si sigue en el `"ES"` por defecto** y el usuario no lo ha tocado (ref `countryTouched`, marcada en el `onChange` del `<select>`). No pisa direcciones guardadas en sessionStorage ni elecciones manuales. Tolerante a fallos (si /api/geo falla → se queda en ES).
- **Deploy:** scp 2 archivos → build OK → restart. Commit `6fbd966`. Verificado en vivo: `/api/geo` → `{"country":"ES"}` (vía Cloudflare, cf-ray presente). **Seguridad confirmada:** enviando una cabecera falsa `CF-IPCountry: FR` + IP falsa, Cloudflare la IGNORA y devuelve el país real (ES) → el dato es fiable (no se puede falsear el país/IVA).
- **Conexiones / qué NO romper:** `CF-IPCountry` solo llega si la petición pasa por Cloudflare (proxy naranja en `@`/`www`). El endpoint `/api/geo` está bajo `/api` (no indexable, robots lo bloquea). El país por IP es solo una SUGERENCIA inicial; el IVA real lo seguirá calculando Stripe Tax (cuando se active `STRIPE_TAX_ENABLED`). Lista de países válidos = `EU_COUNTRY_CODES` del checkout (EU-27).

### 2026-06-23 — SEO "nivel 11": breadcrumbs + ItemList JSON-LD, sameAs, H1 de categoría localizado
- **Qué se cambió:**
  - **`seo.ts`**: nuevos helpers `breadcrumbLd()`, `itemListLd()`, `productPath()` (slug = misma lógica que ProductCard/sitemap) y `SOCIAL_PROFILES`.
  - **Catálogo y categoría**: `BreadcrumbList` JSON-LD (Inicio › Catálogo › [Categoría]) + `ItemList` JSON-LD de los productos del listado. Clave `Seo.breadcrumb_home` (Inicio/Home/Accueil…) en los 7 idiomas.
  - **Producto**: breadcrumb ampliado a 4 niveles (Inicio › Catálogo › Categoría › Producto).
  - **Categoría — BUG SEO arreglado**: el H1 y los textos del hero usaban el nombre de categoría en español (`category`) en TODOS los idiomas. Ahora usan `currentCat.displayName` localizado (ej. `/fr` → "Sacs et voyages personnalisés"). El nombre ES (`category`) se mantiene SOLO para la query a `getProductList`/`getSubcategories` (es el valor de filtro canónico).
  - **`layout.tsx`**: `Organization.sameAs` con Instagram + LinkedIn (SEO de entidad).
- **Deploy:** 12 archivos (tarball) → build OK → restart. Commit `b3532da`. Verificado en vivo: BreadcrumbList + ItemList en `/catalog` y `/fr/categoria/...`, breadcrumb 4 niveles en producto, H1 localizado, sameAs presente.
- **Conexiones / qué NO romper:** en categoría, `category` (ES) = valor de filtro para queries; `categoryDisplay` = solo para mostrar. No cruzarlos. `productPath()` debe seguir alineado con ProductCard y el sitemap (3 sitios con la misma lógica de slug).

### 2026-06-23 — SEO multi-país europeo (hreflang, canonical por idioma, metadata traducida)
- **Qué pasaba / por qué:** la metadata SEO no estaba lista para multi-idioma: title/description iguales en los 7 idiomas, `hreflang` apuntaba a `/es` (el español vive en `/`, no `/es`), faltaba `x-default`, y —grave— el **canonical de producto/blog/categoría era fijo a la URL ES en TODOS los idiomas**, lo que hace que Google descarte las versiones traducidas (FR canonicaliza a la ES → no indexa la FR). Objetivo: que Google indexe y sirva cada idioma a su país.
- **Qué se cambió:**
  - **Nuevo `src/lib/seo.ts`** (helper central): `localeUrl(locale, path)` (ES sin prefijo, resto con `/xx`), `alternatesFor(locale, path)` → canonical AUTO-REFERENTE + `hreflang` de los 7 idiomas + `x-default`; `ogLocale`/`bcp47`/`SCHEMA_LANGUAGES`.
  - **`[locale]/layout.tsx`**: title/description traducidos (nuevo namespace `Seo` en messages) + OpenGraph + Twitter + `og:locale`/`og:locale:alternate` + `alternates`. JSON-LD: `availableLanguage` los 7 idiomas + `inLanguage` por locale.
  - **Producto, categoría**: title/description traducidos por idioma (usan name/displayName ya localizados) + breadcrumb JSON-LD localizado + `alternatesFor` (arregla el canonical por idioma).
  - **Catálogo y blog-listado**: añadido `generateMetadata` traducido (antes no tenían / era estático ES). Canonical del catálogo SIEMPRE a `/catalog` limpio (sin filtros) para no indexar duplicados de query.
  - **`sitemap.ts`**: hreflang correcto (ES sin prefijo) + `x-default`.
  - Namespace `Seo` en los 7 `messages/*.json` (paridad 819 claves).
- **Deploy:** 15 archivos (tarball) → `npm run build` OK → `pm2 restart`. Commit `0af939a`. Verificado en vivo: títulos traducidos (ES/FR/DE/IT…), canonical auto-referente por idioma, 7 hreflang + x-default en `<head>` y en `sitemap.xml` (2.434 URLs), `og:locale` correcto, todas las páginas 200.
- **Conexiones / qué NO romper:** Next renderiza el hreflang como `hrefLang` (L mayúscula) — es HTML válido (case-insensitive), Google lo lee bien, NO "arreglar". El campo `alternates` de una página hija REEMPLAZA al del layout (no se fusiona) — por eso cada página define su propio `alternatesFor`. `localeUrl` depende de `localePrefix: 'as-needed'` + `defaultLocale: 'es'`: si se cambia el prefijo de idioma, actualizar `seo.ts`. Próximo paso opcional: BreadcrumbList en catálogo/categoría, y revisar páginas legales (siguen ES).

### 2026-06-22 — 🚨 CRÍTICO: restauradas las zonas de impresión del configurador (8254 vs 165)
- **Qué pasaba / por qué:** el configurador visual mostraba "Sin zonas de impresión disponibles" en casi todos los productos (ej. BAI ROLL). Causa raíz: la tabla `print_positions` tenía solo **165 filas (51 productos)** cuando debería tener ~8000 (2465 productos). **Bug de sincronización:** la API de Midocean `printdata/1.0` entrega las zonas en el campo **`printing_positions`**, pero `fetchAllPrintData()` y `syncPrintData()` (en `midocean-api.ts` y `sync-engine.ts`) leían **`print_positions`** (campo inexistente) → el sync hacía `DELETE` de las zonas de cada producto y reinsertaba 0 → wipe. (NO era del i18n; el `last_synced_at` era del 17-jun, anterior a esos cambios. La API real devuelve 2414 productos con 8089 zonas bajo `printing_positions`, 0 bajo `print_positions` — verificado llamando a la API.)
- **Qué se cambió:** (1) `midocean-api.ts > fetchAllPrintData()`: aliasa `printing_positions`→`print_positions`. (2) `sync-engine.ts > syncPrintData()`: lee `printing_positions` con **guarda de seguridad** — solo borra+reinserta si la API devuelve zonas para ese producto (así una respuesta vacía/parcial nunca vuelve a borrar datos buenos). El mapeo de campos de cada posición (position_id, max_print_size_width/height, images[].print_position_image_blank/with_area/variant_color, points, printing_techniques) ya era correcto.
- **Deploy:** scp de los 2 archivos → backup de `print_positions` (165 filas) en `/tmp/print_positions_backup_165.sql` → `npm run sync:print` (script aislado, solo toca print_positions) → **165 → 8254 filas, 51 → 2465 productos** → `npm run build` + `pm2 restart`. Verificado en vivo: BAI ROLL (MO2230) carga 24 imágenes de zona, LLANA 40; LEGACY LSL (S04884) sigue en 0 porque Midocean no ofrece impresión para ese producto (correcto). Commit `2a73d3b`.
- **Conexiones / qué NO romper:** el campo de Midocean es `printing_positions` (con "ing"), NO `print_positions` — si alguien vuelve a leer el campo equivocado, se borran TODAS las zonas. El `sync:full` (cron cada 6h) ahora usa el código corregido y mantiene las zonas. La guarda evita wipes futuros. Tras re-sincronizar zonas hay que reiniciar PM2 (caché de producto). El backfill dejó 51 productos "huérfanos" (discontinuados, no en el printdata actual) con sus 165 zonas viejas — inofensivo.

### 2026-06-22 — Footer y categorías traducidos; aclaración del configurador (NO era fallo del deploy)
- **Qué pasaba / por qué:** tras el deploy i18n, Marina reportó 3 cosas en `/fr`: (1) el configurador de un producto (LEGACY LSL) mostraba "Sin zonas de impresión disponibles" y 0.00€; (2) los nombres de categoría de la home salían en español; (3) el footer salía en español.
- **(1) Configurador — NO es regresión, es dato faltante preexistente:** diagnóstico en BD de producción → LEGACY LSL (S04884/S04883) tiene **0 posiciones de impresión y 0 precios**. Globalmente solo **51 de 2.403 productos** tienen zonas de impresión (`print_positions`=165 filas, `last_synced_at` máximo = 17-jun, ANTES del deploy de hoy). El deploy NO escribe en la BD. El cambio i18n del `ProductConfigurator` fue casi todo texto `t()` (106 ins/99 del), la lógica de zonas/precio intacta. **Prueba:** productos CON datos funcionan perfecto y muestran precios reales: `/product/mo2164-llana` (LLANA, 5 zonas, 2.66€), `mo9048-tatchi`, `mo6947-charge-up`. → El configurador está bien; falta poblar `print_positions` para más productos (tema de cobertura de datos Midocean, preexistente, separado).
- **(2) Categorías — arreglado:** `category_translations` en `admin_settings` estaba vacío (0 filas) porque el `sync:full` con mi código de captura aún no había corrido. Se lanzó `npm run sync:full` (95 s) → guardó **262 categorías traducidas** (en/fr/de/it/pt/nl). Reiniciado PM2 para limpiar la caché de categorías (1h). Verificado: home `/fr` muestra categorías en francés (Bureau, Sacs…), 0 nombres en español.
- **(3) Footer — arreglado:** `src/components/layout/Footer.tsx` tening textos hardcodeados en ES (enlaces de catálogo, "Asistente IA", "Cómo funciona", "Aviso Legal", tagline, "Madrid, España", nota Europa, cabeceras). Convertidos a claves `t()` del namespace `Footer` (16 claves nuevas × 7 idiomas, paridad 808 claves). Commit `1ff712f`. Verificado en `/fr`: Entreprise, Bouteilles et thermos, Mentions légales, Production 80% européenne…
- **Deploy:** scp Footer + 7 `messages/*.json` → build OK → restart. Sync:full para categorías. Todo verificado en vivo.
- **Conexiones / qué NO romper:** las traducciones de categoría dependen de que el `sync:full` corra (cada 6h) con el código de `sync-engine.ts` que captura `category_translations`; tras cambiarlas hay que reiniciar PM2 o esperar 1h (caché). **Pendiente preexistente (NO urgente):** solo 51/2403 productos tienen `print_positions` → revisar por qué la sincronización de printdata de Midocean no cubre más productos (es lo que limita qué productos son personalizables).

### 2026-06-22 — Quitada la redirección automática de idioma (`/` siempre en español)
- **Qué pasaba / por qué:** tras el deploy i18n, `/` redirigía automáticamente al idioma del navegador o de la cookie `NEXT_LOCALE`. Marina (España) acababa en `/fr` porque al probar `/fr` durante el desarrollo se le guardó una cookie `NEXT_LOCALE=fr` que la dejaba "atrapada" en francés. (Diagnóstico: navegador español limpio SÍ daba español 200; solo la cookie/Accept-Language fr forzaba el 307→/fr. Cloudflare NO cacheaba el redirect: `cf-cache-status: DYNAMIC`.)
- **Qué se cambió:** `src/middleware.ts` → añadido `localeDetection: false` al `createMiddleware`. Ahora `/` sirve SIEMPRE el `defaultLocale` (es), sin redirigir por navegador ni cookie. El cambio de idioma es **solo manual** vía el selector de banderas (`LocaleSwitcher`, que navega a `/en`, `/fr`, … explícitamente). Las rutas `/xx` siguen funcionando.
- **Deploy:** scp de `src/middleware.ts` + `npm run build` + `pm2 restart universo-tienda`. Commit `904a5ce`. Verificado en vivo: `/` con navegador FR y con cookie `NEXT_LOCALE=fr` → 200 en español; `/fr` → 200 en francés; tracking intacto.
- **Conexiones / qué NO romper:** el SEO multi-idioma (auto-servir francés a franceses) queda desactivado a propósito; si en el futuro se quiere, NO volver a poner `localeDetection: true` (atrapa a usuarios por cookie) — mejor un banner suave tipo "¿Ver en tu idioma?". El selector de idioma depende de que las rutas `/xx` sigan existiendo.

### 2026-06-22 — Internacionalización europea (i18n 7 idiomas) + IVA por país + Cloudflare
- **Qué pasaba / por qué:** la web salía siempre en español aunque el visitante viniera de fuera (ej. París). Objetivo: idioma según el dispositivo/navegador + selector manual, contenido (productos/categorías/blogs) en el idioma del visitante, e IVA correcto por país de envío. Además se quería detectar el país por IP (Cloudflare) para el checkout.
- **Qué se cambió (61 archivos en `src/`):**
  - **UI en 7 idiomas** (es/en/fr/de/it/pt/nl) con `next-intl` (`messages/*.json`, ~790 claves): home, catálogo, producto, configurador, carrito, checkout, cuenta, auth, quiz/chatbot, blog, errores.
  - **Contenido dinámico localizado:** `src/lib/catalog-api.ts` sirve nombre/descripciones de producto y categorías en el idioma del visitante leyendo `translations[locale]` de Midocean (fallback ES). `sync-engine.ts` captura traducciones de categorías a `admin_settings`.
  - **Blogs autotraducidos al crearse:** `src/lib/blog-translate.ts` (6 llamadas OpenAI, preserva HTML) enganchado en cron generate-blog, webhook n8n y alta manual. Script `scripts/backfill-blog-translations.ts` para los antiguos (idempotente, `--force`).
  - **IVA por país** en `checkout/address` (EU-27 vía `Intl.DisplayNames`) + **Stripe Tax** (`automatic_tax`, `tax_id_collection` reverse charge B2B) en `src/lib/cart-checkout.ts`, **detrás del flag `STRIPE_TAX_ENABLED`** (OFF por defecto → checkout idéntico al actual).
  - **Selector de idioma** (`LocaleSwitcher.tsx`) + **barra superior** "Enviamos a toda Europa" (`TopBar.tsx`) en el layout.
- **Deploy:** tarball de los 61 archivos `src/` → extraído en `/var/www/universomerchan` → `npm run build` (OK) → `pm2 restart universo-tienda` (online). Commit de seguridad `8524b5c` en rama `feature/i18n-europe`. Verificado en vivo: home ES 200 (`lang=es`), navegador FR redirige 307→`/fr` 200 en francés, `/de` 200, barra OK, **tracking GA/GTM/Pixel/Clarity intacto**, `/api` sin bloqueo.
- **Cloudflare:** nameservers movidos a Cloudflare (`aliza`/`kenneth.ns.cloudflare.com`) — **ya ACTIVO** (`server: cloudflare`, `cf-ray ...-MAD`). Registros de correo (MX/DKIM/CNAMEs) en gris (DNS-only); solo `@`/`www` proxied. Header `CF-IPCountry` ya disponible en el servidor.
- **Conexiones / qué NO romper:**
  - **NO tocar el bloque de tracking** del layout (§3) — los IDs (`G-D24Y09H8SM`, `GTM-K7XX7K68`, Pixel, Clarity `s21obhozfe`) deben permanecer.
  - Las traducciones de UI viven en el código (no se pierden); las de producto/categoría se re-sincronizan de Midocean; los blogs se traducen al crearse → **arquitectura anti-pérdida** ante syncs futuros. El upsert de `sync-engine` preserva `customDescription`.
  - **PENDIENTE:** (1) confirmar en Cloudflare SSL/TLS = **Full (strict)** y Bot Fight Mode OFF; (2) **activar `STRIPE_TAX_ENABLED=true`** en `.env` del servidor + rebuild cuando se quiera cobrar IVA por Stripe (Stripe ya configurado: registro Nacional España, ROI/036 sí, "Incluir impuestos en precios"→No); (3) **cablear `CF-IPCountry`** para pre-seleccionar país en checkout; (4) correr `backfill-blog-translations.ts` en prod para blogs antiguos. Páginas legales se quedan en español (decisión de negocio).

### 2026-06-22 — Activación de Google Analytics en todas las páginas
- **Qué pasaba:** producción servía el placeholder `G-XXXXXXXXXX` en el tag de GA → Analytics no registraba nada, aunque `.env.local` ya tenía el ID correcto. Causa: el build de producción se hizo sin la env var (trampa `NEXT_PUBLIC_*`, ver §1).
- **Qué se cambió:** en `src/app/[locale]/layout.tsx` se fijó el ID real `G-D24Y09H8SM` como fallback hardcodeado (un Measurement ID GA4 es público) y se cambió la carga de `lazyOnload` → `afterInteractive`. Al estar en el layout raíz, cubre **todas** las páginas con una sola etiqueta (sin duplicados).
- **Deploy:** `scp` del layout a `/var/www/universomerchan` + `npm run build` + `pm2 restart universo-tienda`. Verificado en vivo: home y catálogo devuelven `G-D24Y09H8SM`.
- **Limpieza asociada:** se borraron 9 scripts `deploy-*.js/.sh` obsoletos (apuntaban a rutas/procesos viejos) y se creó `deploy.sh` reutilizable y correcto.
- **Conexiones / qué NO romper:** el bloque de tracking del layout es intocable (ver §3). El nombre de proceso PM2 correcto es `universo-tienda`.

---

## 5. Plantilla para nuevas entradas

```markdown
### AAAA-MM-DD — Título corto del cambio
- **Qué pasaba / por qué:** ...
- **Qué se cambió:** archivos concretos + qué hacen ahora.
- **Deploy:** comando usado + verificación en producción.
- **Conexiones / qué NO romper:** dependencias, efectos colaterales, cosas frágiles.
```
