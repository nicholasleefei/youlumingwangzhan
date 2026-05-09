import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";

// 数据库迁移SQL脚本
const migrationSQL = `
-- ============================================
-- 车型展示资源表
-- ============================================
create table if not exists model_resources (
  id uuid primary key default gen_random_uuid(),
  model_id text,
  model_jm_id integer not null,
  series_id text,
  series_jm_id integer not null,
  brand_id text,
  brand_jm_id integer not null,
  resource_type text not null check (resource_type in ('vr_exterior', 'vr_interior', 'official', 'exterior', 'interior')),
  image_url text not null,
  order_index integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 创建索引
create index if not exists idx_model_resources_model_jm_id on model_resources(model_jm_id);
create index if not exists idx_model_resources_resource_type on model_resources(resource_type);
create index if not exists idx_model_resources_brand_jm_id on model_resources(brand_jm_id);
create index if not exists idx_model_resources_series_jm_id on model_resources(series_jm_id);

-- 创建更新时间触发器函数
create or replace function update_model_resources_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 删除已存在的触发器（如果存在）
drop trigger if exists model_resources_updated_at on model_resources;

-- 创建触发器
create trigger model_resources_updated_at
before update on model_resources
for each row
execute function update_model_resources_timestamp();

-- 添加注释
comment on table model_resources is '车型展示资源表';
comment on column model_resources.resource_type is '资源类型: vr_exterior-外观VR图集, vr_interior-内饰VR图集, official-官方图集, exterior-外观图集, interior-内饰图集';
comment on column model_resources.order_index is '排序索引，数字越小越靠前';

-- ============================================
-- 知识库表
-- ============================================
create table if not exists knowledge_base (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content_type text not null check (content_type in ('text', 'file')),
  content text,
  file_url text,
  file_name text,
  file_size integer,
  file_type text,
  category text,
  tags text[],
  is_active boolean default true,
  embedding vector(1536),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 创建索引
create index if not exists idx_knowledge_base_content_type on knowledge_base(content_type);
create index if not exists idx_knowledge_base_category on knowledge_base(category);
create index if not exists idx_knowledge_base_is_active on knowledge_base(is_active);
create index if not exists idx_knowledge_base_embedding on knowledge_base using hnsw (embedding vector_cosine_ops);

-- 创建更新时间触发器函数
create or replace function update_knowledge_base_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 删除已存在的触发器（如果存在）
drop trigger if exists knowledge_base_updated_at on knowledge_base;

-- 创建触发器
create trigger knowledge_base_updated_at
before update on knowledge_base
for each row
execute function update_knowledge_base_timestamp();

-- 添加注释
comment on table knowledge_base is '知识库表';
comment on column knowledge_base.content_type is '内容类型: text-文字资料, file-文件资料';
comment on column knowledge_base.content is '文字内容（当content_type为text时）';
comment on column knowledge_base.file_url is '文件URL（当content_type为file时）';
comment on column knowledge_base.file_name is '文件名';
comment on column knowledge_base.file_size is '文件大小（字节）';
comment on column knowledge_base.file_type is '文件MIME类型';
comment on column knowledge_base.category is '分类';
comment on column knowledge_base.tags is '标签数组';
comment on column knowledge_base.embedding is '向量嵌入（1536维，OpenAI text-embedding-ada-002）';
`;

