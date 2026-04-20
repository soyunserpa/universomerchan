# Documento de Memoria y Cambios Crecientes (MEMORY.md)

Este documento guarda un registro estructurado de las grandes modificaciones y nuevas capacidades que Universo Merchan ha adquirido esta semana para que sirva de contexto para futuros desarrollos.

> 🗺️ **VER MAPA DE ARQUITECTURA DETALLADO:** Para conocer todas las rutas de la App separadas por roles y su lógica interna, consulta [`docs/PROJECT_MAP.md`](./PROJECT_MAP.md).

---

### 1. Sistema Automatizado de Blog & LinkedIn Nativos
- **El Cambio:** El Google Apps Script (obsoleto y propenso a ser bloqueado por Cloudflare 1015) se deshabilitó para la publicación de blogs.
- **La Nueva Arquitectura:** El blog y su promoción en redes está 100% alojado de forma nativa en el servidor (VPS) de Next.js mediante el endpoint `/api/cron/generate-blog/route.ts`.
- **Ejecución Crontab:** El servidor Linux dispara un Cronjob de forma autónoma todos los días a las `0 7 * * *` (09:00 AM Hora de Madrid).
- **Control de API LinkedIn:** Dado que el Endpoint de Comentarios devolvía `403 Forbidden` (por restricciones de permisos sociales de la API de LinkedIn en 2026), se ha **actualizado la versión de API a 202604**. Sin embargo, al confirmarse la falta de scope para comentarios, **se eliminaron todas las frases de "enlace en el primer comentario"** y en su lugar, la URL del blog se incrusta limpia y de forma permanente en el cuerpo principal de todos los posts para asegurar el SEO sin generar confusión.

### 2. Memoria Inteligente del Flyer (WhatsApp)
- **El Problema:** El antiguo seleccionador de flyers (`/api/webhooks/flyer-data`) arrastraba productos aleatorios con riesgo de repetirlos entre semanas.
- **La Solución Anti-Repetición:** Se ha implementado un escudo utilizando la base de datos `admin_settings` buscando la llave oculta `flyer_history`.
- **Efecto Comercial:** El motor ahora recuerda los últimos 15 productos que te recomendó (el equivalente a las 5 últimas semanas) y los filtra implacablemente de las nuevas selecciones candidatas para pasarte siempre productos 100% nuevos e inéditos, y va empujando la lista para actualizar los 3 más recientes cada semana.

### 3. Microsoft Clarity Inyectado con Mapas de Calor
- **Integración Global:** Se ha inyectado el pixel avanzado e invisible (ID: `s21obhozfe`) de Microsoft Clarity en el nodo maestro `<head>` de la tienda mediante carga asíncrona (`src/app/layout.tsx`), asegurando coste cero de retraso en la página web.
- **Panel Intranet:** Se ha inaugurado la funcionalidad de **Mapas de Calor** en el panel de Administrador bajo la ruta de `/admin/clarity`. Debido a las políticas antibot de los iFrames puros de Microsoft, incluye un redireccionamiento cifrado a pantalla completa para el administrador.

### 4. Prueba Social Genuina: Google My Business en Home
- **La Mejora de Confianza:** La sección inferior de Reseñas ha saltado de los placeholders artificiales a reviews orgánicos recolectados en abril del propio perfil público en Google Maps de Universo Merchan.
- **Detalles Importantes:** En la zona frontal principal de la web ahora figuran valoraciones textualmente orgánicas de grandes cuentas como Julio Llopis, Maria Alejandra o Natalia Scalici con sus roles reales con una acreditación rotunda de **5 de 5 estrellas en su medalla verificada de Google**. 
