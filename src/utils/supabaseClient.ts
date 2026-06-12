import { createClient } from "@supabase/supabase-js";

// 获取环境变量（不需要强制检查）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 如果环境变量缺失，创建一个模拟的 Supabase 客户端
let supabaseInstance: any;
let mockSession: any = null;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "YOUR_SUPABASE_URL" || supabaseAnonKey === "YOUR_SUPABASE_ANON_KEY") {
  supabaseInstance = {
    from: (table: string) => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
      eq: () => Promise.resolve({ data: [], error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      order: () => Promise.resolve({ data: [], error: null }),
    }),
    auth: {
      signInWithPassword: async ({ email, password }: any) => {
        if (import.meta.env.DEV) {
          console.warn("[supabaseClient] Mock auth: 环境变量未配置，无法验证凭据。");
        }
        return { data: null, error: { message: "环境变量未配置，无法登录。请检查 .env 文件。" } };
        return { data: null, error: { message: "Invalid email or password" } };
      },
      signOut: async () => {
        mockSession = null;
        return { error: null };
      },
      getSession: async () => {
        return { data: { session: mockSession } };
      },
      onAuthStateChange: (callback: any) => {
        callback("SIGNED_IN", mockSession);
        return {
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        };
      },
    },
  };
} else {
  // 正常连接到 Supabase
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;

