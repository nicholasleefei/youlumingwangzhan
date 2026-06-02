import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { type Locale } from "@/i18n/locales";
import { useInquiryDraft } from "@/store/useInquiryDraft";
import { createInquiry, listModelsByIds, listSeriesByIds, type InquirySelectedModel } from "@/utils/db";

type FormState = {
  company_name: string;
  contact_name: string;
  email: string;
  whatsapp: string;
  country_region: string;
  destination_port: string;
  incoterm: string;
  total_quantity: string;
  need_by: string;
  note: string;
};

type Props = {
  open: boolean;
  locale: Locale;
  onClose: () => void;
};

export default function InquiryModal({ open, locale, onClose }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const base = `/${locale}`;

  const selectedModelIds = useInquiryDraft((s) => s.selectedModelIds);
  const selectedSeriesIds = useInquiryDraft((s) => s.selectedSeriesIds);
  const removeModelId = useInquiryDraft((s) => s.removeModelId);
  const removeSeriesId = useInquiryDraft((s) => s.removeSeriesId);
  const clear = useInquiryDraft((s) => s.clear);

  const [selectedModels, setSelectedModels] = useState<InquirySelectedModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const [selectedSeries, setSelectedSeries] = useState<Array<{ id: string; name: string; fullname: string | null; brand_name: string | null }>>([]);
  const [loadingSeries, setLoadingSeries] = useState(false);

  const [form, setForm] = useState<FormState>({
    company_name: "",
    contact_name: "",
    email: "",
    whatsapp: "",
    country_region: "",
    destination_port: "",
    incoterm: "",
    total_quantity: "",
    need_by: "",
    note: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successNo, setSuccessNo] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const hasAny = selectedModelIds.length > 0 || selectedSeriesIds.length > 0;
    if (!hasAny) {
      setSelectedModels([]);
      setSelectedSeries([]);
      setLoadingModels(false);
      setLoadingSeries(false);
      return;
    }

    setLoadingModels(selectedModelIds.length > 0);
    setLoadingSeries(selectedSeriesIds.length > 0);

    Promise.all([
      selectedSeriesIds.length > 0 ? listSeriesByIds({ ids: selectedSeriesIds, locale }) : Promise.resolve([]),
      selectedModelIds.length > 0 ? listModelsByIds({ ids: selectedModelIds, locale }) : Promise.resolve([]),
    ])
      .then(([series, models]) => {
        if (!active) return;
        setSelectedSeries(series);
        setSelectedModels(models);
      })
      .catch(() => {
        if (!active) return;
        setSelectedSeries([]);
        setSelectedModels([]);
      })
      .finally(() => {
        if (!active) return;
        setLoadingSeries(false);
        setLoadingModels(false);
      });

    return () => {
      active = false;
    };
  }, [open, locale, selectedModelIds.join("|"), selectedSeriesIds.join("|")]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSuccessNo(null);

    if (!form.company_name.trim() || !form.contact_name.trim() || !form.email.trim()) {
      setSubmitError(t("inquiry.validation.required"));
      return;
    }

    if (selectedModelIds.length === 0 && selectedSeriesIds.length === 0) {
      setSubmitError(t("inquiry.validation.selectOne"));
      return;
    }

    const qty = form.total_quantity.trim() ? Number(form.total_quantity.trim()) : null;
    if (form.total_quantity.trim() && Number.isNaN(qty)) {
      setSubmitError(t("inquiry.validation.invalidQuantity"));
      return;
    }

    setSubmitting(true);
    try {
      const inquiry = await createInquiry({
        inquiry: {
          locale,
          company_name: form.company_name.trim(),
          contact_name: form.contact_name.trim(),
          email: form.email.trim(),
          whatsapp: form.whatsapp.trim() || null,
          country_region: form.country_region.trim() || null,
          destination_port: form.destination_port.trim() || null,
          incoterm: form.incoterm.trim() || null,
          total_quantity: qty,
          need_by: form.need_by.trim() || null,
          note: form.note.trim() || null,
        },
        items: [
          ...selectedSeriesIds.map((id) => ({ item_type: "series" as const, series_id: id })),
          ...selectedModelIds.map((id) => ({ item_type: "model" as const, model_id: id })),
        ],
      });
      setSuccessNo(inquiry.inquiry_no);
      clear();
      setForm({
        company_name: "",
        contact_name: "",
        email: "",
        whatsapp: "",
        country_region: "",
        destination_port: "",
        incoterm: "",
        total_quantity: "",
        need_by: "",
        note: "",
      });
    } catch (e2: unknown) {
      setSubmitError(e2 instanceof Error ? e2.message : t("common.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="relative w-full max-w-6xl overflow-hidden rounded-3xl border border-border-default bg-white/95 shadow-xl shadow-shadow-default backdrop-blur-xl"
    >
      <div className="flex max-h-[calc(100vh-5rem)] flex-col">
        <div className="relative border-b border-border-default bg-bg-secondary px-5 py-4">
          <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "radial-gradient(900px circle at 20% 10%, rgba(255,126,0,0.14), transparent 60%)" }} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-text-primary">{t("inquiry.title")}</div>
              <div className="mt-0.5 truncate text-sm text-text-secondary">{t("inquiry.subtitle")}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-default bg-white/70 text-text-secondary shadow-sm shadow-shadow-default transition hover:bg-white"
              aria-label={t("action.back")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="premium-scroll overflow-y-auto bg-primary-dark px-4 py-6 md:px-6">
          <div className="grid gap-6 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="rounded-2xl border border-border-default bg-white p-5 shadow-glow-card shadow-shadow-default">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-text-primary">{t("inquiry.selectedModels")}</div>
                  <Link
                    className="text-xs font-medium text-accent-green hover:text-accent-greenDark"
                    to={`${base}/brands`}
                    onClick={onClose}
                  >
                    {t("nav.brands")}
                  </Link>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  {loadingSeries || loadingModels ? <div className="text-sm text-text-tertiary">{t("common.loading")}</div> : null}
                  {!loadingSeries && !loadingModels && selectedSeries.length === 0 && selectedModels.length === 0 ? (
                    <div className="rounded-xl border border-border-default bg-bg-tertiary px-4 py-3 text-sm text-text-secondary">
                      {t("inquiry.noSelection")}
                    </div>
                  ) : null}

                  {selectedSeries.map((s) => (
                    <div
                      key={`series:${s.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border-default bg-white px-3 py-2 shadow-sm shadow-shadow-default"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-text-primary">{s.fullname || s.name}</div>
                        <div className="truncate text-xs text-text-tertiary">{[s.brand_name, locale === "zh-CN" ? "车系" : "Series"].filter(Boolean).join(" · ")}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSeriesId(s.id)}
                        className="rounded-lg border border-border-default bg-white px-2 py-1 text-xs font-medium text-text-secondary hover:bg-bg-tertiary"
                      >
                        {t("inquiry.remove")}
                      </button>
                    </div>
                  ))}

                  {selectedModels.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border-default bg-white px-3 py-2 shadow-sm shadow-shadow-default"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-text-primary">{m.display_name}</div>
                        <div className="truncate text-xs text-text-tertiary">{[m.brand, m.series_name].filter(Boolean).join(" · ")}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeModelId(m.id)}
                        className="rounded-lg border border-border-default bg-white px-2 py-1 text-xs font-medium text-text-secondary hover:bg-bg-tertiary"
                      >
                        {t("inquiry.remove")}
                      </button>
                    </div>
                  ))}

                  {selectedModelIds.length === 0 && selectedSeriesIds.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate(`${base}/brands`);
                      }}
                      className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-accent-green px-4 text-sm font-semibold text-white shadow-md shadow-shadow-hover transition hover:bg-accent-greenDark"
                    >
                      {t("action.viewModels")}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              <form onSubmit={onSubmit} className="rounded-2xl border border-border-default bg-white p-6 shadow-glow-card shadow-shadow-default">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-text-tertiary">{t("inquiry.company")}</span>
                    <input
                      value={form.company_name}
                      onChange={(e) => setForm((s) => ({ ...s, company_name: e.target.value }))}
                      className="h-11 rounded-xl border border-border-default bg-white px-3 text-sm text-text-primary shadow-sm shadow-shadow-default transition focus:outline-none focus:ring-4 focus:ring-accent-green/15 focus:border-border-hover"
                      required
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-text-tertiary">{t("inquiry.contact")}</span>
                    <input
                      value={form.contact_name}
                      onChange={(e) => setForm((s) => ({ ...s, contact_name: e.target.value }))}
                      className="h-11 rounded-xl border border-border-default bg-white px-3 text-sm text-text-primary shadow-sm shadow-shadow-default transition focus:outline-none focus:ring-4 focus:ring-accent-green/15 focus:border-border-hover"
                      required
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-text-tertiary">{t("inquiry.email")}</span>
                    <input
                      value={form.email}
                      onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                      className="h-11 rounded-xl border border-border-default bg-white px-3 text-sm text-text-primary shadow-sm shadow-shadow-default transition focus:outline-none focus:ring-4 focus:ring-accent-green/15 focus:border-border-hover"
                      type="email"
                      required
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-text-tertiary">{t("inquiry.whatsapp")}</span>
                    <input
                      value={form.whatsapp}
                      onChange={(e) => setForm((s) => ({ ...s, whatsapp: e.target.value }))}
                      className="h-11 rounded-xl border border-border-default bg-white px-3 text-sm text-text-primary shadow-sm shadow-shadow-default transition focus:outline-none focus:ring-4 focus:ring-accent-green/15 focus:border-border-hover"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-text-tertiary">{t("inquiry.country")}</span>
                    <input
                      value={form.country_region}
                      onChange={(e) => setForm((s) => ({ ...s, country_region: e.target.value }))}
                      className="h-11 rounded-xl border border-border-default bg-white px-3 text-sm text-text-primary shadow-sm shadow-shadow-default transition focus:outline-none focus:ring-4 focus:ring-accent-green/15 focus:border-border-hover"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-text-tertiary">{t("inquiry.destinationPort")}</span>
                    <input
                      value={form.destination_port}
                      onChange={(e) => setForm((s) => ({ ...s, destination_port: e.target.value }))}
                      className="h-11 rounded-xl border border-border-default bg-white px-3 text-sm text-text-primary shadow-sm shadow-shadow-default transition focus:outline-none focus:ring-4 focus:ring-accent-green/15 focus:border-border-hover"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-text-tertiary">{t("inquiry.incoterm")}</span>
                    <input
                      value={form.incoterm}
                      onChange={(e) => setForm((s) => ({ ...s, incoterm: e.target.value }))}
                      className="h-11 rounded-xl border border-border-default bg-white px-3 text-sm text-text-primary shadow-sm shadow-shadow-default transition focus:outline-none focus:ring-4 focus:ring-accent-green/15 focus:border-border-hover"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-text-tertiary">{t("inquiry.quantity")}</span>
                    <input
                      value={form.total_quantity}
                      onChange={(e) => setForm((s) => ({ ...s, total_quantity: e.target.value }))}
                      className="h-11 rounded-xl border border-border-default bg-white px-3 text-sm text-text-primary shadow-sm shadow-shadow-default transition focus:outline-none focus:ring-4 focus:ring-accent-green/15 focus:border-border-hover"
                      inputMode="numeric"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-text-tertiary">{t("inquiry.needBy")}</span>
                    <input
                      value={form.need_by}
                      onChange={(e) => setForm((s) => ({ ...s, need_by: e.target.value }))}
                      className="h-11 rounded-xl border border-border-default bg-white px-3 text-sm text-text-primary shadow-sm shadow-shadow-default transition focus:outline-none focus:ring-4 focus:ring-accent-green/15 focus:border-border-hover"
                    />
                  </label>
                </div>

                <label className="mt-4 grid gap-1">
                  <span className="text-xs font-medium text-text-tertiary">{t("inquiry.note")}</span>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
                    className="min-h-28 rounded-xl border border-border-default bg-white px-3 py-2 text-sm text-text-primary shadow-sm shadow-shadow-default transition focus:outline-none focus:ring-4 focus:ring-accent-green/15 focus:border-border-hover"
                  />
                </label>

                {submitError ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div> : null}
                {successNo ? (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-sm shadow-shadow-default">
                    {t("inquiry.success")} <span className="font-semibold">{successNo}</span>
                  </div>
                ) : null}

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-border-default bg-white px-5 text-sm font-semibold text-text-secondary hover:bg-bg-tertiary"
                  >
                    {t("action.back")}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-accent-green px-5 text-sm font-semibold text-white shadow-md shadow-shadow-hover transition hover:bg-accent-greenDark disabled:opacity-60"
                  >
                    {submitting ? t("common.submitting") : t("action.submit")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
