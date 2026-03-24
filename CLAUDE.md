# Contexto del Proyecto

'Universomerchan' es un proyecto web e-commerce en desarrollo activo, con integración avanzada de catálogo y pedidos personalizados.

# Reglas de Seguridad Críticas

- **Atención:** Estás operando como usuario root.
- **NUNCA** ejecutes comandos destructivos como `rm -rf`.
- **NUNCA** borres, corrompas o elimines la base de datos de producción o pruebas.
- **SIEMPRE** haz un `git commit` y asegúrate de que el código está respaldado en repositorio antes de realizar refactorizaciones o cambios masivos en el código.

# Flujo de Trabajo y Ciclo de Vida del Código

1. **Investigación Obligatoria:** ANTES de hacer u opinar sobre cualquier cambio relacionado con flujos de web, componentes, productos, o pedidos, **debes consultar primero `navigation_map.md`**, luego la `Documentación API Midocean.md` y releer este `CLAUDE.md`.
2. **Propuesta y Ejecución:** Propón un plan. Una vez aprobado, **escríbelo y aplícalo tú mismo** en las carpetas locales de este ordenador.
3. **Registro Continuo:** Todo conocimiento nuevo adquirido sobre la arquitectura, Midocean o el proyecto **debe ser documentado inmediatamente en este `CLAUDE.md`**.
4. **Despliegue Total (End-to-End):** Tú eres responsable de desplegar completamente. Al finalizar una tarea debes:
   - Guardar los cambios localmente en el Mac.
   - Hacer `git add`, `git commit` y `git push` a Github.
   - Desplegar forzadamente en el servidor de producción (vía `ssh` usando herramientas como `expect` para proveer la contraseña o métodos equivalentes), ejecutando `git pull`, `npm run build` y `pm2 restart all`.
5. **Mantenimiento Estructural:** Siempre que se complete y termine un hilo o una tarea grande, **actualiza este archivo `CLAUDE.md`** y el archivo `navigation_map.md` de la raíz si se ha modificado la arquitectura o descubierto un nuevo conocimiento crítico.

# Estilo de Código

- Escribe siempre código **limpio, modular y escalable** estructurado para Next.js / React (TypeScript).
- Añade **comentarios claros** en las funciones complejas para mantener el código documentado (ej. lógicas de integración de API Midocean, cálculos de precios o visualizadores).

# Conocimiento Adquirido (Midocean Integration)

- **Costes de Setup (Tallas Múltiples):** Para productos textiles con impresión (PRINT), si el usuario solicita varias tallas del mismo color (ej. 10xS, 20xM), Midocean espera que se envíen **juntas en una sola `order_line`**, inyectando las tallas dentro de un array de `print_items`. Si se envían en `order_lines` separadas, Midocean cobrará el "Setup Cost" múltiples veces incurriendo en un sobrecoste erróneo.
- **Flujo de Carrito (Textiles):** La UI del configurador expone un *grid* de cantidades por talla (`sizeQuantities`), pero la memoria del carrito genera diferentes `CartItem` por talla. La unificación de tallas debe suceder mediante agrupación algorítmica justa antes de armar la request en `submitOrderToMidocean` dentro de `cart-checkout.ts`.
- **Líneas de Pedido y Pruebas (Proofs):** Cuando Midocean agrupa tallas, asigna un único `order_line_id`. Para asegurar que los webhooks de aprobación de proofs funcionen, usamos dinámicamente el `lineNumber` multiplicado por 10 del **primer registro** de base de datos que conforme ese grupo.
- **Precios Dinámicos por Volumen (Scales):** Originalmente, el script de sincronización `sync-prices` ignoraba el array `scale` de la API de *pricelist* de Midocean, grabando permanentemente el precio base más caro. Esto se ha corregido guardando fielmente cada escalón en `variant_prices.price_scales` y luego consolidándolo para el listado global en `product_prices`.
- **Espejismo de Midocean (Gastos de Envío):** Ocasionalmente parece que Midocean aplica un descuento unitario muy suculento a algunos artículos planos (ej. MO6580). Se ha documentado que esto es falso: el precio de la libreta sigue estático en su catálogo (sin descuento por volumen), pero el campo "Precio Promedio" de la web corporativa engaña porque recalcula diluyendo los 8,00€ de "Portes Web" cuando se piden cantidades que alcanzan envío gratuito. La plataforma *Universo Merchan* refleja el precio unitario lícito + el margen comercial establecido.
- **Áreas de Impresión Irregulares (Visualizador):** El array `points` devuelto por la API de Midocean (Print Data) para trazar las áreas de visualización (mockups) no siempre es un rectángulo "Top-Left" a "Bottom-Right". Productos como bolsos o paraguas (AGUMBE) incluyen polígonos irregulares (trapecios de +3 puntos). Como norma de diseño de UI en `ProductCanvasEditor`, las *Bounding Boxes* de Midocean deben ser calculadas iterando una extracción matemática global de minimos y maximos (`Math.min` y `Math.max` de todos los X y de todos los Y) sobre el array para evitar bugs de redibujito (logo fuera del lienzo o con 0 pixels de alto).
- **Falsificación de URLs S3 (Visualizador Dinámico):** Midocean no devuelve arrays dinámicos de colores para las fotos con Zoom (Zonas de marcaje). Para lograr que el editor de diseño cambie de color automáticamente al pulsar los botones, se embebió una lógica de Regex en el *frontend* (`ProductCanvasEditor.tsx` / `ProductConfigurator.tsx`) que intercepta la URL original *Base* (ej. `MO2925-66_POS4.jpg`), extrae el `masterCode` y sustituye dinámicamente el `colorCode` a la URL del CDN, forzando la imagen real de alta resolución. NOTA para Textiles: Se debe omitir (usando `.split('-')[0]`) cualquier sufijo de tallaje (ej. `-L`) incrustado erróneamente en el *SKU* para evitar recibir errores 404 del CDN.
- **Autonomía Total Dropshipping (Polling Midocean):** Tras enviar exitosamente un pedido y su gráfica vectorial vía API (`addArtwork`), la arquitectura depende ciegamente del servidor propio para rastrear el proceso (Midocean *nunca* dispara webhooks a nuestra tienda). Se descubrió que inicializar `node-cron` de forma nativa falla silenciosamente en el runtime de *app router*. Para garantizar la autonomía, los demonios de sincronización deben vivir físicamente enganchados al *crontab* del VPS en Linux (`*/15 * * * * npm run sync:orders`), sondeando cada 15m el estado del `GetOrderDetails` y despachando las actualizaciones de número de seguimiento o validación de bocetos vía e-mail al cliente.
- **PM2 Context Memory y E-mails Google Apps Script:** La API del Formulario de Contacto interactúa con un middleware externo en Google Apps Script (`email-service.ts -> fetch`). Al mutar variables de entorno en producción local (`.env`), PM2 suele cachear los pares Clave-Valor en memoria rígida (arrojando errores 500 porque inyecta strings antiguos u *overflows* entre variables). **Regla:** Tras alterar el `.env`, NUNCA hagas solo `pm2 restart`. Se debe matar el proceso forzosamente con `pm2 delete` y recrearlo `pm2 start` para purgar la caché viciada. Además, Google Apps Script rompe limpiamente los `utf-8` de iconos emoji renderizados estáticamente (`🎁`, `📩`) devolviendo interrogaciones de fallback, por tanto, todos los *Templates* de email transaccionales del servidor carecen deliberadamente de emojis visuales en el Backend para evitar distorsiones de bandeja de entrada de usuarios.
