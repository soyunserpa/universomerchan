# ARQUITECTURA CRÍTICA DEL VISUALIZADOR DE LOGOTIPOS
*(Lee este documento y respeta estas reglas DE POR VIDA antes de modificar `ProductCanvasEditor.tsx`)*

El Martes 24 de Marzo de 2026, tras una serie de modificaciones fallidas que rompían las coordenadas en productos textiles (Sudaderas) y un fallo catastrófico de renderizado invisible (Cargador ACAWAI), se llegó a la resolución estructural perfecta de cómo funciona geométricamente el visualizador de Universo Merchan.

**ESTAS 3 REGLAS SON LEY. CUALQUIER AGENTE DE IA O PROGRAMADOR QUE LAS VULNERE ROMPERÁ LOS PRESUPUESTOS EN PRODUCCIÓN.**

---

### 1. REGLA DEL PARSEO DE POSTGRES (JSON.parse GUARD)
*El problema del "Logo Invisible" en el panel derecho.*

A las 11:30 AM del 24/03/2026, se ejecutó un script `sync-print.ts` en el servidor VPS que inyectó masivamente los arrays de coordenadas oficiales de Midocean (`distance_from_left`, `distance_from_top`) directamente en la tabla `print_positions` de la base de datos PostgreSQL.
Este script introdujo los datos codificados por partida doble como **Strings (Cadenas de texto)** en lugar de objetos JSON nativos.

**CONSECUENCIA SI SE ROMPE ESTA REGLA:** 
Si el motor JSX iterador (`...activeZoneData.points.map`) recibe un String, lo rompe en caracteres individuales (ej: `"{"`), haciendo que `Math.min()` devuelva `NaN`. Al ocurrir esto, las coordenadas CSS `$left` mandan el logo de la imagen al infinito y desaparece sin rastro aparente en React.

**LA LEY:**
Toda variable de puntos entrante, ya sea en `PreviewWithLogo` o en `exportMockup`, **TIENE QUE ESTAR RODEADA OBLIGATORIAMENTE POR UN TRY-CATCH DE JSON.PARSE()**:
```tsx
let parsedPoints = zone.points;
if (typeof parsedPoints === "string") {
  try { parsedPoints = JSON.parse(parsedPoints); } catch(e) { parsedPoints = []; }
}
if (!Array.isArray(parsedPoints)) parsedPoints = [];
```

---

### 2. REGLA DE LA ESTRUCTURA DEL DOM (PROHIBIDO EL `overflow: hidden`)
*El problema de las "Sudaderas Descentradas".*

Para evitar que los logos muy grandes se salieran visualmente por fuera de las camisetas en el panel derecho, se introdujo un `<div style={{ overflow: "hidden" }}>` que envolvía a la etiqueta `<img />` del logo de usuario.
Esto fue un error catastrófico. Al meter la `<img />` en un contenedor ajeno, el atributo vital de CSS `object-fit: contain` dejó de tener como referencia el cajón dinámico de porcentajes del propio print, aplastando o estirando la caja invisible en productos no-cuadrados (ej: Sudaderas con ratios rectangulares) y engañando visualmente al usuario.

**LA LEY:**
El logo en `PreviewWithLogo` y en `exportMockup` TIENE QUE SER UNA ETIQUETA `<img />` ABSOLUTAMENTE DESNUDA.
La imagen cruda recibirá directamente sus márgenes en porcentajes combinando `zoneLeft`, `zoneWidth` y la función del escalado interactivo `currentLogoPos`.
**JAMÁS la envuelvas en un DIV contenedor artificial**. El `object-fit: contain` se encargará estúpidamente él solo de squishear o ensanchar la foto proporcionalmente respecto al cajón matemático base de Midocean si le dejas trabajar al aire libre.

---

### 3. REGLA DE LAS IMÁGENES NATURALES (`imgNatural / natW / natH`)
*El problema de "Dividir entre 1200".*

Midocean usa plantillas madre de 1200x1200px para el 90% de su catálogo rígido. Sin embargo, para fotos de modelos humanos vistiendo sudaderas/camisetas, la resolución de su CDN viene cropeada (cortada) irregularmente (ej: 651x1000px).
Los servidores proxy de Amazon S3 en Europa a veces cortan de forma violenta estas imágenes. 

**LA LEY:**
El divisor matemático en los ejes X e Y para calcular el porcentaje de colocación (`zoneWidth`, `zoneLeft`, etc.) **JAMÁS DEBE SER FIJADO FÍSICAMENTE COMO "1200" EN EL CÓDIGO JSX**. 
El código **siempre** debe esperar a que la etiqueta temporal base-64 (`loadImage`) emita el evento React on-load para capturar el valor literal in-browser del `img.naturalWidth` y `img.naturalHeight` de esa foto individual, por muy ridícula que sea la resolución. Usar `1200` causará que las camisetas expulsen los logos al borde exterior de la pantalla por exceder erróneamente el 190%.
