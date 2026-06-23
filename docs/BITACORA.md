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
