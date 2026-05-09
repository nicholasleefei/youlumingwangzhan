import { useMemo, useState } from "react";

type Props<Row> = {
  tableName: string;
  selectedIds: string[];
  rows: Row[];
  fields: string[];
  busy?: boolean;
  getLabel?: (field: string) => string;
  getRowId: (row: Row) => string;
  isRowDeleted?: (rowId: string) => boolean;
  onClearSelection: () => void;
  onStageUpdate: (rowId: string, field: string, value: any) => void;
  onToggleDeleteRow: (rowId: string) => void;
  onAddRow?: () => void;
};

function inferValueType(value: any): "number" | "boolean" | "object" | "string" {
  if (value === null || value === undefined) return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "object") return "object";
  return "string";
}

export default function BulkEditBar<Row>({
  tableName,
  selectedIds,
  rows,
  fields,
  busy,
  getLabel,
  getRowId,
  isRowDeleted,
  onClearSelection,
  onStageUpdate,
  onToggleDeleteRow,
  onAddRow,
}: Props<Row>) {
  const [fieldQuery, setFieldQuery] = useState("");
  const filteredFields = useMemo(() => {
    const q = fieldQuery.trim().toLowerCase();
    if (!q) return fields;
    return fields.filter((f) => {
      const label = (getLabel ? getLabel(f) : f).toLowerCase();
      return f.toLowerCase().includes(q) || label.includes(q);
    });
  }, [fieldQuery, fields, getLabel]);

  const [selectedField, setSelectedField] = useState<string>(() => fields[0] || "");
  const [textValue, setTextValue] = useState<string>("");
  const [numberValue, setNumberValue] = useState<string>("");
  const [boolValue, setBoolValue] = useState<string>("true");
  const [setNull, setSetNull] = useState(false);
  const [addCount, setAddCount] = useState<number>(1);

  const selectedRows = useMemo(() => {
    if (selectedIds.length === 0) return [] as Row[];
    const idSet = new Set(selectedIds);
    return rows.filter((r) => idSet.has(getRowId(r)));
  }, [rows, selectedIds, getRowId]);

  const sampleValue = useMemo(() => {
    if (!selectedField) return undefined;
    const first = selectedRows[0] as any;
    if (!first) return undefined;
    return first[selectedField];
  }, [selectedField, selectedRows]);

  const inferredType = useMemo(() => inferValueType(sampleValue), [sampleValue]);

  const effectiveFieldList = useMemo(() => {
    if (!filteredFields.includes(selectedField) && filteredFields.length > 0) {
      return { selectedField: filteredFields[0], filteredFields };
    }
    return { selectedField, filteredFields };
  }, [filteredFields, selectedField]);

  const canApply = selectedIds.length > 0 && !!effectiveFieldList.selectedField;

  function buildValue(): any {
    if (setNull) return null;
    if (inferredType === "number") {
      if (numberValue.trim() === "") return null;
      const n = Number(numberValue);
      return Number.isFinite(n) ? n : null;
    }
    if (inferredType === "boolean") {
      if (boolValue === "null") return null;
      return boolValue === "true";
    }
    if (inferredType === "object") {
      const v = textValue.trim();
      if (v === "") return null;
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    }
    return textValue;
  }

  function applyToSelected() {
    if (!canApply) return;
    const value = buildValue();
    for (const id of selectedIds) {
      if (isRowDeleted && isRowDeleted(id)) continue;
      onStageUpdate(id, effectiveFieldList.selectedField, value);
    }
  }

  function markDeleteSelected(nextDeleted: boolean) {
    if (selectedIds.length === 0) return;
    const ok = window.confirm(nextDeleted ? `将标记删除 ${selectedIds.length} 条记录（未提交前可撤销），是否继续？` : `将撤销 ${selectedIds.length} 条记录的删除标记，是否继续？`);
    if (!ok) return;
    for (const id of selectedIds) {
      const deleted = isRowDeleted ? isRowDeleted(id) : false;
      if (nextDeleted && deleted) continue;
      if (!nextDeleted && !deleted) continue;
      onToggleDeleteRow(id);
    }
  }

  function addRows() {
    if (!onAddRow || busy) return;
    const count = Math.max(1, Math.min(50, Number(addCount) || 1));
    for (let i = 0; i < count; i++) onAddRow();
  }

  return (
    <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-900">批量编辑</div>
          <div className="text-xs text-zinc-600">已选择 {selectedIds.length} 条（表：{tableName}）</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClearSelection}
            disabled={busy || selectedIds.length === 0}
            className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
          >
            清空选择
          </button>
          <button
            type="button"
            onClick={() => markDeleteSelected(true)}
            disabled={busy || selectedIds.length === 0}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            标记删除
          </button>
          <button
            type="button"
            onClick={() => markDeleteSelected(false)}
            disabled={busy || selectedIds.length === 0}
            className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
          >
            撤销删除
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-12">
        <div className="md:col-span-3">
          <input
            type="text"
            value={fieldQuery}
            onChange={(e) => setFieldQuery(e.target.value)}
            placeholder="搜索字段..."
            disabled={busy}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 disabled:bg-zinc-50"
          />
        </div>
        <div className="md:col-span-3">
          <select
            value={effectiveFieldList.selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            disabled={busy || effectiveFieldList.filteredFields.length === 0}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:bg-zinc-50"
          >
            {effectiveFieldList.filteredFields.map((f) => (
              <option key={f} value={f}>
                {getLabel ? `${getLabel(f)} (${f})` : f}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4">
          {inferredType === "boolean" ? (
            <select
              value={boolValue}
              onChange={(e) => setBoolValue(e.target.value)}
              disabled={busy || setNull}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:bg-zinc-50"
            >
              <option value="true">true</option>
              <option value="false">false</option>
              <option value="null">null</option>
            </select>
          ) : inferredType === "number" ? (
            <input
              type="number"
              value={numberValue}
              onChange={(e) => setNumberValue(e.target.value)}
              placeholder="输入数值..."
              disabled={busy || setNull}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 disabled:bg-zinc-50"
            />
          ) : (
            <input
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder={inferredType === "object" ? "输入 JSON（或文本）..." : "输入文本..."}
              disabled={busy || setNull}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 disabled:bg-zinc-50"
            />
          )}
        </div>

        <div className="md:col-span-2 flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-zinc-700 select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              checked={setNull}
              onChange={(e) => setSetNull(e.target.checked)}
              disabled={busy}
            />
            置空
          </label>
          <button
            type="button"
            onClick={applyToSelected}
            disabled={busy || !canApply}
            className="ml-auto rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            应用到已选
          </button>
        </div>
      </div>

      {onAddRow ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="text-xs text-zinc-600">批量新增</div>
          <select
            value={String(addCount)}
            onChange={(e) => setAddCount(Number(e.target.value))}
            disabled={busy}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 disabled:bg-zinc-50"
          >
            <option value={1}>1 行</option>
            <option value={5}>5 行</option>
            <option value={10}>10 行</option>
          </select>
          <button
            type="button"
            onClick={addRows}
            disabled={busy}
            className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
          >
            添加
          </button>
          <div className="text-xs text-zinc-500">新增后可直接批量填值，再点“确认更新”提交</div>
        </div>
      ) : null}
    </div>
  );
}

