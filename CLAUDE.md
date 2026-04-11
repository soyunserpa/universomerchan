# Universo Merchan - Master Roadmap & Arquitectura

Documento maestro para mantener el contexto del proyecto, tecnologías implementadas y próximos pasos estratégicos.

## Estructura Tecnológica
- **Frontend & Backend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS.
- **Base de Datos:** PostgreSQL (Alojado) + Drizzle ORM.
- **Integraciones Clave:**
  - Midocean API (Catálogo y Stock en tiempo real).
  - Google Apps Script Web App (Motor de automatización de envío de Correos).

## Módulos Completados (Estado: MEGA TOP 🏆)

### 1. Motor de E-Commerce B2B
- Catálogo sincronizado en tiempo real (más de 4.000 productos) con Midocean.
- Filtros avanzados de búsqueda y calculador dinámico de precios.
- Precios demarcados por intervalos de cantidad comerciales.
- Visualizador 3D para maquetas virtuales del producto.
- Generador de presupuestos dinámicos en PDF.

### 2. Generación Inteligente (El Chatbot Visual)
- **Generador "Pack Corporativo" (Wizard & Chat):** Capacidad de armar una colección armónica de productos basada en el sector y presupuesto del cliente sin contacto humano.
- **Captura de Leads Automática:** Integración invisible que enruta emails y teléfonos directamente a la Base de Datos al rellenar el formulario.
- **Propuesta Mágica (Auto-Emailer):** Al terminar, el Lead recibe una maquetación en HTML muy pulida con su pack, sus precios e imágenes en tiempo real.

### 3. CRM y Panel de Administración Completo (`/admin`)
- **Dashboard:** KPIs de ventas y métricas clave.
- **Pipeline de Ventas (CRM):** Tablero Kanban interactivo (Drag & Drop) para seguir el calor del Lead, con descarga específica y borrado de registros.
- **Contactos Globales:** Fusión algorítmica entre Clientes Registrados + Leads capturados en el embudo IA, cruzados sin duplicados para exportación universal de Mail Marketing.
- **Módulo de Clientes & Pedidos:** Seguimiento de gastos, control de descuentos VIP, carritos activos y carritos abandonados.
- **Motor SEO:** Automatización de Sitemaps dinámicos (80+ páginas calculadas), robots y Rich Snippets (JSON-LD) en el Blog y en cada producto individual.

---

## 🎯 ¿Qué Faltaría? (Siguientes Pasos Estratégicos)

Si el objetivo es la automatización absoluta de la plataforma para ponerla a facturar sola, las próximas fronteras lógicas son:

### 1. Pasarelas de Pago Directo (Checkouts Instantáneos)
Actualmente el flujo B2B tradicional es la confirmación y las Transferencias para pedidos muy grandes. Deberíamos conectar **Stripe B2B (Módulo Invoice/Card)** o **Redsys** si queréis poder facturar en automático ventas impulsivas con tarjeta por debajo de ~1000€.

### 2. Autopilot de Carritos Abandonados (Cron Jobs)
Tenemos toda la arquitectura y las plantillas de correo de *¡Te dejaste el carrito!* registradas, pero falta programar el "vigilante fantasma" (un nodo tipo **Vercel Cron** o un Worker en el Servidor PM2) que se ejecute en la sombra cada 1 hora para escanear qué usuarios no compraron y dispare el correo automático para revivir esas ventas perdidas.

### 3. Inyección de Pedidos Directa (Dropshipping con Midocean)
La guinda del pastel: Cuando un pedido es marcado como "Pagado" y el Boceto es "Aprobado" en panel, usar la API de órdenes de Midocean para lanzar la orden de producción final *directamente a su fábrica* sin que tengas que abrir el panel de Midocean para meterlo a mano.

### 4. Seguimiento de Conversiones para Anuncios (Analytics/Pixel)
Como el Visual Quiz va a ser un tragaluz de Leads brutal, es imperativo que configuremos **Google Tag Manager** y el **Meta Pixel / CAPI** para registrar el "Submit Lead". Si alguna vez pagas anuncios en Instagram, Facebook o Google Ads apuntando a tu Chatbot, necesitas que las plataformas optimicen la IA del anuncio sabiendo quién sí rellenó el mail.

### 5. Multilenguaje (Inglés / i18n) - A Largo Plazo
Si el dropshipping abarca el 80% de Europa (según indica tu footer), tener el front-end y los endpoints traducidos (usando Next-Intl) puede multiplicar radicalmente tu volumen de conversión europea.
