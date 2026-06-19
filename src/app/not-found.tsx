import { redirect } from "@/i18n/routing";;

export default function NotFound() {
  return (
    <html>
      <body>
        <meta httpEquiv="refresh" content="0; url=/es/404" />
      </body>
    </html>
  );
}
