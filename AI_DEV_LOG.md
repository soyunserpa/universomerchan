# Diario de Desarrollo de Universo Merchan (AI Context)
Este archivo se utiliza para mantener un registro y contexto continuo de las tareas realizadas y pendientes entre las distintas sesiones de programación con la Inteligencia Artificial.

## 📝 Tareas Pendientes o en Pausa

### 1. Automatización de Publicación en LinkedIn (En Pausa)
- **Estado:** Pendiente de revisión por parte del soporte de LinkedIn.
- **Contexto:** Hemos estado configurando el Google Apps Script para que el blog automático generado por GPT-4o y DALL-E se publique también directamente en la página de empresa Universo Merchan en LinkedIn.
- **Bloqueo actual:** LinkedIn requiere una revisión manual a través de un "Access request form" para acceder a la "API de gestión de la comunidad" (que nos da el permiso `w_organization_social`).
- **Próximos pasos (cuando LinkedIn apruebe):** 
  1. Entrar al Generador de Tokens en el Portal de Desarrolladores de LinkedIn.
  2. Seleccionar la nueva App ("Universo Merchan Corporativo").
  3. Marcar el tick de `w_organization_social` y generar el Access Token.
  4. La IA (yo) debe añadir la función de llamada HTTP a la API de LinkedIn al final del Google Apps Script pasándole el título y link del nuevo post generado.

---

## 🛑 Reglas Críticas Anti-Regresiones (Lessons Learned)

1. **Extracción de Imágenes (Midocean API):** Cuando se busque una imagen de producto para un automatismo, Flyer o feed XML, **NUNCA depender ciegamente de `products.digitalAssets[0]`**. Muchos productos de Midocean devuelven documentos `.pdf` o `.eps` (certificados, manuales) en ese array. 
   - **Solución Obligatoria:** Siempre hacer *fallback* a `products.rawApiData.images` o `products.rawApiData.digital_assets` y filtrar estrictamente la URL final: `if(url.endsWith('.pdf') || url.endsWith('.eps')) continue;`. Si se pasa un PDF a un sistema que espera imágenes (como Satori, n8n, ImageResponse o Plantillas de Correo), el proceso crasheará o enviará correos rotos.

---

## ✅ Historial Reciente de Cambios 

### 15/04/2026 - Corrección de Webhooks para Flyers (n8n / API)
- **Bug Fix:** El flujo de correos automáticos semanales de n8n ("Flyer de los Lunes") fallaba silenciosamente por intentar pasar PDFs como si fueran imágenes de producto.
- **Solución:** Se igualó la lógica de `/api/webhooks/flyer-data` con la extracción blindada usada en `/api/webhooks/flyer-image`. Ahora interroga correctamente el objeto `rawApiData` de la base de datos y esquiva cualquier archivo `.pdf` / `.eps`. Desplegado a producción mediante script SSH.

### 05/04/2026 - Motor Autónomo de Despliegue y Autenticaciones
- **Despliegue a Producción (Script Recursivo):** Refactorizado completamente el script `deploy-to-linux.js` para usar lectura recursiva. Ya no depende de una lista ciega, sino que clona intacta toda la estructura de carpetas `src` y `public`, y construye los árboles de directorios remotos automáticamente con `conn.exec(mkdir -p)`. Corregida la sincronización de +150 archivos faltantes, reviviendo rutas como `/admin/coupons`, reseteo de contraseñas y webhooks.
- **Webhook de Blog Automático:** Actualizado el endpoint `/api/webhooks/n8n-blog/route.ts` con sistema dual de seguridad usando Bearer token proveniente de `.env`.
- **DALL-E 3 Interceptor:** El propio Webhook ahora intercepta si la imagen recibida es temporal (como las de OpenAI) y procede a descargarla usando `uploadArtwork` y grabarla de forma perpetua en el file system interno (`blog-portadas`) antes de publicarla, protegiéndola contra la expiración de memoria de OpenAI en 60 mins.
- **Google Apps Script Blog (N8N Substitute):** Desarrollado y funcionalcript que cada día entre las 8-9h autogenera un artículo completo de 600 palabras (GPT-4o), le pide una imagen perfecta (DALL-E 3) y usa el Webhook para insertarla publicamente. Coste mensual de ~1,50$.
