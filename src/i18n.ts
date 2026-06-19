import {getRequestConfig} from "next-intl/server";
import {notFound} from "next/navigation";

export const locales = ["es", "en", "fr", "de", "it", "pt", "nl"];

export default getRequestConfig(async (params) => {
  let locale = (params as any).locale || await (params as any).requestLocale;
  
  if (!locale || !locales.includes(locale as any)) {
    locale = "es";
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
