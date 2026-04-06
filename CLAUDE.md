# Prompt SEO para el Blog Automático (Google Apps Script)

Si en algún momento generas contenido mediante Inteligencia Artificial desde tu script de Google, asegúrate de que el modelo reciba exactamente las siguientes directrices en su instrucción principal (`prompt`). Esto asegurará que el contenido esté optimizado para SEO, utilice términos clave del sector de regalos corporativos y fomente el enlazado interno.

---

### Código del Prompt

Copia y pega este texto dentro de tu configuración de OpenAI o generador en Apps Script:

```javascript
"Escribe un artículo B2B persuasivo para el blog de 'Universo Merchan'. Usa palabras clave long-tail en negrita sobre regalos corporativos. Incluye obligatoriamente 1 o 2 enlaces HTML (con la etiqueta <a href=\"https://universomerchan.com/catalog\">) en el cuerpo apuntando al catálogo con un anchor text natural. Genera un objeto JSON EXACTAMENTE con estas claves: 'title' (titular clickbait y SEO), 'excerpt' (resumen de 2 líneas), 'body' (contenido formateado en HTML limpio usando h2, p, ul, li, a y strong, alrededor de 600 palabras), 'metaTitle' (max 60 chars), 'metaDescription' (max 155 chars), y 'featuredImageUrl' (usa un string aleatorio de foto corporativa usando 'https://source.unsplash.com/1200x800/?business,marketing,merchandise,office')."
```

---

### ¿Qué consigue este prompt específico?
1. **Long-tails en negrita**: Ayuda a que el algoritmo de búsqueda de Google entienda rápidamente cuál es la temática secundaria y específica del artículo.
2. **Enlazado Interno Obligatorio (`<a href="...">`)**: Fuerzas a la IA a que mande "flujo de autoridad" (link juice) desde el blog directamente a la página de compra o catálogo.
3. **Estructura HTML Limpia**: Los artículos saldrán listos para ser renderizados y perfectamente indentados para Next.js.
