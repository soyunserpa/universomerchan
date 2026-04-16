// ============================================================
// CÓDIGO FUENTE REAL ALOJADO Y EJECUTADO DESDE GOOGLE APPS SCRIPT
// Este código NO se ejecuta en NextJS. Es externo.
// Las inteligencias artificiales deben leer esto para entender el origen de los webhooks de Universo Merchan.
// ============================================================

function enviarFlyerWhatsApp() {
  var destinatarios = "jose@universomerchan.com, alejandro@universomerchan.com";
  
  // 1. Decirle al robot que genere la IMAGEN (.png / .jpg) del Flyer de hoy
  Logger.log("Generando Flyer Fotográfico en Universo Merchan...");
  var urlImagen = "https://universomerchan.com/api/webhooks/flyer-image";
  
  try {
    // Pedimos al servidor que DIBUJE la imagen y nos la traemos como un Archivo Real
    var response = UrlFetchApp.fetch(urlImagen, { muteHttpExceptions: false });
    var imageBlob = response.getBlob().setName("Flyer_Semanal.jpg");

    // 2. Enviar el correo simple con un texto base y LA FOTO adjunta para descargar y subir
    Logger.log("Enviando foto al correo...");
    GmailApp.sendEmail(destinatarios, " Vuestro Flyer de la Semana listo", 
      "¡Hola Jose, Marina y Alejandro!\n\nAdjunto en este correo tenéis la imagen/flyer listo para descargar en vuestra galería y subir a WhatsApp o Instagram.\n\nAtte: Robot de Ventas.", {
      name: "Universo Merchan",
      attachments: [imageBlob] // <--- Aquí va enganchada la imagen
    });
    Logger.log("Misión fotográfica cumplida.");

  } catch(e) {
    Logger.log("Sigue compilando o hubo un error: " + e.message);
  }
}

function publicarBlogSEO() {
  // 1. Claves 
  var openAiKey = "sk-proj-[REDACTED]"; 
  var webhookUrl = "https://universomerchan.com/api/webhooks/n8n-blog";
  var webhookToken = "whsec_UMblog_9XqP2rL4vA3c8B3V"; 

  // 2. Selección de categoría para que sea dinámico cada día
  var categorias = [
    "Regalos Corporativos para empresas",
    "Merchandising Sostenible y Ecológico",
    "Welcome Packs para nuevos empleados",
    "Merchandising para eventos en España",
    "Tendencias en regalos B2B 2026",
    "Kits de fidelización de clientes"
  ];
  var categoria = categorias[Math.floor(Math.random() * categorias.length)];
  
  // 3. Prompt de OpenAI (¡Actualizado con Directrices SEO Élite!)
  var openAiUrl = "https://api.openai.com/v1/chat/completions";
  var systemPrompt = "Eres un redactor B2B especializado en regalos de empresa para España. Usa palabras clave long-tail en negrita sobre regalos corporativos. Incluye obligatoriamente 1 o 2 enlaces HTML (con la etiqueta <a href=\"https://universomerchan.com/catalog\">) en el cuerpo apuntando al catálogo con un anchor text natural. Devuelve la salida SIEMPRE en formato JSON puro. El JSON debe contener EXACTAMENTE: 'title' (titular persuasivo, clickbait y SEO), 'excerpt' (resumen de 2 líneas), 'body' (contenido formateado en HTML limpio usando h2, p, ul, li, a y strong, alrededor de 600 palabras), 'metaTitle' (max 60 chars), 'metaDescription' (max 155 chars) y un campo EXTRA llamado 'imagePrompt' (un prompt ultra detallado EN INGLÉS para que DALL-E 3 genere una foto de portada perfecta y fotorrealista sobre este tema, estilo lifestyle corporativo moderno, prohibido añadir textos o palabras escritas en la imagen).";
  var userPrompt = "Escribe un artículo persuasivo y SEO para el blog enfocado a vender sobre la categoría: " + categoria;
  
  var payloadOpenAI = {
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": systemPrompt},
      {"role": "user", "content": userPrompt}
    ],
    "response_format": { "type": "json_object" }
  };
  
  var optionsOpenAI = {
    "method": "post",
    "contentType": "application/json",
    "headers": {
      "Authorization": "Bearer " + openAiKey
    },
    "payload": JSON.stringify(payloadOpenAI),
    "muteHttpExceptions": true
  };
  
  Logger.log("Pidiendo artículo a GPT-4o...");
  var response = UrlFetchApp.fetch(openAiUrl, optionsOpenAI);
  var jsonResponse = JSON.parse(response.getContentText());
  
  if (jsonResponse.error) {
    Logger.log("Error OpenAI (Texto): " + jsonResponse.error.message);
    return;
  }
  
  var articulo = JSON.parse(jsonResponse.choices[0].message.content);
  Logger.log("Artículo generado con título: " + articulo.title);

  // 4. Pedir foto a DALL-E 3 usando el prompt inteligente generado en el paso 3
  Logger.log("Pidiendo imagen a DALL-E 3 usando el prompt: " + articulo.imagePrompt);
  var dallEPayload = {
    "model": "dall-e-3",
    "prompt": articulo.imagePrompt,
    "n": 1,
    "size": "1024x1024",
    "quality": "standard"
  };

  var optionsDallE = {
    "method": "post",
    "contentType": "application/json",
    "headers": {
      "Authorization": "Bearer " + openAiKey
    },
    "payload": JSON.stringify(dallEPayload),
    "muteHttpExceptions": true
  };

  var responseDallE = UrlFetchApp.fetch("https://api.openai.com/v1/images/generations", optionsDallE);
  var jsonDallEResponse = JSON.parse(responseDallE.getContentText());

  var imageUrl = "";
  if (jsonDallEResponse.data && jsonDallEResponse.data[0]) {
    imageUrl = jsonDallEResponse.data[0].url;
    Logger.log("¡Imagen generada con éxito por DALL-E!");
  } else {
    Logger.log("Error OpenAI (Imagen): Falló al crear imagen. Usando backup.");
    // Fallback de seguridad en caso extremo de que DALL-E falle
    imageUrl = "https://images.unsplash.com/photo-1556761175-4b46a572b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80";
  }
  
  // 5. Inyección a Universo Merchan a través del Webhook
  Logger.log("Inyectando en Universo Merchan...");
  var payloadWebhook = {
    "title": articulo.title,
    "excerpt": articulo.excerpt,
    "body": articulo.body,
    "metaTitle": articulo.metaTitle || articulo.title,
    "metaDescription": articulo.metaDescription,
    "featuredImageUrl": imageUrl, // El enlace fresquito de DALL-E 3
    "authorName": "Universo Merchan AI"
  };
  
  var optionsWebhook = {
    "method": "post",
    "contentType": "application/json",
    "headers": {
      "Authorization": "Bearer " + webhookToken
    },
    "payload": JSON.stringify(payloadWebhook),
    "muteHttpExceptions": true
  };
  
  var res = UrlFetchApp.fetch(webhookUrl, optionsWebhook);
  Logger.log("Resultado del Webhook: " + res.getContentText());
}
