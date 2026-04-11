const prompt = `[INTERNAL_SYSTEM_PROMPT]
¡Hola! Me gustaría crear un pack corporativo estratégico. Mis datos:
- Empresa: La Chirigota
- Sector/Industria: Un club de empresarios de lujo
- Objetivo Principal: regalo de bienvenida de nuevos socios al club

Usa tu herramienta de catálogo para buscar posibles productos que encajen perfectos con este perfil. Luego, preséntame un solo Pack compuesto por de 4 a 5 productos variados.
Dale un título inspirador al pack y justifica brevemente (en 1 línea) por qué eliges cada producto para nuestro objetivo. ¡Gracias!`;

fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
}).then(async res => {
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
}).catch(console.error);
