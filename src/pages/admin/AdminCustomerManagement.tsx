import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import Modal from "@/components/ui/Modal";
import {
  pageCardCls,
  pageDescCls,
  pageTitleCls,
  primaryButtonCls,
  secondaryButtonCls,
  smallButtonCls,
  statusBadgeCls,
  subTabCls,
  tableContainerCls,
  tableHeaderCls,
  tableRowCls,
} from "@/admin/AdminApp";

type Tab = "customers" | "inquiries";

type AdminUser = {
  id: string;
  email: string;
  is_approved: boolean;
};

type CustomerStatus = "new" | "contacted" | "qualified" | "quoted" | "negotiating" | "won" | "lost";
type InquiryStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "quoting"
  | "quoted"
  | "negotiating"
  | "won"
  | "lost";
type InquiryPriority = "low" | "normal" | "high" | "urgent";

type CustomerOverviewRow = {
  customer_id: string;
  email: string;
  company_name: string | null;
  contact_name: string | null;
  whatsapp: string | null;
  country_region: string | null;
  customer_status: CustomerStatus;
  owner_admin_id: string | null;
  customer_next_follow_up_at: string | null;
  last_inquiry_at: string | null;
  last_contact_at: string | null;
  customer_admin_note: string | null;
  inquiries_total: number;
  inquiries_open: number;
  last_inquiry_id: string | null;
  last_inquiry_no: string | null;
  last_inquiry_status: InquiryStatus | null;
  last_inquiry_created_at: string | null;
};

type InquiryOverviewRow = {
  inquiry_id: string;
  inquiry_no: string;
  locale: string | null;
  status: InquiryStatus;
  priority: InquiryPriority;
  next_follow_up_at: string | null;
  assigned_admin_id: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  customer_id: string | null;
  customer_email: string | null;
  customer_company_name: string | null;
  customer_contact_name: string | null;
  customer_whatsapp: string | null;
  customer_country_region: string | null;
  items_count: number;
};

type InquiryItemRow = {
  id: string;
  inquiry_id: string;
  model_id: string | null;
  quantity: number | null;
  note: string | null;
};

type InquiryEventRow = {
  id: string;
  inquiry_id: string;
  event_type: "note" | "status_change" | "assignment" | "follow_up" | "system";
  message: string | null;
  from_status: string | null;
  to_status: string | null;
  next_follow_up_at: string | null;
  created_by_admin_id: string | null;
  created_at: string;
};

function safeText(v: unknown) {
  const s = String(v ?? "").trim();
  return s || "-";
}

