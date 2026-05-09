import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { primaryButtonCls } from "@/admin/AdminApp";

type AdminUser = {
  id: string;
  email: string;
  is_super_admin: boolean;
  is_approved: boolean;
  approved_by: string | null;
  created_at: string;
};

export default function AdminApproval() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminUser[]>([]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false });
      if (qErr) throw qErr;
      setItems((data ?? []) as AdminUser[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function approveUser(id: string) {
    if (!confirm("确定批准这个管理员账号吗？")) return;
    setLoading(true);
    setError(null);
    try {
      const { error: upErr } = await supabase
        .from("admin_users")
        .update({ is_approved: true })
        .eq("id", id);
      if (upErr) throw upErr;
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "批准失败");
    } finally {
      setLoading(false);
    }
  }

  async function revokeUser(id: string) {
    if (!confirm("确定撤销这个管理员账号的权限吗？")) return;
    setLoading(true);
    setError(null);
    try {
      const { error: upErr } = await supabase
        .from("admin_users")
        .update({ is_approved: false })
        .eq("id", id);
      if (upErr) throw upErr;
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "撤销失败");
    } finally {
      setLoading(false);
    }
  }

  async function toggleSuper(id: string, current: boolean) {
    setLoading(true);
    setError(null);
    try {
      const { error: upErr } = await supabase
        .from("admin_users")
        .update({ is_super_admin: !current })
        .eq("id", id);
      if (upErr) throw upErr;
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold text-zinc-900">管理员审批</div>
        <button
          type="button"
          onClick={refresh}
          className={primaryButtonCls()}
          disabled={loading}
        >
          {loading ? "加载中..." : "刷新"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-base text-zinc-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600"></div>
          <span>加载中...</span>
        </div>
      ) : null}
      {error ? (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-base text-red-700">
          {error}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-8 text-center text-base text-zinc-600">
          暂无管理员数据
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/60 shadow-sm">
          <div className="grid grid-cols-12 gap-2 bg-gradient-to-r from-zinc-50 to-zinc-100 px-4 py-3 text-xs font-semibold text-zinc-600">
            <div className="col-span-4">邮箱</div>
            <div className="col-span-2 text-center">超级管理员</div>
            <div className="col-span-2 text-center">已批准</div>
            <div className="col-span-2">创建时间</div>
            <div className="col-span-2">操作</div>
          </div>
          {items.map((it) => (
            <div
              key={it.id}
              className="grid w-full grid-cols-12 gap-2 border-t border-zinc-200/60 px-4 py-3 text-left text-sm hover:bg-zinc-50/80 transition-colors duration-200"
            >
              <div className="col-span-4 truncate text-base text-zinc-900">{it.email}</div>
              <div className="col-span-2 text-center">
                <button
                  type="button"
                  onClick={() => toggleSuper(it.id, it.is_super_admin)}
                  className={"inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold border transition-colors duration-200 " +
                    (it.is_super_admin
                      ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                      : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200")
                  }
                >
                  {it.is_super_admin ? "是" : "否"}
                </button>
              </div>
              <div className="col-span-2 text-center">
                <span
                  className={"inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold border " +
                    (it.is_approved
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-amber-100 text-amber-800 border-amber-200")
                  }
                >
                  {it.is_approved ? "已批准" : "待审批"}
                </span>
              </div>
              <div className="col-span-2 truncate text-sm text-zinc-600">
                {new Date(it.created_at).toLocaleString("zh-CN")}
              </div>
              <div className="col-span-2 flex gap-2">
                {!it.is_approved ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => approveUser(it.id)}
                    className="h-8 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-3 text-xs font-semibold text-white shadow-sm shadow-green-500/20 hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50"
                  >
                    批准
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => revokeUser(it.id)}
                    className="h-8 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3 text-xs font-semibold text-white shadow-sm shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700 transition-all duration-200 disabled:opacity-50"
                  >
                    撤销
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
