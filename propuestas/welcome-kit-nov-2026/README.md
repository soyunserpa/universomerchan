# Propuesta Welcome Kit · evento anual (noviembre 2026)

Cliente: Euge / Silvia · 100 fundas de portátil 16/17" + 100 libretas A5, todo en negro.

Entregable: `Propuesta_WelcomeKit_UniversoMerchan.pptx` (11 diapositivas, look & feel de marca).

## Cómo se ha construido
- `build_propuesta.js` → genera el PPTX con pptxgenjs (`NODE_PATH=<ruta node_modules> node build_propuesta.js`).
  Las opciones de producto y los precios están en el array `OPTIONS`; los kits en `kits`.
- `mock.py` → renders ilustrativos de producto (HTML/CSS + Playwright). `imgs/` contiene las versiones redondeadas.
- `render_qa.py` → previsualización de cada diapositiva (`qa/slideN.png`) cuando LibreOffice no está disponible.

## Datos: qué está verificado y qué es orientativo
- Referencias de universomerchan.com (catálogo Midocean) verificadas por nombre y código:
  MO2191 COTIN (funda 15" algodón 220 g), MO1804 ARCONOT (A5 PU), MO2285 CINCO (A5 PU con bolsillo),
  MO6835 (A5 70 % cuero reciclado). El catálogo no tiene funda de 16/17": las opciones 16/17" van a medida (Grupo Xscape).
- **Precios orientativos.** La sesión no tenía acceso a universomerchan.com ni a la API de Midocean, así que los €/ud se
  han estimado con el modelo de la web (producto ×1,40 + marcaje ×1,50) sobre costes de referencia. Confirmar en la ficha
  de cada producto (tier 100 uds) y en el simulador de marcaje antes de enviar.
- Las opciones "Grupo Xscape" (funda 16/17" a medida y libreta a medida con hojas impresas) son propuestas de producto;
  no se ha podido consultar su catálogo desde la sesión. Sustituir por referencia y precio real del proveedor.

## Otros ficheros
- `Propuesta_WelcomeKit_UniversoMerchan_preview.pdf` → vista previa en PDF generada desde los renders HTML (LibreOffice no
  funciona en la sesión). Sirve para revisar o enviar por móvil; el fichero maestro sigue siendo el PPTX.
- `email_respuesta_Euge.md` → borrador del correo de respuesta al cliente.
