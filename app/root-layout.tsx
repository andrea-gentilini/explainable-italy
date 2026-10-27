import "./globals.css";

const cloudflareAnalyticsToken =
  process.env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN?.trim() ?? "";

const themeInitScript = `try{var t=localStorage.getItem("explainable-italy-theme");document.documentElement.dataset.theme=t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light"}catch(e){}`;

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
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
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
