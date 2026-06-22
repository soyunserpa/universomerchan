import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: 'es',
  localePrefix: 'as-needed', // Only adds /en, /fr, etc. Keeps / for default 'es'

  // NO redirigir automáticamente por idioma del navegador ni por cookie:
  // "/" abre SIEMPRE en español (defaultLocale). El visitante cambia de idioma
  // con el selector de banderas (que navega a /en, /fr, ... explícitamente).
  // Evita que una cookie NEXT_LOCALE deje al usuario "atrapado" en otro idioma.
  localeDetection: false
});

export const config = {
  // Match only internationalized pathnames
  // Do NOT match API routes, _next/static, _next/image, favicon.ico, images, etc.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
