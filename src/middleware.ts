import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales,
  
  // Used when no locale matches
  defaultLocale: 'es',
  localePrefix: 'as-needed' // Only adds /en, /fr, etc. Keeps / for default 'es'
});

export const config = {
  // Match only internationalized pathnames
  // Do NOT match API routes, _next/static, _next/image, favicon.ico, images, etc.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