function fmtTime(ts: string | null | undefined) {
  if (!ts) return "-";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function toDateTimeLocalValue(ts: string | null | undefined) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateTimeLocalValue(v: string) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function statusBadgeType(status: string): "success" | "warning" | "info" | "default" {
  if (status === "won") return "success";
  if (status === "lost") return "default";
  if (status === "quoted" || status === "quoting") return "info";
  if (status === "negotiating") return "warning";
  if (status === "qualified" || status === "contacted") return "warning";
  return "default";
}

function priorityBadgeType(priority: InquiryPriority): "success" | "warning" | "info" | "default" {
  if (priority === "urgent") return "warning";
  if (priority === "high") return "info";
  if (priority === "low") return "default";
  return "default";
}

export default function AdminCustomerManagement() {
  const [tab, setTab] = useState<Tab>("customers");
  const [adminId, setAdminId] = useState<string | null>(null);

  const [admins, setAdmins] = useState<AdminUser[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [onlyNeedFollowUp, setOnlyNeedFollowUp] = useState(false);

  const [customers, setCustomers] = useState<CustomerOverviewRow[]>([]);
  const [inquiries, setInquiries] = useState<InquiryOverviewRow[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);

  const selectedCustomer = useMemo(
    () => (selectedCustomerId ? customers.find((c) => c.customer_id === selectedCustomerId) ?? null : null),
    [customers, selectedCustomerId]
  );

  const selectedInquiry = useMemo(
    () => (selectedInquiryId ? inquiries.find((i) => i.inquiry_id === selectedInquiryId) ?? null : null),
    [inquiries, selectedInquiryId]
  );

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers
      .filter((c) => {
        if (!q) return true;
        return (
          (c.email ?? "").toLowerCase().includes(q) ||
          (c.company_name ?? "").toLowerCase().includes(q) ||
          (c.contact_name ?? "").toLowerCase().includes(q) ||
          (c.whatsapp ?? "").toLowerCase().includes(q)
        );
      })
      .filter((c) => {
        if (!onlyNeedFollowUp) return true;
        return c.inquiries_open > 0 || Boolean(c.customer_next_follow_up_at);
      });
  }, [customers, onlyNeedFollowUp, search]);

  const filteredInquiries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inquiries.filter((i) => {
      if (!q) return true;
      return (
        (i.inquiry_no ?? "").toLowerCase().includes(q) ||
        (i.customer_email ?? "").toLowerCase().includes(q) ||
        (i.customer_company_name ?? "").toLowerCase().includes(q) ||
        (i.customer_contact_name ?? "").toLowerCase().includes(q) ||
        (i.customer_whatsapp ?? "").toLowerCase().includes(q)
      );
    });
  }, [inquiries, search]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAdminId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("admin_users")
      .select("id, email, is_approved")
      .eq("is_approved", true)
      .order("created_at", { ascending: true })
      .then(({ data, error: e }) => {
        if (cancelled) return;
        if (e) throw e;
        setAdmins((data ?? []) as AdminUser[]);
      })
      .catch(() => {
        if (cancelled) return;
        setAdmins([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadCustomers() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from("customer_overview")
        .select("*")
        .order("last_inquiry_created_at", { ascending: false, nullsFirst: false });
      if (e) throw e;
      setCustomers((data ?? []) as CustomerOverviewRow[]);
    } catch (e2: unknown) {
      setError(e2 instanceof Error ? e2.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadInquiries() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from("inquiry_overview")
        .select("*")
        .order("created_at", { ascending: false });
      if (e) throw e;
      setInquiries((data ?? []) as InquiryOverviewRow[]);
    } catch (e2: unknown) {
      setError(e2 instanceof Error ? e2.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "customers") loadCustomers();
    if (tab === "inquiries") loadInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className={pageCardCls() + " p-8"}>
      <div className="mb-6">
        <h3 className={pageTitleCls()}>客户管理</h3>
        <p className={pageDescCls()}>按客户维度沉淀信息，并用询盘链路进行跟进追踪</p>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setTab("customers")} className={subTabCls(tab === "customers")}>
              客户管理
            </button>
            <button type="button" onClick={() => setTab("inquiries")} className={subTabCls(tab === "inquiries")}>
              询盘管理
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索邮箱/公司/联系人/询盘号"
              className="h-10 w-72 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {tab === "customers" ? (
              <button
                type="button"
                className={secondaryButtonCls()}
                onClick={() => setOnlyNeedFollowUp((v) => !v)}
              >
                {onlyNeedFollowUp ? "显示全部" : "只看需跟进"}
              </button>
            ) : null}
            <button type="button" className={secondaryButtonCls()} onClick={() => (tab === "customers" ? loadCustomers() : loadInquiries())}>
              刷新
            </button>
          </div>
        </div>
      </div>

      {error ? <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {loading ? <div className="mb-6 text-sm text-zinc-500">加载中...</div> : null}

      {tab === "customers" ? (
        <div className={tableContainerCls()}>
          <div className={tableHeaderCls() + " grid-cols-12"}>
            <div className="col-span-3">客户</div>
            <div className="col-span-2">联系方式</div>
            <div className="col-span-1">国家</div>
            <div className="col-span-1">状态</div>
            <div className="col-span-2">下次跟进</div>
            <div className="col-span-1">未结询盘</div>
            <div className="col-span-2">最近询盘</div>
          </div>
          {filteredCustomers.map((c) => {
            const ownerEmail = c.owner_admin_id ? admins.find((a) => a.id === c.owner_admin_id)?.email ?? "" : "";
            return (
              <button
                key={c.customer_id}
                type="button"
                className={tableRowCls(true) + " grid-cols-12 items-center"}
                onClick={() => {
                  setSelectedCustomerId(c.customer_id);
                  setSelectedInquiryId(null);
                }}
              >
                <div className="col-span-3 min-w-0">
                  <div className="truncate font-semibold text-zinc-900">{safeText(c.company_name || c.contact_name || c.email)}</div>
                  <div className="truncate text-xs text-zinc-500">{[c.contact_name, c.email, ownerEmail ? `跟进人: ${ownerEmail}` : null].filter(Boolean).join(" · ")}</div>
                </div>
                <div className="col-span-2 min-w-0">
                  <div className="truncate text-sm text-zinc-800">{safeText(c.email)}</div>
                  <div className="truncate text-xs text-zinc-500">{safeText(c.whatsapp)}</div>
                </div>
                <div className="col-span-1 truncate text-sm text-zinc-700">{safeText(c.country_region)}</div>
                <div className="col-span-1">
                  <span className={statusBadgeCls(statusBadgeType(c.customer_status))}>{c.customer_status}</span>
                </div>
                <div className="col-span-2 truncate text-sm text-zinc-700">{fmtTime(c.customer_next_follow_up_at)}</div>
                <div className="col-span-1">
                  <span className={statusBadgeCls(c.inquiries_open > 0 ? "warning" : "default")}>{c.inquiries_open}</span>
                </div>
                <div className="col-span-2 min-w-0">
                  <div className="truncate text-sm text-zinc-800">{safeText(c.last_inquiry_no)}</div>
                  <div className="truncate text-xs text-zinc-500">
                    {[c.last_inquiry_status, c.last_inquiry_created_at ? fmtTime(c.last_inquiry_created_at) : null].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {tab === "inquiries" ? (
        <div className={tableContainerCls()}>
          <div className={tableHeaderCls() + " grid-cols-12"}>
            <div className="col-span-2">询盘号</div>
            <div className="col-span-3">客户</div>
            <div className="col-span-1">状态</div>
            <div className="col-span-1">优先级</div>
            <div className="col-span-2">下次跟进</div>
            <div className="col-span-1">车型数</div>
            <div className="col-span-2">创建时间</div>
          </div>
          {filteredInquiries.map((i) => {
            const assignedEmail = i.assigned_admin_id ? admins.find((a) => a.id === i.assigned_admin_id)?.email ?? "" : "";
            return (
              <button
                key={i.inquiry_id}
                type="button"
                className={tableRowCls(true) + " grid-cols-12 items-center"}
                onClick={() => {
                  setSelectedInquiryId(i.inquiry_id);
                  setSelectedCustomerId(i.customer_id);
                }}
              >
                <div className="col-span-2 min-w-0">
                  <div className="truncate font-semibold text-zinc-900">{i.inquiry_no}</div>
                  <div className="truncate text-xs text-zinc-500">{assignedEmail ? `跟进人: ${assignedEmail}` : "未分配"}</div>
                </div>
                <div className="col-span-3 min-w-0">
                  <div className="truncate font-semibold text-zinc-900">{safeText(i.customer_company_name || i.customer_contact_name || i.customer_email)}</div>
                  <div className="truncate text-xs text-zinc-500">{[i.customer_contact_name, i.customer_email, i.customer_whatsapp].filter(Boolean).join(" · ")}</div>
                </div>
                <div className="col-span-1">
                  <span className={statusBadgeCls(statusBadgeType(i.status))}>{i.status}</span>
                </div>
                <div className="col-span-1">
                  <span className={statusBadgeCls(priorityBadgeType(i.priority))}>{i.priority}</span>
                </div>
                <div className="col-span-2 truncate text-sm text-zinc-700">{fmtTime(i.next_follow_up_at)}</div>
                <div className="col-span-1">
                  <span className={statusBadgeCls(i.items_count > 0 ? "info" : "default")}>{i.items_count}</span>
                </div>
                <div className="col-span-2 truncate text-sm text-zinc-700">{fmtTime(i.created_at)}</div>
              </button>
            );
          })}
        </div>
      ) : null}

      <CustomerDetailModal
        open={Boolean(selectedCustomerId) && tab === "customers"}
        customer={selectedCustomer}
        admins={admins}
        onClose={() => setSelectedCustomerId(null)}
        onOpenInquiry={(id) => {
          setSelectedInquiryId(id);
          setTab("inquiries");
        }}
        onSaved={() => loadCustomers()}
      />

      <InquiryDetailModal
        open={Boolean(selectedInquiryId) && tab === "inquiries"}
        inquiry={selectedInquiry}
        admins={admins}
        adminId={adminId}
        onClose={() => setSelectedInquiryId(null)}
        onSaved={() => loadInquiries()}
      />
    </div>
  );
}

function CustomerDetailModal(props: {
  open: boolean;
  customer: CustomerOverviewRow | null;
  admins: AdminUser[];
  onClose: () => void;
  onOpenInquiry: (inquiryId: string) => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [localStatus, setLocalStatus] = useState<CustomerStatus>("new");
  const [ownerId, setOwnerId] = useState<string>("");
  const [nextFollowUp, setNextFollowUp] = useState<string>("");
  const [adminNote, setAdminNote] = useState("");
  const [inquiries, setInquiries] = useState<InquiryOverviewRow[]>([]);

  useEffect(() => {
    if (!props.open || !props.customer) return;
    setLocalStatus(props.customer.customer_status);
    setOwnerId(props.customer.owner_admin_id ?? "");
    setNextFollowUp(toDateTimeLocalValue(props.customer.customer_next_follow_up_at));
    setAdminNote(props.customer.customer_admin_note ?? "");
  }, [props.customer, props.open]);

  useEffect(() => {
    if (!props.open || !props.customer) return;
    let cancelled = false;
    supabase
      .from("inquiry_overview")
      .select("*")
      .eq("customer_id", props.customer.customer_id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) throw error;
        setInquiries((data ?? []) as InquiryOverviewRow[]);
      })
      .catch(() => {
        if (cancelled) return;
        setInquiries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [props.customer?.customer_id, props.open]);

  async function save() {
    if (!props.customer) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("customers")
        .update({
          status: localStatus,
          owner_admin_id: ownerId || null,
          next_follow_up_at: fromDateTimeLocalValue(nextFollowUp),
          admin_note: adminNote.trim() || null,
        })
        .eq("id", props.customer.customer_id);
      if (error) throw error;
      props.onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl"
    >
      <div className="flex max-h-[calc(100vh-6rem)] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-4">
          <div className="min-w-0">
            <div className="truncate text-lg font-bold text-zinc-900">{safeText(props.customer?.company_name || props.customer?.email)}</div>
            <div className="mt-0.5 truncate text-sm text-zinc-500">
              {[props.customer?.contact_name, props.customer?.email, props.customer?.whatsapp].filter(Boolean).join(" · ")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={props.onClose} className={secondaryButtonCls()}>
              关闭
            </button>
            <button type="button" onClick={save} disabled={saving} className={primaryButtonCls()}>
              保存
            </button>
          </div>
        </div>

        <div className="premium-scroll overflow-y-auto px-6 py-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5">
              <div className="text-sm font-semibold text-zinc-900 mb-4">客户信息</div>
              <div className="grid gap-4">
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-zinc-600">客户状态</span>
                  <select
                    className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={localStatus}
                    onChange={(e) => setLocalStatus(e.target.value as CustomerStatus)}
                  >
                    {(["new", "contacted", "qualified", "quoted", "negotiating", "won", "lost"] as CustomerStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-zinc-600">跟进人</span>
                  <select
                    className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                  >
                    <option value="">未分配</option>
                    {props.admins.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.email}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-zinc-600">下次跟进</span>
                  <input
                    type="datetime-local"
                    value={nextFollowUp}
                    onChange={(e) => setNextFollowUp(e.target.value)}
                    className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-zinc-600">内部备注</span>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="min-h-24 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="text-sm font-semibold text-zinc-900">该客户的询盘</div>
                <span className={statusBadgeCls(props.customer?.inquiries_open ? "warning" : "default")}>未结 {props.customer?.inquiries_open ?? 0}</span>
              </div>
              <div className="space-y-2">
                {inquiries.length === 0 ? <div className="text-sm text-zinc-500">暂无询盘</div> : null}
                {inquiries.map((it) => (
                  <button
                    key={it.inquiry_id}
                    type="button"
                    onClick={() => props.onOpenInquiry(it.inquiry_id)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left hover:bg-zinc-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-zinc-900">{it.inquiry_no}</div>
                      <span className={statusBadgeCls(statusBadgeType(it.status))}>{it.status}</span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {[fmtTime(it.created_at), it.items_count ? `车型 ${it.items_count}` : null].filter(Boolean).join(" · ")}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function InquiryDetailModal(props: {
  open: boolean;
  inquiry: InquiryOverviewRow | null;
  admins: AdminUser[];
  adminId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<InquiryItemRow[]>([]);
  const [events, setEvents] = useState<InquiryEventRow[]>([]);
  const [modelNames, setModelNames] = useState<Record<string, string>>({});

  const [status, setStatus] = useState<InquiryStatus>("new");
  const [priority, setPriority] = useState<InquiryPriority>("normal");
  const [assigned, setAssigned] = useState<string>("");
  const [nextFollowUp, setNextFollowUp] = useState<string>("");
  const [adminNote, setAdminNote] = useState("");

  const [quickNote, setQuickNote] = useState("");
  const [quickNextFollowUp, setQuickNextFollowUp] = useState<string>("");

  useEffect(() => {
    if (!props.open || !props.inquiry) return;
    setStatus(props.inquiry.status);
    setPriority(props.inquiry.priority);
    setAssigned(props.inquiry.assigned_admin_id ?? "");
    setNextFollowUp(toDateTimeLocalValue(props.inquiry.next_follow_up_at));
    setAdminNote(props.inquiry.admin_note ?? "");
    setQuickNote("");
    setQuickNextFollowUp(toDateTimeLocalValue(props.inquiry.next_follow_up_at));
  }, [props.inquiry, props.open]);

  useEffect(() => {
    if (!props.open || !props.inquiry) return;
    let cancelled = false;
    supabase
      .from("inquiry_items")
      .select("id, inquiry_id, model_id, quantity, note")
      .eq("inquiry_id", props.inquiry.inquiry_id)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) throw error;
        setItems((data ?? []) as InquiryItemRow[]);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [props.inquiry?.inquiry_id, props.open]);

  useEffect(() => {
    if (!props.open) return;
    const ids = Array.from(new Set(items.map((x) => x.model_id).filter(Boolean) as string[]));
    if (ids.length === 0) {
      setModelNames({});
      return;
    }

    let cancelled = false;
    supabase
      .from("models")
      .select("id, name, brand_name, series_name")
      .in("id", ids)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) throw error;
        const map: Record<string, string> = {};
        for (const row of (data ?? []) as any[]) {
          const parts = [row.brand_name, row.series_name, row.name].filter(Boolean);
          map[String(row.id)] = parts.length > 0 ? parts.join(" · ") : String(row.id);
        }
        setModelNames(map);
      })
      .catch(() => {
        if (cancelled) return;
        setModelNames({});
      });
    return () => {
      cancelled = true;
    };
  }, [items, props.open]);

  useEffect(() => {
    if (!props.open || !props.inquiry) return;
    let cancelled = false;
    supabase
      .from("inquiry_events")
      .select("*")
      .eq("inquiry_id", props.inquiry.inquiry_id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) throw error;
        setEvents((data ?? []) as InquiryEventRow[]);
      })
      .catch(() => {
        if (cancelled) return;
        setEvents([]);
      });

    return () => {
      cancelled = true;
    };
  }, [props.inquiry?.inquiry_id, props.open]);

  async function save() {
    if (!props.inquiry) return;
    setSaving(true);
    try {
      const prev = props.inquiry;
      const nextFollowUpIso = fromDateTimeLocalValue(nextFollowUp);
      const assignedId = assigned || null;

      const { error } = await supabase
        .from("inquiries")
        .update({
          status,
          priority,
          assigned_admin_id: assignedId,
          next_follow_up_at: nextFollowUpIso,
          admin_note: adminNote.trim() || null,
          updated_by_admin_id: props.adminId,
        })
        .eq("id", prev.inquiry_id);

      if (error) throw error;

      const eventsToInsert: Omit<InquiryEventRow, "id" | "created_at">[] = [];
      if (prev.status !== status) {
        eventsToInsert.push({
          inquiry_id: prev.inquiry_id,
          event_type: "status_change",
          message: null,
          from_status: prev.status,
          to_status: status,
          next_follow_up_at: nextFollowUpIso,
          created_by_admin_id: props.adminId,
        });
      }
      if ((prev.assigned_admin_id ?? null) !== assignedId) {
        eventsToInsert.push({
          inquiry_id: prev.inquiry_id,
          event_type: "assignment",
          message: assignedId ? `分配给: ${props.admins.find((a) => a.id === assignedId)?.email ?? assignedId}` : "取消分配",
          from_status: null,
          to_status: null,
          next_follow_up_at: nextFollowUpIso,
          created_by_admin_id: props.adminId,
        });
      }
      if ((prev.next_follow_up_at ?? null) !== (nextFollowUpIso ?? null)) {
        eventsToInsert.push({
          inquiry_id: prev.inquiry_id,
          event_type: "follow_up",
          message: nextFollowUpIso ? `设置下次跟进: ${fmtTime(nextFollowUpIso)}` : "清除下次跟进时间",
          from_status: null,
          to_status: null,
          next_follow_up_at: nextFollowUpIso,
          created_by_admin_id: props.adminId,
        });
      }

      if (eventsToInsert.length > 0) {
        const { error: e2 } = await supabase.from("inquiry_events").insert(eventsToInsert);
        if (e2) throw e2;
      }

      props.onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function addQuickNote() {
    if (!props.inquiry) return;
    const note = quickNote.trim();
    const nextIso = fromDateTimeLocalValue(quickNextFollowUp);
    if (!note && !nextIso) return;

    setSaving(true);
    try {
      const { error: e1 } = await supabase.from("inquiry_events").insert({
        inquiry_id: props.inquiry.inquiry_id,
        event_type: "note",
        message: note || null,
        from_status: null,
        to_status: null,
        next_follow_up_at: nextIso,
        created_by_admin_id: props.adminId,
      });
      if (e1) throw e1;

      if (nextIso) {
        const { error: e2 } = await supabase
          .from("inquiries")
          .update({ next_follow_up_at: nextIso, updated_by_admin_id: props.adminId })
          .eq("id", props.inquiry.inquiry_id);
        if (e2) throw e2;
      }

      setQuickNote("");
      props.onSaved();
      const { data } = await supabase
        .from("inquiry_events")
        .select("*")
        .eq("inquiry_id", props.inquiry.inquiry_id)
        .order("created_at", { ascending: false });
      setEvents((data ?? []) as InquiryEventRow[]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      className="relative w-full max-w-6xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl"
    >
      <div className="flex max-h-[calc(100vh-6rem)] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-4">
          <div className="min-w-0">
            <div className="truncate text-lg font-bold text-zinc-900">{props.inquiry?.inquiry_no ?? "-"}</div>
            <div className="mt-0.5 truncate text-sm text-zinc-500">
              {[props.inquiry?.customer_company_name || props.inquiry?.customer_email, props.inquiry?.customer_contact_name, props.inquiry?.customer_whatsapp]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={props.onClose} className={secondaryButtonCls()}>
              关闭
            </button>
            <button type="button" onClick={save} disabled={saving} className={primaryButtonCls()}>
              保存
            </button>
          </div>
        </div>

        <div className="premium-scroll overflow-y-auto px-6 py-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 lg:col-span-1">
              <div className="text-sm font-semibold text-zinc-900 mb-4">询盘状态</div>
              <div className="grid gap-4">
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-zinc-600">状态</span>
                  <select
                    className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as InquiryStatus)}
                  >
                    {([
                      "new",
                      "contacted",
                      "qualified",
                      "quoting",
                      "quoted",
                      "negotiating",
                      "won",
                      "lost",
                    ] as InquiryStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-zinc-600">优先级</span>
                  <select
                    className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as InquiryPriority)}
                  >
                    {(["low", "normal", "high", "urgent"] as InquiryPriority[]).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-zinc-600">跟进人</span>
                  <select
                    className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={assigned}
                    onChange={(e) => setAssigned(e.target.value)}
                  >
                    <option value="">未分配</option>
                    {props.admins.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.email}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-zinc-600">下次跟进</span>
                  <input
                    type="datetime-local"
                    value={nextFollowUp}
                    onChange={(e) => setNextFollowUp(e.target.value)}
                    className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-zinc-600">内部备注</span>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="min-h-24 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 lg:col-span-1">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="text-sm font-semibold text-zinc-900">车型清单</div>
                <span className={statusBadgeCls(items.length > 0 ? "info" : "default")}>{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.length === 0 ? <div className="text-sm text-zinc-500">暂无车型</div> : null}
                {items.map((it) => (
                  <div key={it.id} className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                    <div className="text-sm font-semibold text-zinc-900">
                      {it.model_id ? modelNames[it.model_id] ?? it.model_id : "-"}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">{[it.quantity != null ? `数量: ${it.quantity}` : null, it.note].filter(Boolean).join(" · ")}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 lg:col-span-1">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="text-sm font-semibold text-zinc-900">跟进记录</div>
                <span className={statusBadgeCls(events.length > 0 ? "info" : "default")}>{events.length}</span>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-xs font-semibold text-zinc-600 mb-2">快速记录</div>
                <textarea
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  className="min-h-20 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="例如：已加 WhatsApp，客户希望报价含运费…"
                />
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={quickNextFollowUp}
                    onChange={(e) => setQuickNextFollowUp(e.target.value)}
                    className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button type="button" onClick={addQuickNote} disabled={saving} className={smallButtonCls("primary")}>
                    记录
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {events.length === 0 ? <div className="text-sm text-zinc-500">暂无记录</div> : null}
                {events.map((ev) => (
                  <div key={ev.id} className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold text-zinc-700">{ev.event_type}</div>
                      <div className="text-xs text-zinc-500">{fmtTime(ev.created_at)}</div>
                    </div>
                    <div className="mt-1 text-sm text-zinc-900">
                      {ev.event_type === "status_change" && ev.from_status && ev.to_status ? `${ev.from_status} → ${ev.to_status}` : null}
                      {ev.message ? (ev.event_type === "status_change" ? ` · ${ev.message}` : ev.message) : null}
                    </div>
                    {ev.next_follow_up_at ? <div className="mt-1 text-xs text-zinc-500">下次跟进: {fmtTime(ev.next_follow_up_at)}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {props.inquiry ? (
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-zinc-900">概览</div>
                <div className="flex items-center gap-2">
                  <span className={statusBadgeCls(statusBadgeType(props.inquiry.status))}>{props.inquiry.status}</span>
                  <span className={statusBadgeCls(priorityBadgeType(props.inquiry.priority))}>{props.inquiry.priority}</span>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-zinc-700 md:grid-cols-2">
                <div>创建时间：{fmtTime(props.inquiry.created_at)}</div>
                <div>语言：{safeText(props.inquiry.locale)}</div>
                <div>国家/地区：{safeText(props.inquiry.customer_country_region)}</div>
                <div>下次跟进：{fmtTime(props.inquiry.next_follow_up_at)}</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
