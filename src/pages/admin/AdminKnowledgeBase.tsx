import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabaseClient";
import {
  pageCardCls,
  pageTitleCls,
  pageDescCls,
  subTabCls,
  primaryButtonCls,
  secondaryButtonCls,
  inputCls,
  labelCls,
  statusBadgeCls,
  smallButtonCls,
} from "@/admin/AdminApp";
import {
  listKnowledgeBase,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  uploadKnowledgeBaseFile,
  listKnowledgeBaseCategories,
  createKnowledgeBaseCategory,
  updateKnowledgeBaseCategory,
  deleteKnowledgeBaseCategory,
  type KnowledgeBaseCategoryRow,
  type KnowledgeBaseRow,
  type KnowledgeBaseInsert,
} from "@/utils/db";

type ViewTab = "list" | "add" | "categories" | "database";
type ContentType = "text" | "file";



function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminKnowledgeBase() {
  const [tab, setTab] = useState<ViewTab>("list");
  const [items, setItems] = useState<KnowledgeBaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<ContentType | "all">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [categories, setCategories] = useState<KnowledgeBaseCategoryRow[]>([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // 表单状态
  const [formData, setFormData] = useState<{
    title: string;
    contentType: ContentType;
    content: string;
    category: string;
    tags: string;
    isActive: boolean;
  }>({
    title: "",
    contentType: "text",
    content: "",
    category: "",
    tags: "",
    isActive: true,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, data] = await Promise.all([
        listKnowledgeBaseCategories(),
        listKnowledgeBase({
          contentType: filterType !== "all" ? filterType : undefined,
          category: filterCategory !== "all" ? filterCategory : undefined,
          search: searchQuery || undefined,
        }),
      ]);
      setCategories(cats);
      setItems(data);
      
      // Update form default category if not set
      setFormData(prev => {
        if (!prev.category && cats.length > 0) {
          return { ...prev, category: cats[0].name };
        }
        return prev;
      });
    } catch (error) {
      console.error("Failed to load knowledge base:", error);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterCategory, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: "",
      contentType: "text",
      content: "",
      category: categories.length > 0 ? categories[0].name : "",
      tags: "",
      isActive: true,
    });
    setSelectedFile(null);
    setEditingId(null);
  };

  // 编辑条目
  const handleEdit = (item: KnowledgeBaseRow) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      contentType: item.content_type,
      content: item.content || "",
      category: item.category || (categories.length > 0 ? categories[0].name : ""),
      tags: item.tags?.join(", ") || "",
      isActive: item.is_active,
    });
    setTab("add");
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert("请输入标题");
      return;
    }

    if (formData.contentType === "text" && !formData.content.trim()) {
      alert("请输入内容");
    }

    if (formData.contentType === "file" && !selectedFile && !editingId) {
      alert("请选择文件");
      return;
    }

    setSubmitting(true);
    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let fileType: string | undefined;
      let embedding: number[] | null = null;

      // 上传文件
      if (formData.contentType === "file" && selectedFile) {
        const result = await uploadKnowledgeBaseFile(selectedFile);
        fileUrl = result.publicUrl;
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
        fileType = selectedFile.type;
      } else if (formData.contentType === "text" && formData.content) {
        // 使用 Supabase Edge Function / Postgres 扩展生成向量
        try {
          const { data, error } = await supabase.functions.invoke('generate-embedding', {
            body: { text: formData.content }
          });
          
          if (error) throw error;
          
          if (data && data.embedding) {
            embedding = data.embedding;
          } else {
            console.warn("Failed to generate embedding: No data returned");
          }
        } catch (e) {
          console.error("Error generating embedding via Supabase:", e);
        }
      }

      const insertData: KnowledgeBaseInsert = {
        title: formData.title,
        content_type: formData.contentType,
        content: formData.contentType === "text" ? formData.content : null,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        category: formData.category,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        is_active: formData.isActive,
        embedding: embedding,
      };

      if (editingId) {
        // 如果没有上传新文件，保留原文件信息
        if (formData.contentType === "file" && !selectedFile) {
          const original = items.find((i) => i.id === editingId);
          insertData.file_url = original?.file_url || undefined;
          insertData.file_name = original?.file_name || undefined;
          insertData.file_size = original?.file_size || undefined;
          insertData.file_type = original?.file_type || undefined;
        }
        await updateKnowledgeBase(editingId, { ...insertData, id: editingId });
        alert("更新成功");
      } else {
        await createKnowledgeBase(insertData);
        alert("创建成功");
      }

      resetForm();
      setTab("list");
      loadData();
    } catch (error) {
      console.error("Failed to save:", error);
      alert("保存失败: " + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // 删除条目
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条记录吗？")) return;
    try {
      await deleteKnowledgeBase(id);
      alert("删除成功");
      loadData();
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("删除失败");
    }
  };

  // 统计数据
  const stats = {
    total: items.length,
    textCount: items.filter((i) => i.content_type === "text").length,
    fileCount: items.filter((i) => i.content_type === "file").length,
    activeCount: items.filter((i) => i.is_active).length,
  };

  const handleAddCategory = async () => {
    if (!categoryInput.trim()) return;
    try {
      const maxSort = categories.reduce((max, c) => Math.max(max, c.sort_order || 0), 0);
      await createKnowledgeBaseCategory({ name: categoryInput.trim(), sort_order: maxSort + 10 });
      setCategoryInput("");
      loadData();
    } catch (e: any) {
      alert("添加失败: " + e.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("确定删除该分类？关联该分类的资料分类将变为空。")) return;
    try {
      await deleteKnowledgeBaseCategory(id);
      loadData();
    } catch (e: any) {
      alert("删除失败: " + e.message);
    }
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    if (!name.trim()) return;
    try {
      await updateKnowledgeBaseCategory(id, { id, name: name.trim() });
      setEditingCategoryId(null);
      loadData();
    } catch (e: any) {
      alert("更新失败: " + e.message);
    }
  };

  return (
    <div className={pageCardCls() + " p-8"}>
      <div className="mb-8">
        <h3 className={pageTitleCls()}>知识库管理</h3>
        <p className={pageDescCls()}>
          管理外贸知识库内容，支持文字型和文件型资料，可自动生成向量用于语义搜索
        </p>
      </div>

      {/* 子标签导航 */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
          <button
            type="button"
            onClick={() => {
              setTab("list");
              resetForm();
            }}
            className={subTabCls(tab === "list")}
          >
            📚 知识列表
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("add");
              resetForm();
            }}
            className={subTabCls(tab === "add")}
          >
            ➕ {editingId ? "编辑内容" : "新增内容"}
          </button>
          <button
            type="button"
            onClick={() => setTab("categories")}
            className={subTabCls(tab === "categories")}
          >
            🏷️ 分类管理
          </button>
          <button
            type="button"
            onClick={() => setTab("database")}
            className={subTabCls(tab === "database")}
          >
            🗄️ 数据库配置
          </button>
        </div>
      </div>

      {/* 列表视图 */}
      {tab === "list" && (
        <div className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-blue-50 to-white p-5">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-zinc-600 mt-1">总条目数</div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-green-50 to-white p-5">
              <div className="text-3xl font-bold text-green-600">{stats.textCount}</div>
              <div className="text-sm text-zinc-600 mt-1">文字资料</div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-purple-50 to-white p-5">
              <div className="text-3xl font-bold text-purple-600">{stats.fileCount}</div>
              <div className="text-sm text-zinc-600 mt-1">文件资料</div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-amber-50 to-white p-5">
              <div className="text-3xl font-bold text-amber-600">{stats.activeCount}</div>
              <div className="text-sm text-zinc-600 mt-1">已启用</div>
            </div>
          </div>

          {/* 筛选和搜索 */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="搜索标题..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={inputCls()}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ContentType | "all")}
              className={inputCls() + " w-40"}
            >
              <option value="all">全部类型</option>
              <option value="text">文字资料</option>
              <option value="file">文件资料</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={inputCls() + " w-40"}
            >
              <option value="all">全部分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setTab("add");
                resetForm();
              }}
              className={primaryButtonCls()}
            >
              ➕ 新增内容
            </button>
          </div>

          {/* 列表 */}
          <div className="rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="bg-gradient-to-r from-zinc-50 to-zinc-100 px-6 py-4 grid grid-cols-12 gap-4 text-sm font-semibold text-zinc-600">
              <div className="col-span-4">标题</div>
              <div className="col-span-2">类型</div>
              <div className="col-span-2">分类</div>
              <div className="col-span-2">更新时间</div>
              <div className="col-span-1">状态</div>
              <div className="col-span-1 text-right">操作</div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-zinc-500">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600"></div>
                <div className="mt-3">加载中...</div>
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                <div className="text-4xl mb-3">📭</div>
                <div>暂无数据</div>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="border-t border-zinc-200 px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-zinc-50 transition-colors"
                >
                  <div className="col-span-4">
                    <div className="font-medium text-zinc-900">{item.title}</div>
                    {item.content_type === "text" && item.content && (
                      <div className="text-xs text-zinc-500 mt-1 line-clamp-1">
                        {item.content.substring(0, 100)}...
                      </div>
                    )}
                    {item.content_type === "file" && item.file_name && (
                      <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                        📎 {item.file_name}
                        {item.file_size && (
                          <span className="text-zinc-400">({formatFileSize(item.file_size)})</span>
                        )}
                      </div>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {item.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span
                      className={statusBadgeCls(
                        item.content_type === "text" ? "info" : "success"
                      )}
                    >
                      {item.content_type === "text" ? "📝 文字" : "📁 文件"}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm text-zinc-600">{item.category || "-"}</div>
                  <div className="col-span-2 text-sm text-zinc-500">{formatDate(item.updated_at)}</div>
                  <div className="col-span-1">
                    <span className={statusBadgeCls(item.is_active ? "success" : "default")}>
                      {item.is_active ? "启用" : "停用"}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className={smallButtonCls("secondary")}
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className={smallButtonCls("danger")}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 新增/编辑表单 */}
      {tab === "add" && (
        <div className="max-w-3xl space-y-6">
          {/* 标题 */}
          <div>
            <label className={labelCls()}>标题 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="请输入资料标题"
              className={inputCls()}
            />
          </div>

          {/* 内容类型 */}
          <div>
            <label className={labelCls()}>内容类型 *</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="contentType"
                  checked={formData.contentType === "text"}
                  onChange={() => setFormData({ ...formData, contentType: "text" })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-zinc-700">📝 文字资料</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="contentType"
                  checked={formData.contentType === "file"}
                  onChange={() => setFormData({ ...formData, contentType: "file" })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-zinc-700">📁 文件资料</span>
              </label>
            </div>
          </div>

          {/* 文字内容 */}
          {formData.contentType === "text" && (
            <div>
              <label className={labelCls()}>文字内容 *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="请输入知识库内容..."
                rows={12}
                className={inputCls() + " resize-none font-mono text-sm"}
              />
              <p className="mt-2 text-xs text-zinc-500">
                提示：上传时会自动生成向量用于语义搜索
              </p>
            </div>
          )}

          {/* 文件上传 */}
          {formData.contentType === "file" && (
            <div>
              <label className={labelCls()}>上传文件 *</label>
              <div className="mt-2 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-4xl mb-3">📤</div>
                  <div className="text-zinc-700 font-medium">
                    {selectedFile ? selectedFile.name : "点击或拖拽上传文件"}
                  </div>
                  {selectedFile && (
                    <div className="text-sm text-zinc-500 mt-1">
                      {formatFileSize(selectedFile.size)}
                    </div>
                  )}
                  {!selectedFile && (
                    <div className="text-sm text-zinc-500 mt-1">
                      支持 PDF、Word、Excel、图片等格式
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* 分类 */}
          <div>
            <label className={labelCls()}>分类</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={inputCls()}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* 标签 */}
          <div>
            <label className={labelCls()}>标签</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="多个标签用逗号分隔，如：丰田, Hilux, 价格"
              className={inputCls()}
            />
          </div>

          {/* 状态 */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-zinc-700">启用此资料</span>
            </label>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={primaryButtonCls() + " min-w-32"}
            >
              {submitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></span>
                  保存中...
                </>
              ) : editingId ? (
                "保存修改"
              ) : (
                "保存并生成向量"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setTab("list");
              }}
              disabled={submitting}
              className={secondaryButtonCls()}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 分类管理 */}
      {tab === "categories" && (
        <div className="max-w-3xl space-y-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              placeholder="输入新分类名称..."
              className={inputCls() + " flex-1"}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategory();
              }}
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className={primaryButtonCls()}
            >
              添加分类
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-white">
            <div className="bg-gradient-to-r from-zinc-50 to-zinc-100 px-6 py-4 grid grid-cols-12 gap-4 text-sm font-semibold text-zinc-600">
              <div className="col-span-8">分类名称</div>
              <div className="col-span-4 text-right">操作</div>
            </div>
            
            {categories.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">暂无分类</div>
            ) : (
              <div className="divide-y divide-zinc-200">
                {categories.map((cat) => (
                  <div key={cat.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-zinc-50">
                    <div className="col-span-8">
                      {editingCategoryId === cat.id ? (
                        <input
                          type="text"
                          defaultValue={cat.name}
                          className={inputCls() + " py-1.5 text-sm"}
                          autoFocus
                          onBlur={(e) => handleUpdateCategory(cat.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateCategory(cat.id, e.currentTarget.value);
                            if (e.key === "Escape") setEditingCategoryId(null);
                          }}
                        />
                      ) : (
                        <span className="font-medium text-zinc-900">{cat.name}</span>
                      )}
                    </div>
                    <div className="col-span-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingCategoryId(cat.id)}
                        className={smallButtonCls("secondary")}
                      >
                        重命名
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className={smallButtonCls("danger")}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 数据库配置 */}
      {tab === "database" && (
        <div className="space-y-6 max-w-4xl">
          {/* 数据库表说明 */}
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-6">
            <h4 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              🗄️ 数据库表结构
            </h4>
            <p className="text-sm text-zinc-600 mb-4">
              知识库使用 Supabase PostgreSQL 存储，支持 pgvector 扩展进行向量相似度搜索。
            </p>
            <div className="bg-zinc-900 rounded-xl p-4 font-mono text-sm text-zinc-100 overflow-x-auto">
              <pre>{`-- 创建知识库表
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'file')),
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  category TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  embedding VECTOR(384),  -- Supabase/gte-small
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_kb_content_type ON knowledge_base(content_type);
CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_kb_is_active ON knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_kb_embedding ON knowledge_base
  USING hnsw (embedding vector_cosine_ops);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_kb_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kb_updated_at ON knowledge_base;
CREATE TRIGGER kb_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_kb_timestamp();`}</pre>
            </div>
          </div>

          {/* 存储桶说明 */}
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-6">
            <h4 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              📦 存储桶配置
            </h4>
            <p className="text-sm text-zinc-600 mb-4">
              需要在 Supabase Storage 中创建名为 <code className="bg-zinc-200 px-2 py-0.5 rounded">knowledge_base</code> 的存储桶。
            </p>
            <div className="bg-zinc-900 rounded-xl p-4 font-mono text-sm text-zinc-100 overflow-x-auto">
              <pre>{`-- 存储桶设置:
-- 1. Bucket Name: knowledge_base
-- 2. Public: true (公开访问)
-- 3. File Size Limit: 100MB

-- 访问策略 (RLS Policy):
CREATE POLICY "Allow public access to knowledge_base files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'knowledge_base');

CREATE POLICY "Allow admin upload to knowledge_base"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'knowledge_base' AND
    auth.role() = 'authenticated'
  );`}</pre>
            </div>
          </div>

          {/* 向量生成说明 */}
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-blue-50 to-white p-6">
            <h4 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              🧠 向量生成配置
            </h4>
            <p className="text-sm text-zinc-600 mb-4">
                使用 Supabase Edge Functions 生成文本向量，无需配置外部 API 密钥，完全免费且直接在数据库端运行。
              </p>
              <div className="space-y-3 text-sm text-zinc-700">
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">1.</span>
                  <div>
                    <strong>模型选择:</strong> Supabase/gte-small (384 维，轻量级本地模型)
                  </div>
                </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">2.</span>
                <div>
                  <strong>触发时机:</strong> 保存文字资料时自动生成
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">3.</span>
                <div>
                  <strong>语义搜索:</strong> 查询时将用户问题转换为向量，使用余弦相似度匹配
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
