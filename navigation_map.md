# Mapa de Navegación Arquitectónico - Universo Merchan

Este documento mapea la relación bidireccional entre los diferentes módulos del frontend, la base de datos PostgreSQL, la API de Midocean y Stripe. **Debe consultarse obligatoriamente antes de realizar cualquier cambio o refactorización** para evitar efectos cascada (regresiones) en otras partes del flujo de negocio.

## 1. Módulo de Catálogo y Sincronización (Backend)

- **Rutas Principales:** Scripts de sincronización (`/src/app/api/cron/` o similares orientados a API) y Esquema Drizzle ORM (`/src/lib/schema.ts`).
- **Dependencia de Midocean:** Depende estrictamente de los endpoints REST `Products 2.0`, `Stock 2.0`, `Pricelist 2.0` y `Print Data 2.0`.
- **Riesgo Operativo (Qué afecta si se toca):** Si modificamos cómo se abstraen los JSONs de Midocean hacia las tablas relacionales (`products`, `variants`, `stock`, `product_prices`, `print_prices`, `print_manipulations`), **toda** la UI del frontal puede crashear, quedarse sin inventario falso o mostrar precios incorrectos.
- **Cadena de Flujo:** `Sync API Midocean` -> `DB (schema.ts)` -> `UI de Frontend`.

## 2. Módulo de Visualización y Configurador (Frontend)

- **Rutas Principales:** `/src/components/product/ProductConfigurator.tsx` y visor de mockups.
- **Comportamiento Clave:** Ingiere dimensiones de impresión (`printZones`), valida `variant.stock` impidiendo el flujo en caso de rotura de inventario, y calcula costes dinámicos de `setupCost` / `printCostPerUnit` cruzando el tipo de tabla de precios (`NumberOfColours`, `AreaRange`, etc.).
- **Riesgo Operativo:** Modificar cálculos matemáticos o estados de renderizado daña la pasarela e interrumpe la conversión. Cambiar la estructura iterativa de `sizeQuantities` podría romper el formateo del carrito.
- **Cadena de Flujo:** `ProductConfigurator` -> `Botón Añadir al Carrito (Mutando CartContext)` -> `/checkout/address/page.tsx`.

## 3. Módulo de Checkout y Procesamiento de Pagos (Stripe)

- **Rutas Principales:** `/src/app/api/checkout/create/route.ts`, `/src/lib/cart-checkout.ts`, `/src/app/checkout/address/page.tsx`.
- **Lógica de Servidor Propietario:** Autocálculo de la logística ("Envío Directo"). Pedidos \<= 300€ suman 8,00€ de cargo, si es \> 300€ el coste logístico desciende a 0€ (Gratuito).
- **Riesgo Operativo:** Es extremadamente frágil a modificaciones no estructuradas de TypeScript. Cualquier argumento en `createCheckoutSession` que falte o cualquier columna virtual inyectada en `db.update().set()` de Drizzle (ej. `checkoutUrl`) causará un `Internal Server Error (500)` al pulsar el botón final de pago, paralizando todas las ventas de la web.
- **Cadena de Flujo:** `CartContext` finaliza revisión en Frontend -> Pasa POST al motor Next.js API `/api/checkout/create` -> Base de datos crea pre-orden -> `cart-checkout.ts` arma Payload JSON para la SDK de Stripe -> Retorna `checkoutUrl` a cliente -> `Webhook` marca pedido como pagado.

## 4. Módulo de Fabricación y Despacho Automatizado a Fábrica (Order Entry)

- **Rutas Principales:** Conectores POST de creación en Midocean (`/src/lib/midocean/orders...` en plan futuro o actual).
- **Regla Oro Midocean:** En pedidos de textiles multisize (ej. 10 tipo S y 20 tipo M), **se deben unificar** los arrays de tallas en un solo `order_line` con `print_items` anidados, o Midocean cobrará el "Setup Cost" tantas veces como renglones haya, arruinando los márgenes comerciales.
- **Riesgo Operativo:** Cambios mal informados de la "Order Entry API V.1.11+" pueden resultar en JSON rebotados (Error 400 Bad Request) si faltan campos declarados como obligatorios.

---

### CÓMO USAR ESTE MAPA ANTES DE ESCRIBIR CÓDIGO

Si tienes que tocar **A y B**, comprueba en qué "Cadena de Flujo" recaen. Si B alimenta a un eslabón C (ej. Pasas la variable `expressShipping` desde Frontend pero C es `cart-checkout.ts`), ¡tienes que inyectar obligatoriamente la variable abstracta por la tubería completa mediante interfaces tipadas!
