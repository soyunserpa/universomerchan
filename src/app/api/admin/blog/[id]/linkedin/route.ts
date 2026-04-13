import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { blogPosts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-service";
import { OpenAI } from "openai";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("authorization");
    const auth = await requireAuth(authHeader, "admin");
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const post = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id)
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (!post.isPublished) {
         return NextResponse.json({ error: "Cannot publish drafts. Publish the article first." }, { status: 400 });
    }

    const token = process.env.LINKEDIN_ACCESS_TOKEN;
    if (!token) {
        return NextResponse.json({ error: "LinkedIn Token is missing from .env" }, { status: 400 });
    }

    // 1. Convert text to engaging linkedin content via GPT-4o mini
    let shareText = `¡Nuevo artículo en el blog! ${post.title}\n\nLee más aquí:`;
    if (process.env.OPENAI_API_KEY) {
        try {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const chatRes = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", "content": "Escribe un micropost viral para LinkedIn de máximo 300 caracteres basado en el artículo propuesto. Usa 2-3 emojis y un hashtag B2B. No des salu2 ni confirmaciones y termina invitando a leer el enlace." },
                    { role: "user", "content": `Título: ${post.title}\nExtracto: ${post.excerpt || post.metaDescription}` }
                ]
            });
            if (chatRes.choices[0].message.content) {
                shareText = chatRes.choices[0].message.content;
            }
        } catch (e) {
            console.error("OpenAI failed to summarize for LinkedIn", e);
        }
    }

    // 2. Identify Author
    let authorUrn = "";
    if (process.env.LINKEDIN_ORGANIZATION_ID) {
        authorUrn = `urn:li:organization:${process.env.LINKEDIN_ORGANIZATION_ID}`;
    } else {
        const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const meData = await meRes.json();
        if (meData.sub) authorUrn = `urn:li:person:${meData.sub}`;
    }

    if (!authorUrn) {
        return NextResponse.json({ error: "Could not resolve LinkedIn URN (Token invalid or missing Org ID)" }, { status: 400 });
    }

    // 3. Post to LinkedIn
    const absoluteUrl = `https://universomerchan.com/blog/${post.slug}`;
    
    // Replace [enlace] if AI generated it explicitly, or just append it at the end.
    let finalShareText = shareText;
    if (/\[enlace\]/gi.test(finalShareText)) {
      finalShareText = finalShareText.replace(/\[enlace\]/gi, absoluteUrl);
    } else {
      finalShareText = `${finalShareText} \n\n🔗 ${absoluteUrl}`;
    }

    const linkedinPayload = {
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: finalShareText },
            shareMediaCategory: "ARTICLE",
            media: [
              {
                status: "READY",
                description: { text: post.metaDescription || post.excerpt || post.title },
                originalUrl: absoluteUrl,
                title: { text: post.title },
                thumbnails: post.featuredImageUrl ? [
                  { url: post.featuredImageUrl.startsWith('http') ? post.featuredImageUrl : `https://universomerchan.com${post.featuredImageUrl}` }
                ] : []
              }
            ]
          }
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    };

    const linkedinRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(linkedinPayload)
    });

    if (!linkedinRes.ok) {
        const errorText = await linkedinRes.text();
        return NextResponse.json({ error: `LinkedIn API Error: ${linkedinRes.status}`, details: errorText }, { status: 500 });
    }

    const data = await linkedinRes.json();
    
    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
