// Sitemap generator for YOLUMI multi-locale website
// Queries Supabase for all active brands, series, models across 8 locales
// Generates sitemap-index.xml + per-locale sitemap-{locale}.xml with hreflang annotations
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = "https://yolumi.com";
const LOCALES = ["en", "zh-CN", "ar", "ru", "th", "ur", "tr", "pt-BR"];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function resolveTable(base, locale) {
  if (locale === "zh-CN") return base;
  const loc = locale.toLowerCase().replace("-", "_");
  if (base === "models_jumdata") return `${base}_${loc}`;
  return `${base}_${loc}`;
}

async function collectUrls(locale) {
  const urls = [];
  const base = `/${locale}`;

  // Home page
  urls.push({ path: base, priority: 1.0, changefreq: "daily", lastmod: null });

  // Brands page
  urls.push({ path: `${base}/brands`, priority: 0.9, changefreq: "daily", lastmod: null });

  try {
    // Get all active brands
    const { data: brands } = await supabase
      .from(resolveTable("brands", locale))
      .select("id, updated_at")
      .eq("activity_status", 0);

    // Get all active series
    const { data: series } = await supabase
      .from(resolveTable("series", locale))
      .select("id, updated_at")
      .or("activity_status.is.null,activity_status.eq.0");

    for (const s of (series || [])) {
      urls.push({
        path: `${base}/series/${s.id}`,
        priority: 0.8,
        changefreq: "daily",
        lastmod: s.updated_at || null,
      });
    }

    // Get all models with slugs (from legacy models table)
    const { data: models } = await supabase
      .from("models")
      .select("slug, updated_at")
      .eq("is_active", true)
      .in("activity_status", [0]);

    for (const m of (models || [])) {
      if (m.slug) {
        urls.push({
          path: `${base}/models/${m.slug}`,
          priority: 0.7,
          changefreq: "daily",
          lastmod: m.updated_at || null,
        });
      }
    }
  } catch (err) {
    console.error(`Error fetching URLs for locale ${locale}:`, err.message);
  }

  return urls;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function main() {
  const targetDir = join(__dirname, "..", "public");
  try { mkdirSync(targetDir, { recursive: true }); } catch {}

  const sitemaps = [];

  for (const locale of LOCALES) {
    console.log(`Collecting URLs for ${locale}...`);
    const urls = await collectUrls(locale);
    console.log(`  Found ${urls.length} URLs`);

    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
      '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ];

    for (const u of urls) {
      lines.push("  <url>");
      lines.push(`    <loc>${escapeXml(BASE_URL + u.path)}</loc>`);

      // hreflang alternates for this URL
      const pathWithoutLocale = u.path.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, "") || "/";
      for (const altLocale of LOCALES) {
        lines.push(`    <xhtml:link rel="alternate" hreflang="${escapeXml(altLocale.toLowerCase())}" href="${escapeXml(`${BASE_URL}/${altLocale}${pathWithoutLocale}`)}" />`);
      }
      lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${BASE_URL}/en${pathWithoutLocale}`)}" />`);

      if (u.lastmod) {
        const d = new Date(u.lastmod).toISOString().split("T")[0];
        lines.push(`    <lastmod>${d}</lastmod>`);
      }
      lines.push(`    <changefreq>${u.changefreq}</changefreq>`);
      lines.push(`    <priority>${u.priority}</priority>`);
      lines.push("  </url>");
    }

    lines.push("</urlset>");

    const filename = `sitemap-${locale}.xml`;
    writeFileSync(join(targetDir, filename), lines.join("\n"), "utf-8");
    sitemaps.push({ locale, filename, urlCount: urls.length });
  }

  // Generate sitemap index
  const indexLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const sm of sitemaps) {
    indexLines.push(`  <sitemap><loc>${escapeXml(`${BASE_URL}/${sm.filename}`)}</loc></sitemap>`);
  }
  indexLines.push("</sitemapindex>");
  writeFileSync(join(targetDir, "sitemap-index.xml"), indexLines.join("\n"), "utf-8");

  const totalUrls = sitemaps.reduce((sum, s) => sum + s.urlCount, 0);
  console.log(`\nGenerated sitemap-index.xml and ${sitemaps.length} locale sitemaps.`);
  console.log(`Total URLs across all locales: ${totalUrls}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
