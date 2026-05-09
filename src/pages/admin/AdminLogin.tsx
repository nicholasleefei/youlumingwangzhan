import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/utils/supabaseClient";

export default function AdminLogin(props: {
  onSignIn: (email: string, password: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRegister() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { data, error: regErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role: "admin",
          },
        },
      });
      if (regErr) throw regErr;

      if (data.user) {
        const { error: insertErr } = await supabase.from("admin_users").insert({
          id: data.user.id,
          email: email.trim(),
          is_super_admin: false,
          is_approved: false,
        });
        if (insertErr) throw insertErr;
      }

      setMessage("注册成功，请等待超级管理员审批后再登录。");
    } catch (e) {
      setError(e instanceof Error ? e.message : "注册失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="text-lg font-semibold text-zinc-900">{t("admin.title")}</div>
        <div className="mt-1 text-sm text-zinc-400">{t("admin.login.subtitle")}</div>

        <div className="mt-4 flex gap-2 rounded-lg bg-zinc-50 p-1">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); setMessage(null); }}
            className={
              "flex-1 rounded-md px-3 py-1.5 text-sm " +
              (mode === "login" ? "bg-white font-medium text-zinc-900 shadow-sm" : "text-zinc-600")
            }
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(null); setMessage(null); }}
            className={
              "flex-1 rounded-md px-3 py-1.5 text-sm " +
              (mode === "register" ? "bg-white font-medium text-zinc-900 shadow-sm" : "text-zinc-600")
            }
          >
            注册
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-1">
            <span className="text-xs text-zinc-400">{t("admin.email")}</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
              type="email"
              autoComplete="email"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-zinc-400">{t("admin.password")}</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
              type="password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
          </label>
        </div>

        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
        {message ? <div className="mt-4 text-sm text-green-600">{message}</div> : null}

        {mode === "login" ? (
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setError(null);
              setLoading(true);
              try {
                await props.onSignIn(email.trim(), password);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Sign-in failed");
              } finally {
                setLoading(false);
              }
            }}
            className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-amber-500 px-4 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? t("common.signingIn") : t("action.signIn")}
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={handleRegister}
            className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-amber-500 px-4 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? "注册中..." : "注册账号"}
          </button>
        )}
      </div>
    </div>
  );
}
