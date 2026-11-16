import { useEffect } from "react";
import { SITE, absoluteUrl, routeMeta } from "./routes";

type Crumb = { name: string; path: string };

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/** Keeps <head> in sync during client-side navigation. Prerendering handles first paint. */
export function applyHead(path: string) {
  const meta = routeMeta(path);
  const url = absoluteUrl(path);
  document.title = meta.title;
  setMeta("name", "description", meta.description);
  setMeta("name", "robots", meta.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");
  setMeta("property", "og:title", meta.title);
  setMeta("property", "og:description", meta.description);
  setMeta("property", "og:url", url);
  setMeta("property", "og:type", "website");
  setMeta("property", "og:site_name", SITE.name);
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", meta.title);
  setMeta("name", "twitter:description", meta.description);
  setLink("canonical", url);
}

export function Seo({
  path,
  crumbs = [],
  extra = [],
}: {
  path: string;
  crumbs?: Crumb[];
  extra?: Record<string, unknown>[];
}) {
  const meta = routeMeta(path);
  const url = absoluteUrl(path);

  useEffect(() => {
    applyHead(path);
  }, [path]);

  const trail = [{ name: "Home", path: "/" }, ...crumbs.filter((c) => c.path !== "/")];

  const graph = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: meta.title,
      description: meta.description,
      inLanguage: SITE.locale,
      isPartOf: { "@id": `${SITE.url}/#website` },
      about: { "@id": `${SITE.url}/#organization` },
      author: { "@id": `${SITE.url}/#creator` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: trail.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: absoluteUrl(c.path),
      })),
    },
    ...extra,
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
