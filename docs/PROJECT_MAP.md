# Mapa de Navegación y Arquitectura del Servidor

Este documento desglosa la anatomía completa de Universo Merchan, separando las ramas de administración, la capa pública (front-store) y la intrincada red de APIs automatizadas.

## 1. Front-Store (Rutas Públicas B2B & B2C)
El escaparate e-commerce construido para los clientes. Sigue un flujo de conversión guiado:
* **`/` (Home):** Landing page principal. Contiene hero visual de productos destacables en negro, carrusel de Trusted By (animación infinita), la sección dinámica de Midocean y las reseñas integradas de Google Maps de clientes reales (Julio Llopis, Maria Alejandra, etc.).
* **`/catalog`:** El cerebro de la tienda. Muestra los +4.000 artículos sincronizados. Dispone de un mega-filtro de categorías y colores mapeados a CSS.
* **`/product/[masterCode]`:** Página de detalle de producto. Lee variaciones, stock en tiempo real y alberga el visualizador 3D/impresión.
* **`/cart` & `/checkout`:** Sistema de carrito persistente y checkout que diferencia cotizaciones B2B de pagos B2C usando el ecosistema de presupuestos. Incorpora **Guest Checkout Híbrido** (creando Ghost Accounts en base de datos para no obligar a iniciar sesión) y gestión arquitectural fluida de parámetros de URL para reanudaciones de compras tras el registro.
* **`/quiz`:** Flujo Octane AI nativo. Cuatro pasos calificados que terminan generando leads (`/api/quiz-leads`) para convertirlos en presupuestos desde el CRM.
* **`/blog`:** Central de contenidos SEO gestionada íntegramente por el cronjob de AI.

## 2. Intranet Admin (Rutas Privadas `/admin`)
Panel de control con acceso condicionado (Rol: `admin`).
* **`/admin/dashboard` & `/admin/crm`:** Centro de mando general. Métricas de tráfico y embudos del Quiz transformados en Leads.
* **`/admin/orders` & `/admin/quotes`:** Motor de logística que monitoriza el ciclo de vida del catálogo Midocean (Draft -> Pedido Midocean -> Prueba de Impresión -> Enviado).
* **`/admin/blog`:** Interfaz humana para editar artículos (se han solucionado los antiguos fallos de persistencia silenciosos).
* **`/admin/clarity`:** Iframe seguro implementado recientemente que esquiva el bloqueo en navegadores para espiar las sesiones grabadas de Microsoft Clarity de los clientes.
* **`/admin/emails`:** Gestión visual de las plantillas base del sistema usando SendGrid/Nodemailer.
* **`/admin/settings`:** (NUEVO) Acoge las configuraciones maestras, como la nueva memoria `flyer_history` que nutre al bot anti-repeticiones de los Lunes.

## 3. Automatización Invisible y APIs (`/api`)
El corazón pulsante alojado en el VPS Linux.
* **`/api/cron/generate-blog`:** (Ejecución Cron): Invocado cada mañana a las 09:00. Usa GPT-4o para texto semental B2B, genera cover con DALL-E 3 y auto-publica permanentemente en la página de empresa de LinkedIn enrutando directamente el anchor URL en el post principal.
* **`/api/webhooks/flyer-data`:** Gateway autorizado exclusivo para la macro-secuencia de n8n o triggers externos. Lanza los extractos de 3 productos semanales verificando en el log que jamás se repitan artículos durante un mes calendario entero.
* **`/api/orders & /api/quotes`:** Escucha directa contra la arquitectura SOAP/REST de Midocean para lanzar presupuestos en PDF, inyectar pedidos finales y aprobar bocetos virtuales (proofs).
