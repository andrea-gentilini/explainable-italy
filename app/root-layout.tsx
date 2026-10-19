import "./globals.css";
import "./redesign.css";

const cloudflareAnalyticsToken =
  process.env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN?.trim() ?? "";

export function RootDocument({
  lang,
  children,
}: Readonly<{
  lang: "it" | "en";
  children: React.ReactNode;
}>) {
  return (
    <html lang={lang} suppressHydrationWarning>
      <body>
        {children}
        {cloudflareAnalyticsToken ? (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: cloudflareAnalyticsToken })}
          />
        ) : null}
      </body>
    </html>
  );
}
