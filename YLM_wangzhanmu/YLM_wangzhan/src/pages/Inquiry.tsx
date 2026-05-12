import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { normalizeLocale, type Locale } from "@/i18n/locales";
import { createInquiry, listModelsByIds, type ModelListItem } from "@/utils/db";
import { useInquiryDraft } from "@/store/useInquiryDraft";

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

export default function Inquiry() {
  const { t } = useTranslation();
  const params = useParams();
  const locale = (normalizeLocale(params.locale) ?? "en") as Locale;
  const base = `/${locale}`;

  const selectedModelIds = useInquiryDraft((s) => s.selectedModelIds);
  const removeModelId = useInquiryDraft((s) => s.removeModelId);
  const clear = useInquiryDraft((s) => s.clear);

  const [models, setModels] = useState<ModelListItem[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

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
    let active = true;
    if (selectedModelIds.length === 0) {
      setModels([]);
      setLoadingModels(false);
      return () => {
        active = false;
      };
    }

    setLoadingModels(true);
    listModelsByIds({ ids: selectedModelIds, locale })
      .then((data) => {
        if (!active) return;
        setModels(data);
      })
      .finally(() => {
        if (!active) return;
        setLoadingModels(false);
      });
    return () => {
      active = false;
    };
  }, [locale, selectedModelIds]);

  const selectedModels = useMemo(() => models.filter((m) => selectedModelIds.includes(m.id)), [models, selectedModelIds]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSuccessNo(null);

    if (!form.company_name.trim() || !form.contact_name.trim() || !form.email.trim()) {
      setSubmitError(t("inquiry.validation.required"));
      return;
    }

    if (selectedModelIds.length === 0) {
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
        items: selectedModelIds.map((id) => ({ model_id: id })),
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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900">{t("inquiry.title")}</h1>
        <p className="text-sm text-zinc-600">{t("inquiry.subtitle")}</p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-zinc-800">{t("inquiry.selectedModels")}</div>
              <Link className="text-xs text-green-700 hover:text-green-600" to={`${base}/models/all`}>
                {t("action.viewModels")}
              </Link>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {loadingModels ? <div className="text-sm text-zinc-500">{t("common.loading")}</div> : null}
              {!loadingModels && selectedModels.length === 0 ? (
                <div className="text-sm text-zinc-500">{t("inquiry.noSelection")}</div>
              ) : null}

              {selectedModels.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-zinc-800">{m.display_name}</div>
                    <div className="truncate text-xs text-zinc-500">{[m.brand, m.series_name].filter(Boolean).join(" · ")}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeModelId(m.id)}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                  >
                    {t("inquiry.remove")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <form onSubmit={onSubmit} className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">{t("inquiry.company")}</span>
                <input
                  value={form.company_name}
                  onChange={(e) => setForm((s) => ({ ...s, company_name: e.target.value }))}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">{t("inquiry.contact")}</span>
                <input
                  value={form.contact_name}
                  onChange={(e) => setForm((s) => ({ ...s, contact_name: e.target.value }))}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">{t("inquiry.email")}</span>
                <input
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  type="email"
                  required
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">{t("inquiry.whatsapp")}</span>
                <input
                  value={form.whatsapp}
                  onChange={(e) => setForm((s) => ({ ...s, whatsapp: e.target.value }))}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">{t("inquiry.country")}</span>
                <input
                  value={form.country_region}
                  onChange={(e) => setForm((s) => ({ ...s, country_region: e.target.value }))}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">{t("inquiry.destinationPort")}</span>
                <input
                  value={form.destination_port}
                  onChange={(e) => setForm((s) => ({ ...s, destination_port: e.target.value }))}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">{t("inquiry.incoterm")}</span>
                <input
                  value={form.incoterm}
                  onChange={(e) => setForm((s) => ({ ...s, incoterm: e.target.value }))}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">{t("inquiry.quantity")}</span>
                <input
                  value={form.total_quantity}
                  onChange={(e) => setForm((s) => ({ ...s, total_quantity: e.target.value }))}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  inputMode="numeric"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">{t("inquiry.needBy")}</span>
                <input
                  value={form.need_by}
                  onChange={(e) => setForm((s) => ({ ...s, need_by: e.target.value }))}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </label>
            </div>

            <label className="mt-4 grid gap-1">
              <span className="text-xs text-zinc-400">{t("inquiry.note")}</span>
              <textarea
                value={form.note}
                onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
                className="min-h-24 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </label>

            {submitError ? <div className="mt-4 text-sm text-red-300">{submitError}</div> : null}
            {successNo ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                {t("inquiry.success")} <span className="font-semibold">{successNo}</span>
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-green-600 px-5 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-60"
              >
                {submitting ? t("common.submitting") : t("action.submit")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
