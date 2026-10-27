"use client";

import Link from "next/link";
import { useState, type AnchorHTMLAttributes } from "react";
import { basePath, notifyQueryChange } from "./dashboard-utils";

/** Client-side internal route link that normalizes basePath for Next.js Link. */
export function AppLink({
  href = "/",
  onClick,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const internalHref =
    basePath && href.startsWith(basePath)
      ? href.slice(basePath.length) || "/"
      : href;
  return (
    <Link
      href={internalHref}
      prefetch={false}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          window.setTimeout(notifyQueryChange, 0);
        }
      }}
      {...props}
    >
      {children}
    </Link>
  );
}

/** Copy the current view, including topic, search and selected year. */
export function ShareLink({ locale }: { locale: "it" | "en" }) {
  const [result, setResult] = useState<{ copied: boolean; url: string } | null>(null);
  const labels = locale === "it"
    ? { action: "Copia link", copied: "Link copiato", manual: "Seleziona e copia questo indirizzo.", field: "Link alla vista corrente" }
    : { action: "Copy link", copied: "Link copied", manual: "Select and copy this address.", field: "Link to the current view" };

  async function copy() {
    const url = window.location.href;
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      setResult({ copied: true, url });
    } catch {
      setResult({ copied: false, url });
    }
  }

  return (
    <div className="share-link">
      <button type="button" onClick={copy}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7 .1l3-3a5 5 0 0 0-7-7l-1.8 1.8M14 11a5 5 0 0 0-7-.1l-3 3a5 5 0 0 0 7 7l1.8-1.8" />
        </svg>
        {result?.copied ? labels.copied : labels.action}
      </button>
      <span role="status" className={result?.copied ? "visually-hidden" : "share-status"}>
        {result ? result.copied ? labels.copied : labels.manual : ""}
      </span>
      {result && !result.copied ? (
        <input aria-label={labels.field} readOnly value={result.url} onFocus={(event) => event.currentTarget.select()} />
      ) : null}
    </div>
  );
}
