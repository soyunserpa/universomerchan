# Contexto del Proyecto

'Universomerchan' es un proyecto web e-commerce en desarrollo activo, con integración avanzada de catálogo y pedidos personalizados.

# Reglas de Seguridad Críticas

- **Atención:** Estás operando como usuario root.
- **NUNCA** ejecutes comandos destructivos como `rm -rf`.
- **NUNCA** borres, corrompas o elimines la base de datos de producción o pruebas.
- **SIEMPRE** haz un `git commit` y asegúrate de que el código está respaldado en repositorio antes de realizar refactorizaciones o cambios masivos en el código.

# Flujo de Trabajo y Ciclo de Vida del Código

1. **Investigación Obligatoria:** ANTES de hacer u opinar sobre cualquier cambio relacionado con productos, inventario o pedidos, **debes consultar primero la `Documentación API Midocean.md` y luego releer este `CLAUDE.md`**.
2. **Propuesta y Ejecución:** Propón un plan. Una vez aprobado, **escríbelo y aplícalo tú mismo** en las carpetas locales de este ordenador.
3. **Registro Continuo:** Todo conocimiento nuevo adquirido sobre la arquitectura, Midocean o el proyecto **debe ser documentado inmediatamente en este `CLAUDE.md`**.
4. **Despliegue Total (End-to-End):** Tú eres responsable de desplegar completamente. Al finalizar una tarea debes:
   - Guardar los cambios localmente en el Mac.
   - Hacer `git add`, `git commit` y `git push` a Github.
   - Desplegar forzadamente en el servidor de producción (vía `ssh` usando herramientas como `expect` para proveer la contraseña o métodos equivalentes), ejecutando `git pull`, `npm run build` y `pm2 restart all`.

# Estilo de Código

- Escribe siempre código **limpio, modular y escalable** estructurado para Next.js / React (TypeScript).
- Añade **comentarios claros** en las funciones complejas para mantener el código documentado (ej. lógicas de integración de API Midocean, cálculos de precios o visualizadores).

# Conocimiento Adquirido (Midocean Integration)

- **Costes de Setup (Tallas Múltiples):** Para productos textiles con impresión (PRINT), si el usuario solicita varias tallas del mismo color (ej. 10xS, 20xM), Midocean espera que se envíen **juntas en una sola `order_line`**, inyectando las tallas dentro de un array de `print_items`. Si se envían en `order_lines` separadas, Midocean cobrará el "Setup Cost" múltiples veces incurriendo en un sobrecoste erróneo.
- **Flujo de Carrito (Textiles):** La UI del configurador expone un *grid* de cantidades por talla (`sizeQuantities`), pero la memoria del carrito genera diferentes `CartItem` por talla. La unificación de tallas debe suceder mediante agrupación algorítmica justa antes de armar la request en `submitOrderToMidocean` dentro de `cart-checkout.ts`.
- **Líneas de Pedido y Pruebas (Proofs):** Cuando Midocean agrupa tallas, asigna un único `order_line_id`. Para asegurar que los webhooks de aprobación de proofs funcionen, usamos dinámicamente el `lineNumber` multiplicado por 10 del **primer registro** de base de datos que conforme ese grupo.
- **Precios Dinámicos por Volumen (Scales):** Originalmente, el script de sincronización `sync-prices` ignoraba el array `scale` de la API de *pricelist* de Midocean, grabando permanentemente el precio base más caro. Esto se ha corregido guardando fielmente cada escalón en `variant_prices.price_scales` y luego consolidándolo para el listado global en `product_prices`.
- **Espejismo de Midocean (Gastos de Envío):** Ocasionalmente parece que Midocean aplica un descuento unitario muy suculento a algunos artículos planos (ej. MO6580). Se ha documentado que esto es falso: el precio de la libreta sigue estático en su catálogo (sin descuento por volumen), pero el campo "Precio Promedio" de la web corporativa engaña porque recalcula diluyendo los 8,00€ de "Portes Web" cuando se piden cantidades que alcanzan envío gratuito. La plataforma *Universo Merchan* refleja el precio unitario lícito + el margen comercial establecido.