export default function AdminDatabaseMigration() {
  const [supabaseUrl, setSupabaseUrl] = useState<string>("");
  const [serviceRoleKey, setServiceRoleKey] = useState<string>("");
  const [databasePassword, setDatabasePassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [log, setLog] = useState<string[]>([]);
  const [success, setSuccess] = useState<boolean>(false);
  const [hasConfig, setHasConfig] = useState<boolean>(false);

  // 加载保存的配置
  useEffect(() => {
    const savedUrl = localStorage.getItem('supabase_url');
    const savedKey = localStorage.getItem('supabase_service_key');
    const savedDbPassword = localStorage.getItem('supabase_db_password');

    if (savedUrl) setSupabaseUrl(savedUrl);
    if (savedKey) setServiceRoleKey(savedKey);
    if (savedDbPassword) setDatabasePassword(savedDbPassword);

    if (savedUrl && savedKey) {
      setHasConfig(true);
      addLog("✓ 已加载保存的Supabase配置");
    }
  }, []);

  // 添加日志
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // 保存配置
  const saveConfig = () => {
    if (!supabaseUrl || !serviceRoleKey) {
      addLog("✗ 错误: 请填写完整的Supabase配置信息");
      return;
    }

    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_service_key', serviceRoleKey);
    if (databasePassword) {
      localStorage.setItem('supabase_db_password', databasePassword);
    }

    setHasConfig(true);
    addLog("✓ 配置已保存到本地浏览器");
  };

  // 执行迁移
  const executeMigration = async () => {
    if (!hasConfig) {
      addLog("✗ 错误: 请先保存Supabase配置");
      return;
    }

    setLoading(true);
    setSuccess(false);
    setLog([]);
    addLog("开始执行数据库迁移...");
    addLog("=" .repeat(50));

    try {
      // 通过Supabase的REST API执行SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ sql_query: migrationSQL })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      addLog("✓ SQL执行成功!");
      addLog("");
      addLog("已创建的表: model_resources");
      addLog("已创建的索引:");
      addLog("  - idx_model_resources_model_jm_id");
      addLog("  - idx_model_resources_resource_type");
      addLog("  - idx_model_resources_brand_jm_id");
      addLog("  - idx_model_resources_series_jm_id");
      addLog("已创建的触发器: model_resources_updated_at");
      addLog("");
      addLog("=" .repeat(50));
      addLog("✓ 数据库迁移完成!");
      addLog("✓ 现在可以使用展示资源配置功能了!");
      setSuccess(true);

    } catch (error) {
      console.error('Migration error:', error);
      addLog("");
      addLog("✗ 执行失败!");
      addLog(`错误信息: ${error instanceof Error ? error.message : '未知错误'}`);
      addLog("");
      addLog("请检查:");
      addLog("1. Supabase URL是否正确");
      addLog("2. Service Role Key是否有效");
      addLog("3. 网络连接是否正常");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  // 清理日志
  const clearLog = () => {
    setLog([]);
    setSuccess(false);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-xl font-bold text-zinc-900 mb-2">
          数据库结构更新（Supabase 同步）
        </h2>
        <p className="text-sm text-zinc-600">
          本页面用于执行数据库迁移SQL，创建展示资源配置所需的表结构。请谨慎操作。
        </p>
      </div>

      {/* 配置区域 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-zinc-900 mb-4">Supabase 配置</h3>
        
        <div className="space-y-4">
          {/* Supabase URL */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Supabase URL
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xxxxx.supabase.co"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Service Role Key */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Supabase Service Role Key
            </label>
            <input
              type="password"
              value={serviceRoleKey}
              onChange={(e) => setServiceRoleKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-zinc-500">
              请在Supabase控制台 → Settings → API 中获取 Service Role 密钥
            </p>
          </div>

          {/* 数据库密码（可选） */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              数据库密码（可选）
            </label>
            <input
              type="password"
              value={databasePassword}
              onChange={(e) => setDatabasePassword(e.target.value)}
              placeholder="用于直接连接PostgreSQL"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-zinc-500">
              如使用直接数据库连接，请填写数据库密码
            </p>
          </div>

          {/* 保存按钮 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveConfig}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              保存配置
            </button>
            {hasConfig && (
              <span className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
                ✓ 配置已保存
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 执行区域 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-zinc-900 mb-4">执行迁移</h3>
        
        {/* 迁移SQL预览 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            迁移SQL脚本预览
          </label>
          <textarea
            readOnly
            value={migrationSQL}
            rows={10}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700"
          />
          <p className="mt-2 text-xs text-zinc-500">
            此SQL脚本将创建 model_resources 表及相关索引和触发器
          </p>
        </div>

        {/* 执行按钮 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={executeMigration}
            disabled={loading || !hasConfig}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                执行中...
              </>
            ) : (
              "更新数据库结构"
            )}
          </button>
          
          <button
            type="button"
            onClick={clearLog}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            清空日志
          </button>
        </div>

        {/* 执行日志 */}
        {log.length > 0 && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              执行日志
            </label>
            <div className={`rounded-lg border p-4 font-mono text-xs overflow-auto max-h-96 ${
              success 
                ? 'border-green-200 bg-green-50 text-green-800' 
                : 'border-red-200 bg-red-50 text-red-800'
            }`}>
              {log.map((line, index) => (
                <div key={index} className="whitespace-pre-wrap">{line}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 注意事项 */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h4 className="font-semibold text-amber-800 mb-2">⚠️ 注意事项</h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• 本页面仅管理员可见，用于执行数据库结构更新</li>
          <li>• 配置信息保存在本地浏览器中，不会发送到任何外部服务器</li>
          <li>• SQL脚本只执行建表、加字段等安全操作，不会删除数据</li>
          <li>• 执行前会自动判断表是否已存在，避免重复创建报错</li>
          <li>• 建议在执行前备份重要数据</li>
        </ul>
      </div>
    </div>
  );
}
