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
