import { Helmet } from "react-helmet-async";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/locales";

export interface SeoHeadProps {
  locale: Locale;
  title: string;
  description: string;
  canonicalPath: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
  noIndex?: boolean;
}

const BASE_URL = "https://yolumi.com";

const LOCALE_TO_OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  "zh-CN": "zh_CN",
  ar: "ar_SA",
  ru: "ru_RU",
  th: "th_TH",
  ur: "ur_PK",
  tr: "tr_TR",
  "pt-BR": "pt_BR",
};

export default function SeoHead({
  locale,
  title,
  description,
  canonicalPath,
  ogImage,
  ogType = "website",
  structuredData,
  noIndex,
}: SeoHeadProps) {
  const canonicalUrl = `${BASE_URL}${canonicalPath}`;
  const ogLocale = LOCALE_TO_OG_LOCALE[locale] || "en_US";
  const defaultImage = `${BASE_URL}/favicon.png`;

  // Rebuild the path without locale prefix for hreflang alternates
  // e.g. /en/brands -> /brands, /en/series/123 -> /series/123
  const pathWithoutLocale =
    canonicalPath.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, "") || "/";

  return (
    <Helmet>
      {/* Title */}
      <title>{title}</title>

      {/* Meta description */}
      <meta name="description" content={description} />

      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:site_name" content="YOLUMI" />
      {ogImage ? (
        <meta property="og:image" content={ogImage} />
      ) : (
        <meta property="og:image" content={defaultImage} />
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* hreflang alternates for all supported locales */}
      {SUPPORTED_LOCALES.map((altLocale) => (
        <link
          key={altLocale}
          rel="alternate"
          hrefLang={altLocale.toLowerCase()}
          href={`${BASE_URL}/${altLocale}${pathWithoutLocale}`}
        />
      ))}
      {/* x-default hreflang (points to English as default) */}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${BASE_URL}/en${pathWithoutLocale}`}
      />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(structuredData)
              ? structuredData
              : [structuredData],
            null,
            0
          )}
        </script>
      )}
    </Helmet>
  );
}
