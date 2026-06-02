import { FormEvent, useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import { supabase } from "@/utils/supabaseClient";
import AdminCustomerManagement from "@/pages/admin/AdminCustomerManagement";
import { pageCardCls, pageDescCls, pageTitleCls, primaryButtonCls, secondaryButtonCls, smallButtonCls, statusBadgeCls, subTabCls } from "@/admin/AdminApp";

type AdminUser = {
  id: string;
  email: string;
  is_approved: boolean;
};

type CrmTab = "customers" | "pipeline" | "tasks" | "files" | "import" | "legacy";

type CustomerStatus = "new" | "contacted" | "qualified" | "quoted" | "negotiating" | "won" | "lost";
type OpportunityStage = "lead" | "qualified" | "quoted" | "negotiating" | "won" | "lost";
type TaskStatus = "todo" | "done" | "canceled";

type CrmCustomerRow = {
  id: string;
  primary_email: string;
  company_name: string | null;
  contact_name: string | null;
  whatsapp: string | null;
  country_region: string | null;
  status: CustomerStatus;
  owner_admin_id: string | null;
  next_follow_up_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
};

type CrmOpportunityRow = {
  id: string;
  customer_id: string;
  inquiry_id: string | null;
  stage: OpportunityStage;
  amount: number | null;
  probability: number | null;
  expected_close_at: string | null;
  assigned_admin_id: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  created_at: string;
  updated_at: string;
};

type CrmTaskRow = {
  id: string;
  customer_id: string | null;
  opportunity_id: string | null;
  title: string;
  due_at: string | null;
  status: TaskStatus;
  assigned_admin_id: string | null;
  created_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
};

type CrmActivityRow = {
  id: string;
  customer_id: string;
  opportunity_id: string | null;
  type: "inquiry" | "whatsapp" | "email" | "call" | "note" | "status_change" | "assignment" | "task" | "file" | "system";
  content: string;
  created_by_admin_id: string | null;
  created_at: string;
};

type CrmFileRow = {
  id: string;
  customer_id: string | null;
  opportunity_id: string | null;
  activity_id: string | null;
  bucket: string;
  path: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by_admin_id: string | null;
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
  if (status === "quoted") return "info";
  if (status === "negotiating") return "warning";
  if (status === "qualified" || status === "contacted") return "warning";
  return "default";
}

function stageBadgeType(stage: OpportunityStage): "success" | "warning" | "info" | "default" {
  if (stage === "won") return "success";
  if (stage === "lost") return "default";
  if (stage === "quoted") return "info";
  if (stage === "negotiating") return "warning";
  if (stage === "qualified") return "warning";
  return "default";
}

function taskBadgeType(status: TaskStatus): "success" | "warning" | "info" | "default" {
  if (status === "done") return "success";
  if (status === "canceled") return "default";
  return "warning";
}

const PIPELINE: OpportunityStage[] = ["lead", "qualified", "quoted", "negotiating", "won", "lost"];

export default function AdminCrm() {
  const [tab, setTab] = useState<CrmTab>("customers");
  const [adminId, setAdminId] = useState<string | null>(null);

  const [admins, setAdmins] = useState<AdminUser[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CrmCustomerRow[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const [pipelineRows, setPipelineRows] = useState<CrmOpportunityRow[]>([]);
  const [tasks, setTasks] = useState<CrmTaskRow[]>([]);

  const selectedCustomer = useMemo(
    () => (selectedCustomerId ? customers.find((c) => c.id === selectedCustomerId) ?? null : null),
    [customers, selectedCustomerId]
  );

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      return (
        (c.primary_email ?? "").toLowerCase().includes(q) ||
        (c.company_name ?? "").toLowerCase().includes(q) ||
        (c.contact_name ?? "").toLowerCase().includes(q) ||
        (c.whatsapp ?? "").toLowerCase().includes(q) ||
        (c.country_region ?? "").toLowerCase().includes(q)
      );
    });
  }, [customers, search]);

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
        .from("crm_customers")
        .select("*")
        .order("last_activity_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (e) throw e;
      setCustomers((data ?? []) as CrmCustomerRow[]);
    } catch (e2: unknown) {
      setError(e2 instanceof Error ? e2.message : "加载失败");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPipeline() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase.from("crm_opportunities").select("*").order("updated_at", { ascending: false });
      if (e) throw e;
      setPipelineRows((data ?? []) as CrmOpportunityRow[]);
    } catch (e2: unknown) {
      setError(e2 instanceof Error ? e2.message : "加载失败");
      setPipelineRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadTasks() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from("crm_tasks")
        .select("*")
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (e) throw e;
      setTasks((data ?? []) as CrmTaskRow[]);
    } catch (e2: unknown) {
      setError(e2 instanceof Error ? e2.message : "加载失败");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "customers") loadCustomers();
    if (tab === "pipeline") loadPipeline();
    if (tab === "tasks") loadTasks();
    if (tab === "files") loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const pipelineByStage = useMemo(() => {
    const map: Record<string, CrmOpportunityRow[]> = {};
    for (const s of PIPELINE) map[s] = [];
    for (const r of pipelineRows) {
      const s = (r.stage ?? "lead") as OpportunityStage;
      (map[s] ?? (map[s] = [])).push(r);
    }
    return map as Record<OpportunityStage, CrmOpportunityRow[]>;
  }, [pipelineRows]);

  const tasksFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => (t.title ?? "").toLowerCase().includes(q));
  }, [search, tasks]);

  return (
    <div className={pageCardCls() + " p-8"}>
      <div className="mb-6">
        <h3 className={pageTitleCls()}>CRM 客户管理</h3>
        <p className={pageDescCls()}>客户360档案 · 商机漏斗 · 跟进任务 · 时间线 · 附件</p>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setTab("customers")} className={subTabCls(tab === "customers")}>
              客户
            </button>
            <button type="button" onClick={() => setTab("pipeline")} className={subTabCls(tab === "pipeline")}>
              商机漏斗
            </button>
            <button type="button" onClick={() => setTab("tasks")} className={subTabCls(tab === "tasks")}>
              任务/日程
            </button>
            <button type="button" onClick={() => setTab("files")} className={subTabCls(tab === "files")}>
              附件
            </button>
            <button type="button" onClick={() => setTab("import")} className={subTabCls(tab === "import")}>
              导入/迁移
            </button>
            <button type="button" onClick={() => setTab("legacy")} className={subTabCls(tab === "legacy")}>
              原始询盘
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === "tasks" ? "搜索任务标题" : "搜索邮箱/公司/联系人/国家"}
              className="h-10 w-72 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              className={secondaryButtonCls()}
              onClick={() => {
                if (tab === "customers") loadCustomers();
                if (tab === "pipeline") loadPipeline();
                if (tab === "tasks") loadTasks();
                if (tab === "files") loadCustomers();
              }}
            >
              刷新
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          {String(error).includes("crm_") || String(error).includes("PGRST") ? (
            <div className="mt-2 text-xs text-red-700/80">
              如果提示表不存在，请先在 Supabase 执行 CRM 数据表建表 SQL（脚本稍后会加入到仓库 scripts 目录）。
            </div>
          ) : null}
        </div>
      ) : null}
      {loading ? <div className="mb-6 text-sm text-zinc-500">加载中...</div> : null}

      {tab === "customers" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <div className="grid grid-cols-12 gap-2 bg-zinc-50 px-4 py-3 text-xs font-semibold text-zinc-600">
                <div className="col-span-7">客户</div>
                <div className="col-span-3">状态</div>
                <div className="col-span-2">跟进</div>
              </div>
              <div className="max-h-[65vh] overflow-y-auto">
                {filteredCustomers.length === 0 ? <div className="px-4 py-6 text-sm text-zinc-500">暂无客户</div> : null}
                {filteredCustomers.map((c) => {
                  const ownerEmail = c.owner_admin_id ? admins.find((a) => a.id === c.owner_admin_id)?.email ?? "" : "";
                  const active = c.id === selectedCustomerId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCustomerId(c.id)}
                      className={
                        "grid w-full grid-cols-12 gap-2 border-t border-zinc-200 px-4 py-3 text-left text-sm transition-colors " +
                        (active ? "bg-blue-50/70" : "hover:bg-zinc-50/80")
                      }
                    >
                      <div className="col-span-7 min-w-0">
                        <div className="truncate font-semibold text-zinc-900">{safeText(c.company_name || c.contact_name || c.primary_email)}</div>
                        <div className="truncate text-xs text-zinc-500">{[c.contact_name, c.primary_email, ownerEmail ? `跟进: ${ownerEmail}` : null].filter(Boolean).join(" · ")}</div>
                      </div>
                      <div className="col-span-3">
                        <span className={statusBadgeCls(statusBadgeType(c.status))}>{c.status}</span>
                      </div>
                      <div className="col-span-2 truncate text-xs text-zinc-600">{c.next_follow_up_at ? fmtTime(c.next_follow_up_at) : "-"}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              {!selectedCustomer ? (
                <div className="text-sm text-zinc-500">请选择一个客户查看详情</div>
              ) : (
                <CustomerDetailPanel
                  adminId={adminId}
                  admins={admins}
                  customer={selectedCustomer}
                  onUpdated={async () => {
                    await loadCustomers();
                    setSelectedCustomerId((id) => id);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "pipeline" ? (
        <div className="grid gap-4 lg:grid-cols-6">
          {PIPELINE.map((s) => (
            <div key={s} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-zinc-900">{s}</div>
                <span className={statusBadgeCls(stageBadgeType(s))}>{pipelineByStage[s]?.length ?? 0}</span>
              </div>
              <div className="mt-3 space-y-2">
                {(pipelineByStage[s] ?? []).slice(0, 12).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-left hover:bg-zinc-100"
                    onClick={() => {
                      setTab("customers");
                      setSelectedCustomerId(o.customer_id);
                    }}
                  >
                    <div className="truncate text-sm font-semibold text-zinc-900">{safeText(o.id)}</div>
                    <div className="mt-0.5 truncate text-xs text-zinc-600">
                      {[o.amount != null ? `金额: ${o.amount}` : null, o.probability != null ? `概率: ${o.probability}%` : null].filter(Boolean).join(" · ") || "-"}
                    </div>
                  </button>
                ))}
                {(pipelineByStage[s]?.length ?? 0) > 12 ? <div className="text-xs text-zinc-500">仅显示前 12 条</div> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "tasks" ? (
        <div className="rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 bg-zinc-50 px-4 py-3 text-xs font-semibold text-zinc-600">
            <div className="col-span-5">任务</div>
            <div className="col-span-2">状态</div>
            <div className="col-span-2">截止</div>
            <div className="col-span-3">负责人</div>
          </div>
          {tasksFiltered.length === 0 ? <div className="px-4 py-6 text-sm text-zinc-500">暂无任务</div> : null}
          {tasksFiltered.map((t) => {
            const assignedEmail = t.assigned_admin_id ? admins.find((a) => a.id === t.assigned_admin_id)?.email ?? "" : "";
            return (
              <div key={t.id} className="grid grid-cols-12 gap-2 border-t border-zinc-200 px-4 py-3 text-sm">
                <div className="col-span-5 min-w-0">
                  <div className="truncate font-semibold text-zinc-900">{safeText(t.title)}</div>
                  <div className="truncate text-xs text-zinc-500">{t.customer_id ? `客户: ${t.customer_id}` : "-"}</div>
                </div>
                <div className="col-span-2">
                  <span className={statusBadgeCls(taskBadgeType(t.status))}>{t.status}</span>
                </div>
                <div className="col-span-2 truncate text-sm text-zinc-700">{fmtTime(t.due_at)}</div>
                <div className="col-span-3 truncate text-sm text-zinc-700">{assignedEmail || "未分配"}</div>
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === "files" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="text-sm font-semibold text-zinc-900">附件入口</div>
            <div className="mt-2 text-sm text-zinc-600">附件绑定在客户的时间线里。请到“客户”里打开某个客户，在详情中上传附件。</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="text-sm font-semibold text-zinc-900">快速定位</div>
            <div className="mt-2 text-sm text-zinc-600">你可以用搜索框按邮箱/公司名定位客户，再进入详情查看附件。</div>
          </div>
        </div>
      ) : null}

      {tab === "import" ? <ImportPanel adminId={adminId} onImported={() => loadCustomers()} /> : null}

      {tab === "legacy" ? <AdminCustomerManagement /> : null}
    </div>
  );
}

function CustomerDetailPanel(props: {
  adminId: string | null;
  admins: AdminUser[];
  customer: CrmCustomerRow;
  onUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<CustomerStatus>("new");
  const [ownerId, setOwnerId] = useState<string>("");
  const [nextFollowUp, setNextFollowUp] = useState<string>("");
  const [note, setNote] = useState("");

  const [opps, setOpps] = useState<CrmOpportunityRow[]>([]);
  const [tasks, setTasks] = useState<CrmTaskRow[]>([]);
  const [activities, setActivities] = useState<CrmActivityRow[]>([]);
  const [files, setFiles] = useState<CrmFileRow[]>([]);

  const [panelTab, setPanelTab] = useState<"timeline" | "opps" | "tasks" | "files">("timeline");

  const [createTaskTitle, setCreateTaskTitle] = useState("");
  const [createTaskDueAt, setCreateTaskDueAt] = useState("");
  const [createOppAmount, setCreateOppAmount] = useState("");
  const [createOppProb, setCreateOppProb] = useState("");
  const [createOppCloseAt, setCreateOppCloseAt] = useState("");

  useEffect(() => {
    setLocalStatus(props.customer.status);
    setOwnerId(props.customer.owner_admin_id ?? "");
    setNextFollowUp(toDateTimeLocalValue(props.customer.next_follow_up_at));
    setNote("");
  }, [props.customer]);

  async function loadDetail() {
    setLoading(true);
    setErr(null);
    try {
      const cid = props.customer.id;
      const [o, t, a, f] = await Promise.all([
        supabase.from("crm_opportunities").select("*").eq("customer_id", cid).order("updated_at", { ascending: false }),
        supabase.from("crm_tasks").select("*").eq("customer_id", cid).order("due_at", { ascending: true, nullsFirst: false }),
        supabase.from("crm_activities").select("*").eq("customer_id", cid).order("created_at", { ascending: false }),
        supabase.from("crm_files").select("*").eq("customer_id", cid).order("created_at", { ascending: false }),
      ]);

      if (o.error) throw o.error;
      if (t.error) throw t.error;
      if (a.error) throw a.error;
      if (f.error) throw f.error;

      setOpps((o.data ?? []) as CrmOpportunityRow[]);
      setTasks((t.data ?? []) as CrmTaskRow[]);
      setActivities((a.data ?? []) as CrmActivityRow[]);
      setFiles((f.data ?? []) as CrmFileRow[]);
    } catch (e2: unknown) {
      setErr(e2 instanceof Error ? e2.message : "加载失败");
      setOpps([]);
      setTasks([]);
      setActivities([]);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.customer.id]);

  async function saveCustomer() {
    setLoading(true);
    setErr(null);
    try {
      const { error } = await supabase
        .from("crm_customers")
        .update({
          status: localStatus,
          owner_admin_id: ownerId || null,
          next_follow_up_at: fromDateTimeLocalValue(nextFollowUp),
        })
        .eq("id", props.customer.id);
      if (error) throw error;

      const changes: Array<{ type: CrmActivityRow["type"]; content: string }> = [];
      if (props.customer.status !== localStatus) changes.push({ type: "status_change", content: `客户状态: ${props.customer.status} → ${localStatus}` });
      if ((props.customer.owner_admin_id ?? null) !== (ownerId || null)) {
        const toEmail = ownerId ? props.admins.find((a) => a.id === ownerId)?.email ?? ownerId : "未分配";
        changes.push({ type: "assignment", content: `负责人: ${toEmail}` });
      }
      if ((props.customer.next_follow_up_at ?? null) !== (fromDateTimeLocalValue(nextFollowUp) ?? null)) {
        changes.push({ type: "task", content: `设置下次跟进: ${nextFollowUp ? fmtTime(fromDateTimeLocalValue(nextFollowUp)) : "-"}` });
      }

      if (changes.length > 0) {
        const { error: e2 } = await supabase.from("crm_activities").insert(
          changes.map((x) => ({
            customer_id: props.customer.id,
            opportunity_id: null,
            type: x.type,
            content: x.content,
            created_by_admin_id: props.adminId,
          }))
        );
        if (e2) throw e2;
      }

      await Promise.all([loadDetail(), props.onUpdated()]);
    } catch (e2: unknown) {
      setErr(e2 instanceof Error ? e2.message : "保存失败");
    } finally {
      setLoading(false);
    }
  }

  async function addNote(e: FormEvent) {
    e.preventDefault();
    const v = note.trim();
    if (!v) return;
    setLoading(true);
    setErr(null);
    try {
      const { error } = await supabase.from("crm_activities").insert({
        customer_id: props.customer.id,
        opportunity_id: null,
        type: "note",
        content: v,
        created_by_admin_id: props.adminId,
      });
      if (error) throw error;
      setNote("");
      await loadDetail();
      props.onUpdated();
    } catch (e2: unknown) {
      setErr(e2 instanceof Error ? e2.message : "记录失败");
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(file: File) {
    if (!file) return;
    setLoading(true);
    setErr(null);
    try {
      const ext = file.name.includes(".") ? file.name.split(".").pop() ?? "" : "";
      const base = file.name.replace(/ /g, "_").replace(/\//g, "_");
      const fname = ext ? `${crypto.randomUUID()}.${ext}` : crypto.randomUUID();
      const storagePath = `${props.customer.id}/${Date.now()}_${fname}_${base}`;

      const { error: upErr } = await supabase.storage.from("crm-files").upload(storagePath, file, { upsert: false });
      if (upErr) throw upErr;

      const { data: act, error: actErr } = await supabase
        .from("crm_activities")
        .insert({
          customer_id: props.customer.id,
          opportunity_id: null,
          type: "file",
          content: file.name,
          created_by_admin_id: props.adminId,
        })
        .select("*")
        .single();
      if (actErr) throw actErr;

      const { error: insErr } = await supabase.from("crm_files").insert({
        customer_id: props.customer.id,
        opportunity_id: null,
        activity_id: act?.id ?? null,
        bucket: "crm-files",
        path: storagePath,
        file_name: file.name,
        file_type: file.type || null,
        file_size: Number.isFinite(file.size) ? file.size : null,
        uploaded_by_admin_id: props.adminId,
      } satisfies Omit<CrmFileRow, "id" | "created_at">);
      if (insErr) throw insErr;

      await loadDetail();
      props.onUpdated();
    } catch (e2: unknown) {
      setErr(e2 instanceof Error ? e2.message : "上传失败");
    } finally {
      setLoading(false);
    }
  }

  async function createTask(e: FormEvent) {
    e.preventDefault();
    const title = createTaskTitle.trim();
    if (!title) return;
    setLoading(true);
    setErr(null);
    try {
      const { error } = await supabase.from("crm_tasks").insert({
        customer_id: props.customer.id,
        opportunity_id: null,
        title,
        due_at: fromDateTimeLocalValue(createTaskDueAt),
        status: "todo",
        assigned_admin_id: ownerId || null,
        created_by_admin_id: props.adminId,
      } satisfies Omit<CrmTaskRow, "id" | "created_at" | "updated_at">);
      if (error) throw error;

      setCreateTaskTitle("");
      setCreateTaskDueAt("");

      const { error: e2 } = await supabase.from("crm_activities").insert({
        customer_id: props.customer.id,
        opportunity_id: null,
        type: "task",
        content: `创建任务: ${title}`,
        created_by_admin_id: props.adminId,
      });
      if (e2) throw e2;

      await loadDetail();
      props.onUpdated();
    } catch (e2: unknown) {
      setErr(e2 instanceof Error ? e2.message : "创建失败");
    } finally {
      setLoading(false);
    }
  }

  async function createOpportunity(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const amount = createOppAmount.trim() ? Number(createOppAmount.trim()) : null;
      const prob = createOppProb.trim() ? Number(createOppProb.trim()) : null;
      const expectedCloseAt = fromDateTimeLocalValue(createOppCloseAt);
      if (createOppAmount.trim() && Number.isNaN(amount)) throw new Error("金额格式不正确");
      if (createOppProb.trim() && (Number.isNaN(prob) || prob < 0 || prob > 100)) throw new Error("概率需为 0-100");

      const { error } = await supabase.from("crm_opportunities").insert({
        customer_id: props.customer.id,
        inquiry_id: null,
        stage: "lead",
        amount,
        probability: prob,
        expected_close_at: expectedCloseAt,
        assigned_admin_id: ownerId || null,
        priority: "normal",
      } satisfies Omit<CrmOpportunityRow, "id" | "created_at" | "updated_at">);
      if (error) throw error;

      setCreateOppAmount("");
      setCreateOppProb("");
      setCreateOppCloseAt("");

      await loadDetail();
      props.onUpdated();
    } catch (e2: unknown) {
      setErr(e2 instanceof Error ? e2.message : "创建失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-lg font-bold text-zinc-900">{safeText(props.customer.company_name || props.customer.contact_name || props.customer.primary_email)}</div>
          <div className="mt-1 truncate text-sm text-zinc-500">
            {[props.customer.contact_name, props.customer.primary_email, props.customer.whatsapp, props.customer.country_region].filter(Boolean).join(" · ")}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={statusBadgeCls(statusBadgeType(localStatus))}>{localStatus}</span>
            <span className="text-xs text-zinc-500">最近活动：{fmtTime(props.customer.last_activity_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className={secondaryButtonCls()} onClick={() => loadDetail()} disabled={loading}>
            刷新详情
          </button>
          <button type="button" className={primaryButtonCls()} onClick={() => saveCustomer()} disabled={loading}>
            保存档案
          </button>
        </div>
      </div>

      {err ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div> : null}
      {loading ? <div className="mt-4 text-sm text-zinc-500">处理中...</div> : null}

      <div className="mt-5 grid gap-4 md:grid-cols-3">
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
          <span className="text-xs font-semibold text-zinc-600">负责人</span>
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
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3">
        <button type="button" className={subTabCls(panelTab === "timeline")} onClick={() => setPanelTab("timeline")}>
          时间线
        </button>
        <button type="button" className={subTabCls(panelTab === "opps")} onClick={() => setPanelTab("opps")}>
          商机
        </button>
        <button type="button" className={subTabCls(panelTab === "tasks")} onClick={() => setPanelTab("tasks")}>
          任务
        </button>
        <button type="button" className={subTabCls(panelTab === "files")} onClick={() => setPanelTab("files")}>
          附件
        </button>
      </div>

      {panelTab === "timeline" ? (
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5">
            <div className="text-sm font-semibold text-zinc-900 mb-3">新增记录</div>
            <form onSubmit={addNote} className="grid gap-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-24 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="记录本次沟通要点、客户需求、下一步动作…"
              />
              <div className="flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700">
                  <input
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadFile(f);
                      e.currentTarget.value = "";
                    }}
                    className="text-xs"
                  />
                </label>
                <button type="submit" disabled={loading} className={smallButtonCls("primary")}>
                  记录
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5">
            <div className="text-sm font-semibold text-zinc-900 mb-3">时间线</div>
            <div className="space-y-2">
              {activities.length === 0 ? <div className="text-sm text-zinc-500">暂无记录</div> : null}
              {activities.map((a) => (
                <div key={a.id} className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold text-zinc-700">{a.type}</div>
                    <div className="text-xs text-zinc-500">{fmtTime(a.created_at)}</div>
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-zinc-900">{safeText(a.content)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {panelTab === "opps" ? (
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5">
            <div className="text-sm font-semibold text-zinc-900 mb-3">新建商机</div>
            <form onSubmit={createOpportunity} className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-zinc-600">预计金额</span>
                  <input
                    value={createOppAmount}
                    onChange={(e) => setCreateOppAmount(e.target.value)}
                    className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="例如 50000"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-zinc-600">成交概率(0-100)</span>
                  <input
                    value={createOppProb}
                    onChange={(e) => setCreateOppProb(e.target.value)}
                    className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="例如 30"
                  />
                </label>
              </div>
              <label className="grid gap-1">
                <span className="text-xs font-semibold text-zinc-600">预计成交时间</span>
                <input
                  type="datetime-local"
                  value={createOppCloseAt}
                  onChange={(e) => setCreateOppCloseAt(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
              <button type="submit" disabled={loading} className={primaryButtonCls()}>
                创建
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5">
            <div className="text-sm font-semibold text-zinc-900 mb-3">商机列表</div>
            <div className="space-y-2">
              {opps.length === 0 ? <div className="text-sm text-zinc-500">暂无商机</div> : null}
              {opps.map((o) => (
                <div key={o.id} className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate font-semibold text-zinc-900">{safeText(o.id)}</div>
                    <span className={statusBadgeCls(stageBadgeType(o.stage))}>{o.stage}</span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-600">
                    {[o.amount != null ? `金额: ${o.amount}` : null, o.probability != null ? `概率: ${o.probability}%` : null, o.expected_close_at ? `预计: ${fmtTime(o.expected_close_at)}` : null]
                      .filter(Boolean)
                      .join(" · ") || "-"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {panelTab === "tasks" ? (
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5">
            <div className="text-sm font-semibold text-zinc-900 mb-3">新建任务</div>
            <form onSubmit={createTask} className="grid gap-3">
              <label className="grid gap-1">
                <span className="text-xs font-semibold text-zinc-600">标题</span>
                <input
                  value={createTaskTitle}
                  onChange={(e) => setCreateTaskTitle(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="例如：跟客户确认付款方式"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-semibold text-zinc-600">截止时间</span>
                <input
                  type="datetime-local"
                  value={createTaskDueAt}
                  onChange={(e) => setCreateTaskDueAt(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
              <button type="submit" disabled={loading} className={primaryButtonCls()}>
                创建
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5">
            <div className="text-sm font-semibold text-zinc-900 mb-3">任务列表</div>
            <div className="space-y-2">
              {tasks.length === 0 ? <div className="text-sm text-zinc-500">暂无任务</div> : null}
              {tasks.map((t) => (
                <div key={t.id} className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate font-semibold text-zinc-900">{safeText(t.title)}</div>
                    <span className={statusBadgeCls(taskBadgeType(t.status))}>{t.status}</span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-600">{[t.due_at ? `截止: ${fmtTime(t.due_at)}` : null].filter(Boolean).join(" · ") || "-"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {panelTab === "files" ? (
        <div className="mt-5 rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5">
          <div className="text-sm font-semibold text-zinc-900 mb-3">附件列表</div>
          <div className="space-y-2">
            {files.length === 0 ? <div className="text-sm text-zinc-500">暂无附件</div> : null}
            {files.map((f) => (
              <div key={f.id} className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate font-semibold text-zinc-900">{safeText(f.file_name)}</div>
                  <div className="text-xs text-zinc-500">{fmtTime(f.created_at)}</div>
                </div>
                <div className="mt-1 text-xs text-zinc-600">{safeText(f.path)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ImportPanel(props: { adminId: string | null; onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [limit, setLimit] = useState("100");

  async function importRecentInquiries() {
    const n = Number(limit.trim() || "100");
    if (!Number.isFinite(n) || n <= 0) {
      setErr("条数不正确");
      return;
    }

    setBusy(true);
    setErr(null);
    setLog([]);
    try {
      const { data: inquiries, error: e1 } = await supabase
        .from("inquiries")
        .select("id, inquiry_no, email, company_name, contact_name, whatsapp, country_region, destination_port, incoterm, total_quantity, need_by, note, created_at")
        .order("created_at", { ascending: false })
        .limit(n);
      if (e1) throw e1;

      const rows = (inquiries ?? []) as any[];
      let ok = 0;
      let skipped = 0;
      for (const it of rows) {
        const email = String(it.email ?? "").trim().toLowerCase();
        if (!email) {
          skipped++;
          continue;
        }

        const { data: existing, error: eFind } = await supabase
          .from("crm_customers")
          .select("*")
          .eq("primary_email", email)
          .maybeSingle();
        if (eFind) throw eFind;

        let customerId = existing?.id as string | undefined;
        if (!customerId) {
          const { data: created, error: eIns } = await supabase
            .from("crm_customers")
            .insert({
              primary_email: email,
              company_name: it.company_name ?? null,
              contact_name: it.contact_name ?? null,
              whatsapp: it.whatsapp ?? null,
              country_region: it.country_region ?? null,
              status: "new",
              owner_admin_id: null,
              next_follow_up_at: null,
              last_activity_at: it.created_at ?? null,
            })
            .select("*")
            .single();
          if (eIns) throw eIns;
          customerId = created.id;
        } else {
          const patch: Partial<CrmCustomerRow> = {};
          if (!existing.company_name && it.company_name) patch.company_name = it.company_name;
          if (!existing.contact_name && it.contact_name) patch.contact_name = it.contact_name;
          if (!existing.whatsapp && it.whatsapp) patch.whatsapp = it.whatsapp;
          if (!existing.country_region && it.country_region) patch.country_region = it.country_region;
          if (!existing.last_activity_at && it.created_at) patch.last_activity_at = it.created_at;
          if (Object.keys(patch).length > 0) {
            const { error: eUp } = await supabase.from("crm_customers").update(patch).eq("id", customerId);
            if (eUp) throw eUp;
          }
        }

        const { data: existsOpp, error: eOppFind } = await supabase
          .from("crm_opportunities")
          .select("id")
          .eq("inquiry_id", it.id)
          .maybeSingle();
        if (eOppFind) throw eOppFind;

        if (!existsOpp?.id) {
          const { error: eOppIns } = await supabase.from("crm_opportunities").insert({
            customer_id: customerId,
            inquiry_id: it.id,
            stage: "lead",
            amount: null,
            probability: null,
            expected_close_at: null,
            assigned_admin_id: null,
            priority: "normal",
          } satisfies Omit<CrmOpportunityRow, "id" | "created_at" | "updated_at">);
          if (eOppIns) throw eOppIns;

          const content = [
            `询盘号: ${safeText(it.inquiry_no)}`,
            `公司: ${safeText(it.company_name)}`,
            `联系人: ${safeText(it.contact_name)}`,
            `邮箱: ${safeText(it.email)}`,
            `WhatsApp: ${safeText(it.whatsapp)}`,
            `国家/地区: ${safeText(it.country_region)}`,
            `目的港: ${safeText(it.destination_port)}`,
            `Incoterm: ${safeText(it.incoterm)}`,
            `总数量: ${it.total_quantity != null ? it.total_quantity : "-"}`,
            `需求时间: ${safeText(it.need_by)}`,
            `客户备注: ${safeText(it.note)}`,
          ].join("\n");

          const { error: eAct } = await supabase.from("crm_activities").insert({
            customer_id: customerId,
            opportunity_id: null,
            type: "inquiry",
            content,
            created_by_admin_id: props.adminId,
            created_at: it.created_at ?? undefined,
          } as any);
          if (eAct) throw eAct;
        }

        ok++;
        if (ok % 10 === 0) setLog((s) => [...s, `已处理 ${ok}/${rows.length}`]);
      }

      setLog((s) => [...s, `完成：成功 ${ok}，跳过 ${skipped}`]);
      props.onImported();
    } catch (e2: unknown) {
      setErr(e2 instanceof Error ? e2.message : "导入失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-bold text-zinc-900">导入/迁移</div>
          <div className="mt-1 text-sm text-zinc-500">从现有 inquiries 表导入到 CRM（按邮箱唯一归并客户）。</div>
        </div>
        <button type="button" className={primaryButtonCls()} onClick={() => setOpen(true)}>
          开始导入
        </button>
      </div>

      <Modal open={open} onClose={() => (busy ? null : setOpen(false))} className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex max-h-[calc(100vh-6rem)] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-4">
            <div className="min-w-0">
              <div className="truncate text-lg font-bold text-zinc-900">导入询盘到 CRM</div>
              <div className="mt-0.5 truncate text-sm text-zinc-500">会创建客户、商机、并写入一条“询盘原文”时间线。</div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className={secondaryButtonCls()}>
                关闭
              </button>
              <button type="button" onClick={() => importRecentInquiries()} disabled={busy} className={primaryButtonCls()}>
                {busy ? "导入中..." : "执行导入"}
              </button>
            </div>
          </div>

          <div className="premium-scroll overflow-y-auto px-6 py-6">
            {err ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div> : null}

            <label className="grid gap-1">
              <span className="text-xs font-semibold text-zinc-600">导入最近 N 条询盘</span>
              <input
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>

            <div className="mt-4 space-y-2">
              {log.length === 0 ? <div className="text-sm text-zinc-500">等待执行…</div> : null}
              {log.map((x, idx) => (
                <div key={idx} className="text-sm text-zinc-700">
                  {x}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
