import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { ParamGroup } from "@/utils/paramFlatten";

type Props = {
  open: boolean;
  title: string;
  /** 多车型分组参数: [{ modelName, groups }] */
  sections: Array<{ modelName: string; groups: ParamGroup[] }>;
  onClose: () => void;
};

/** 分组配色：每个分组一个主题色 */
const GROUP_COLORS: Record<string, { accent: string; bg: string; border: string; text: string }> = {
  "基本参数": { accent: "bg-blue-500", bg: "bg-blue-50/60", border: "border-blue-200", text: "text-blue-700" },
  "车身尺寸": { accent: "bg-emerald-500", bg: "bg-emerald-50/60", border: "border-emerald-200", text: "text-emerald-700" },
  "发动机/电机": { accent: "bg-orange-500", bg: "bg-orange-50/60", border: "border-orange-200", text: "text-orange-700" },
  "电动系统": { accent: "bg-amber-500", bg: "bg-amber-50/60", border: "border-amber-200", text: "text-amber-700" },
  "变速箱": { accent: "bg-purple-500", bg: "bg-purple-50/60", border: "border-purple-200", text: "text-purple-700" },
  "底盘转向": { accent: "bg-teal-500", bg: "bg-teal-50/60", border: "border-teal-200", text: "text-teal-700" },
  "车轮制动": { accent: "bg-indigo-500", bg: "bg-indigo-50/60", border: "border-indigo-200", text: "text-indigo-700" },
  "颜色": { accent: "bg-pink-500", bg: "bg-pink-50/60", border: "border-pink-200", text: "text-pink-700" },
  "座椅配置": { accent: "bg-cyan-500", bg: "bg-cyan-50/60", border: "border-cyan-200", text: "text-cyan-700" },
  "主动安全": { accent: "bg-red-500", bg: "bg-red-50/60", border: "border-red-200", text: "text-red-700" },
  "被动安全": { accent: "bg-rose-500", bg: "bg-rose-50/60", border: "border-rose-200", text: "text-rose-700" },
  "辅助驾驶硬件": { accent: "bg-sky-500", bg: "bg-sky-50/60", border: "border-sky-200", text: "text-sky-700" },
  "辅助驾驶功能": { accent: "bg-green-500", bg: "bg-green-50/60", border: "border-green-200", text: "text-green-700" },
  "驾驶操控": { accent: "bg-lime-500", bg: "bg-lime-50/60", border: "border-lime-200", text: "text-lime-700" },
  "屏幕/车机系统": { accent: "bg-violet-500", bg: "bg-violet-50/60", border: "border-violet-200", text: "text-violet-700" },
  "智能互联": { accent: "bg-fuchsia-500", bg: "bg-fuchsia-50/60", border: "border-fuchsia-200", text: "text-fuchsia-700" },
  "外部灯光": { accent: "bg-yellow-500", bg: "bg-yellow-50/60", border: "border-yellow-200", text: "text-yellow-700" },
  "外后视镜": { accent: "bg-slate-500", bg: "bg-slate-50/60", border: "border-slate-200", text: "text-slate-700" },
  "天窗/玻璃": { accent: "bg-stone-500", bg: "bg-stone-50/60", border: "border-stone-200", text: "text-stone-700" },
  "音响/氛围灯": { accent: "bg-orange-600", bg: "bg-orange-50/60", border: "border-orange-200", text: "text-orange-700" },
  "空调/冰箱": { accent: "bg-sky-600", bg: "bg-sky-50/60", border: "border-sky-200", text: "text-sky-700" },
  "外观/防盗": { accent: "bg-zinc-500", bg: "bg-zinc-50/60", border: "border-zinc-200", text: "text-zinc-700" },
  "选装包": { accent: "bg-gray-500", bg: "bg-gray-50/60", border: "border-gray-200", text: "text-gray-700" },
  "车内充电": { accent: "bg-yellow-600", bg: "bg-yellow-50/60", border: "border-yellow-200", text: "text-yellow-700" },
};

const FALLBACK_COLOR = { accent: "bg-zinc-400", bg: "bg-zinc-50/60", border: "border-zinc-200", text: "text-zinc-600" };

function groupColor(name: string) {
  return GROUP_COLORS[name] ?? FALLBACK_COLOR;
}

export default function AllParamsModal({ open, title, sections, onClose }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const hasAny = sections.some((s) => s.groups.some((g) => g.items.length > 0));

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  /** 根据搜索词过滤 items */
  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sections.map((section) => ({
      ...section,
      groups: section.groups
        .map((g) => {
          if (!q) return g;
          return {
            ...g,
            items: g.items.filter(
              (it) =>
                it.path.toLowerCase().includes(q) ||
                it.value.toLowerCase().includes(q),
            ),
          };
        })
        .filter((g) => g.items.length > 0),
    }));
  }, [sections, search]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="relative w-full max-w-6xl h-[85vh] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-6 py-4">
        <div className="min-w-0 flex items-center gap-3">
          <h2 className="text-lg font-bold text-zinc-900 truncate">{title}</h2>
          {sections.length > 1 && (
            <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
              {sections.length} {t("model.countModels", { count: sections.length })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            {t("common.close")}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="shrink-0 border-b border-zinc-200 bg-white px-6 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("model.searchParams", "搜索参数...")}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto bg-zinc-50">
        {!hasAny ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-sm text-zinc-500">{t("model.noParamsToShow")}</div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {filteredSections.map((section, si) => {
              const hasGroup = section.groups.some((g) => g.items.length > 0);
              if (!hasGroup) return null;
              return (
                <div key={si}>
                  {sections.length > 1 && (
                    <div className="mb-4 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-5 rounded-full bg-zinc-900" />
                      <h3 className="text-base font-bold text-zinc-800">{section.modelName}</h3>
                    </div>
                  )}
                  <div className="space-y-3">
                    {section.groups.map((group, gi) => {
                      if (group.items.length === 0) return null;
                      const groupKey = `${si}-${gi}-${group.group}`;
                      const collapsed = collapsedGroups.has(groupKey);
                      const color = groupColor(group.group);

                      return (
                        <div
                          key={groupKey}
                          className="rounded-xl border bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                          style={{ borderLeftWidth: group.group ? "4px" : "1px" }}
                        >
                          {/* Group header */}
                          {group.group && (
                            <button
                              type="button"
                              onClick={() => toggleGroup(groupKey)}
                              className={`w-full flex items-center justify-between gap-2 px-5 py-3 ${color.bg} ${color.border} border-b transition-colors`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`w-2 h-2 rounded-full ${color.accent}`} />
                                <span className={`text-sm font-semibold ${color.text}`}>
                                  {group.group}
                                </span>
                                <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-zinc-500">
                                  {group.items.length}
                                </span>
                              </div>
                              {collapsed ? (
                                <ChevronDown className="h-4 w-4 text-zinc-400" />
                              ) : (
                                <ChevronUp className="h-4 w-4 text-zinc-400" />
                              )}
                            </button>
                          )}

                          {/* Group items */}
                          {!collapsed && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-100">
                              {group.items.map((it) => (
                                <div
                                  key={it.path}
                                  className="bg-white px-4 py-3 hover:bg-zinc-50/50 transition-colors group"
                                >
                                  <div className="text-[11px] leading-4 text-zinc-400 font-medium tracking-wide uppercase break-all group-hover:text-zinc-500 transition-colors">
                                    {it.path}
                                  </div>
                                  <div className="mt-1 text-sm leading-5 text-zinc-900 font-medium break-words">
                                    {it.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
