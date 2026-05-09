import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/utils/supabaseClient";
import type { InquiryRow } from "@/utils/db";
import { primaryButtonCls, tableContainerCls } from "@/admin/AdminApp";

const STATUSES: InquiryRow["status"][] = ["new", "contacted", "quoting", "won", "lost"];

const STATUS_LABELS: Record<InquiryRow["status"], string> = {
  new: "新线索",
  contacted: "已联系",
  quoting: "报价中",
  won: "已成交",
  lost: "已流失",
};

export default function AdminInquiries() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<InquiryRow[]>([]);
  const [selected, setSelected] = useState<InquiryRow | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (qErr) throw qErr;
      setItems((data ?? []) as InquiryRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function saveSelected(next: InquiryRow) {
    setLoading(true);
    setError(null);
    try {
      const { error: upErr } = await supabase
        .from("inquiries")
        .update({ status: next.status, admin_note: next.admin_note })
        .eq("id", next.id);
      if (upErr) throw upErr;
      setSelected(next);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-zinc-900">{t("admin.tab.inquiries")}</div>
          <button
            type="button"
            onClick={refresh}
            className={primaryButtonCls()}
            disabled={loading}
          >
            {loading ? "加载中..." : t("action.refresh")}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-base text-zinc-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600"></div>
            <span>{t("common.loading")}</span>
          </div>
        ) : null}
        {error ? (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-base text-red-700">
            {error}
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-8 text-center text-base text-zinc-600">
            {t("admin.inquiries.empty")}
          </div>
        ) : (
          <div className={tableContainerCls()}>
            <div className="grid grid-cols-12 gap-2 bg-gradient-to-r from-zinc-50 to-zinc-100 px-4 py-3 text-xs font-semibold text-zinc-600">
              <div className="col-span-4">{t("admin.inquiries.columns.no")}</div>
              <div className="col-span-3">{t("admin.inquiries.columns.company")}</div>
              <div className="col-span-3">{t("admin.inquiries.columns.country")}</div>
              <div className="col-span-2">{t("admin.inquiries.columns.status")}</div>
            </div>
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => setSelected(it)}
                className={
                  "grid w-full grid-cols-12 gap-2 border-t border-zinc-200/60 px-4 py-3 text-left text-sm hover:bg-zinc-50/80 transition-colors duration-200 " +
                  (selected?.id === it.id ? "bg-zinc-50/80" : "bg-white")
                }
              >
                <div className="col-span-4 truncate text-base text-zinc-900">{it.inquiry_no}</div>
                <div className="col-span-3 truncate text-sm text-zinc-800">{it.company_name}</div>
                <div className="col-span-3 truncate text-sm text-zinc-600">{it.country_region ?? "-"}</div>
                <div className="col-span-2 truncate text-sm text-zinc-600">{it.status}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-zinc-200/60 bg-gradient-to-br from-white to-zinc-50 p-6 shadow-sm">
          <div className="text-lg font-bold text-zinc-900 mb-4">{t("admin.inquiries.detail.title")}</div>
          {!selected ? (
            <div className="text-base text-zinc-500">
              {t("admin.inquiries.detail.selectOne")}
            </div>
          ) : null}

          {selected ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200/60 bg-white p-4">
                <div className="text-xs text-zinc-500 mb-2">{t("admin.inquiries.detail.inquiryNo")}</div>
                <div className="text-sm text-zinc-800">{selected.inquiry_no}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-200/60 bg-white p-4">
                  <div className="text-xs text-zinc-500 mb-2">{t("admin.inquiries.detail.contact")}</div>
                  <div className="text-sm text-zinc-800">{selected.contact_name}</div>
                </div>
                <div className="rounded-2xl border border-zinc-200/60 bg-white p-4">
                  <div className="text-xs text-zinc-500 mb-2">{t("admin.inquiries.detail.email")}</div>
                  <div className="text-sm text-zinc-800">{selected.email}</div>
                </div>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-zinc-700">{t("admin.inquiries.detail.status")}</span>
                <select
                  value={selected.status}
                  onChange={(e) => setSelected((s) => (s ? { ...s, status: e.target.value as InquiryRow["status"] } : s))}
                  className="h-11 w-full rounded-2xl border border-zinc-200/60 bg-white px-4 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-zinc-700">{t("admin.inquiries.detail.adminNote")}</span>
                <textarea
                  value={selected.admin_note ?? ""}
                  onChange={(e) => setSelected((s) => (s ? { ...s, admin_note: e.target.value } : s))}
                  className="min-h-32 w-full rounded-2xl border border-zinc-200/60 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </label>

              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  if (selected) await saveSelected(selected);
                }}
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("action.save")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
