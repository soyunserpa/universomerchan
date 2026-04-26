const fs = require('fs');

(async () => {
  try {
    console.log("Simulating Frontend Logo Upload...");
    
    const logoRes = await fetch("https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png", {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    
    if (!logoRes.ok) throw new Error("Failed to download image");
        
    const buffer = await logoRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    const dataUrl = `data:image/png;base64,${base64}`;

    console.log("Uploading logo to Universo Merchan server...");
    const uploadReq = await fetch("https://universomerchan.com/api/uploads/artwork", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataUrl,
        fileName: "google-logo-test.png",
        instructions: "Logo for testing"
      })
    });
    
    const uploadData = await uploadReq.json();
    if (!uploadData.url) {
      console.error("Upload failed", uploadData);
      return;
    }
    console.log("Uploaded! URL:", uploadData.url);

    console.log("Generating B2B Prospect Email...");
    const genRes = await fetch("https://universomerchan.com/api/admin/prospects/generate", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        companyName: "Google Cloud",
        industry: "Tecnología en la nube y software",
        notes: "Diles que como la tecnología nos acompaña a todos lados, queremos ofrecerles botellas de agua o camisetas de altisima calidad.",
        logoUrl: uploadData.url
      })
    });
    
    if (!genRes.ok) {
        console.error("HTTP Gen failed:", genRes.status, await genRes.text());
        return;
    }
    const genData = await genRes.json();
    if (!genData.success) {
      console.error("Gen failed:", genData);
      return;
    }
    console.log("Generated draft!", genData.emailDraft.subject);
    
    console.log("Sending to Marina...");
    const sendRes = await fetch("https://universomerchan.com/api/admin/prospects/send", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        targetEmail: "marinaberenguervilaverde@gmail.com",
        subject: genData.emailDraft.subject + " [ULTIMO TEST SIN EMOJIS!]",
        htmlBody: genData.emailDraft.htmlBody
      })
    });
    
    const sendData = await sendRes.json();
    console.log("Send status:", sendData);
  } catch (e) {
    console.error(e);
  }
})();
