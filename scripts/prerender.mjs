/**
 * Prerenders every indexable marketing route into dist/<route>/index.html.
 *
 * The client bundle then hydrates the existing markup, so the first paint is
 * complete HTML with the correct title, description, canonical and Open Graph
 * tags. /demo/* keeps a pristine shell (dist/_spa.html) because it is a
 * client-rendered app behind authentication.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(process.cwd());
const DIST = path.join(ROOT, "dist");
const SSR_ENTRY = path.join(ROOT, ".ssr", "entry-server.js");

if (!fs.existsSync(DIST)) throw new Error("dist/ is missing. Run `vite build` first.");
if (!fs.existsSync(SSR_ENTRY)) throw new Error(".ssr/entry-server.js is missing. Run the SSR build first.");

const template = fs.readFileSync(path.join(DIST, "index.html"), "utf8");

const SEO_START = "<!--SEO_START-->";
const SEO_END = "<!--SEO_END-->";

function seoBlock(meta) {
  const url = `https://gtmsaas.sajidafridi.com${meta.path === "/" ? "/" : meta.path}`;
  const robots = meta.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large";
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  return [
    SEO_START,
    `    <title>${esc(meta.title)}</title>`,
    `    <meta name="description" content="${esc(meta.description)}" />`,
    `    <meta name="robots" content="${robots}" />`,
    `    <link rel="canonical" href="${url}" />`,
    `    <meta property="og:type" content="website" />`,
    `    <meta property="og:site_name" content="RevFlow" />`,
    `    <meta property="og:title" content="${esc(meta.title)}" />`,
    `    <meta property="og:description" content="${esc(meta.description)}" />`,
    `    <meta property="og:url" content="${url}" />`,
    `    <meta property="og:locale" content="en" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:site" content="@mr305afridi" />`,
    `    <meta name="twitter:title" content="${esc(meta.title)}" />`,
    `    <meta name="twitter:description" content="${esc(meta.description)}" />`,
    SEO_END,
  ].join("\n    ");
}

function injectSeo(html, meta) {
  const start = html.indexOf(SEO_START);
  const end = html.indexOf(SEO_END);
  if (start === -1 || end === -1) throw new Error("SEO markers are missing from index.html");
  return html.slice(0, start) + seoBlock(meta) + html.slice(end + SEO_END.length);
}

function injectApp(html, appHtml) {
  if (!html.includes('<div id="root"></div>')) throw new Error('Could not find <div id="root"></div>');
  return html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
}

function write(routePath, html) {
  if (routePath === "/") {
    fs.writeFileSync(path.join(DIST, "index.html"), html);
    return;
  }
  const dir = path.join(DIST, routePath.replace(/^\/+/, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

const ssr = await import(pathToFileURL(SSR_ENTRY).href);
const ROUTES = ssr.ROUTES;

if (!Array.isArray(ROUTES) || !ROUTES.length) throw new Error("ROUTES export is missing from the SSR bundle");

const prerendered = [];
for (const meta of ROUTES) {
  if (meta.spa || meta.noindex) continue;
  const appHtml = ssr.render(meta.path);
  write(meta.path, injectApp(injectSeo(template, meta), appHtml));
  prerendered.push(meta.path);
}

// 404 page: prerendered markup, but never indexed.
const notFoundMeta = {
  path: "/404",
  title: "Page not found | RevFlow",
  description: "The page you are looking for does not exist.",
  noindex: true,
};
fs.writeFileSync(
  path.join(DIST, "404.html"),
  injectApp(injectSeo(template, notFoundMeta), ssr.render("/404"))
);

// Pristine shell for /demo/* — empty root so React mounts instead of hydrating.
const demoMeta = ROUTES.find((r) => r.path === "/demo") || {
  path: "/demo",
  title: "Live Demo — JW Corporation × Enviro Pakistan | RevFlow",
  description:
    "Switch four personas and run warranty dispatch, dealer credit checks, cross-vertical bundling and ERP sync against seeded Pakistani data.",
};
fs.writeFileSync(path.join(DIST, "_spa.html"), injectSeo(template, demoMeta));

// sitemap.xml
const today = new Date().toISOString().slice(0, 10);
const urls = ROUTES.filter((r) => !r.noindex)
  .map((r) => {
    const loc = `https://gtmsaas.sajidafridi.com${r.path === "/" ? "/" : r.path}`;
    return [
      "  <url>",
      `    <loc>${loc}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${r.changefreq}</changefreq>`,
      `    <priority>${r.priority.toFixed(1)}</priority>`,
      "  </url>",
    ].join("\n");
  })
  .join("\n");

fs.writeFileSync(
  path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
);

// robots.txt
fs.writeFileSync(
  path.join(DIST, "robots.txt"),
  [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /demo/app",
    "Disallow: /demo/login",
    "Disallow: /demo/signup",
    "Disallow: /demo/verify",
    "Disallow: /demo/onboarding",
    "",
    "Sitemap: https://gtmsaas.sajidafridi.com/sitemap.xml",
    "",
  ].join("\n")
);

console.log(`[prerender] ${prerendered.length} routes → static HTML`);
console.log(`[prerender] wrote 404.html, _spa.html, sitemap.xml, robots.txt`);
