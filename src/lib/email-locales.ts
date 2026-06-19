import fs from "fs";
import path from "path";

const cache: Record<string, any> = {};

export function getEmailDict(locale: string) {
  if (locale === "es") return null; // Default hardcoded in email-service
  
  if (cache[locale]) return cache[locale];
  
  try {
    const filePath = path.join(process.cwd(), `src/messages/${locale}.json`);
    const file = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(file);
    cache[locale] = json.emails || {};
    return cache[locale];
  } catch (e) {
    console.warn(`[Email] No translations found for locale: ${locale}`);
    return null;
  }
}

export function translateEmail(locale: string, key: string, fallback: string, variables?: Record<string, string>): string {
  let text = fallback;
  const dict = getEmailDict(locale);
  
  if (dict && dict[key]) {
    text = dict[key];
  }
  
  if (variables) {
    for (const [k, v] of Object.entries(variables)) {
      text = text.replace(new RegExp(`{${k}}`, "g"), v);
    }
  }
  
  return text;
}
