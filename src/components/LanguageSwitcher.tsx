import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { LOCALE_LABELS, SUPPORTED_LOCALES, normalizeLocale, type Locale } from "@/i18n/locales";

const STORAGE_KEY = "ylm_locale";

function replaceLocaleInPath(pathname: string, next: Locale) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return `/${next}`;
  parts[0] = next;
  return `/${parts.join("/")}`;
}

export default function LanguageSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [open, setOpen] = useState(false);

  const current = useMemo(() => {
    const raw = typeof params.locale === "string" ? params.locale : null;
    return normalizeLocale(raw) ?? "en";
  }, [params.locale]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100/50 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-zinc-700">{LOCALE_LABELS[current]}</span>
        <ChevronDown className="h-4 w-4 text-zinc-400" />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-20 mt-2 max-h-80 w-56 min-w-[180px] overflow-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-xl"
        >
          {SUPPORTED_LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              role="option"
              aria-selected={l === current}
              onClick={() => {
                setOpen(false);
                window.localStorage.setItem(STORAGE_KEY, l);
                window.location.href = replaceLocaleInPath(location.pathname, l) + location.search + location.hash;
              }}
              className={
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-zinc-50 " +
                (l === current ? "bg-zinc-100 text-zinc-900" : "text-zinc-700")
              }
            >
              <span>{LOCALE_LABELS[l]}</span>
              <span className="text-xs text-zinc-400">{l}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
