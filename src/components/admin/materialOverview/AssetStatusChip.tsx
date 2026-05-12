import { Trash2 } from "lucide-react";

function clsFor(state: "present" | "missing" | "unknown") {
  if (state === "present") return "border-green-200 bg-green-50 text-green-700";
  if (state === "missing") return "border-red-200 bg-red-50 text-red-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-600";
}

export default function AssetStatusChip(props: {
  label: string;
  state: "present" | "missing" | "unknown";
  deletable?: boolean;
  onDelete?: () => void;
}) {
  const { label, state, deletable, onDelete } = props;
  const canDelete = Boolean(deletable && onDelete);

  return (
    <div className={"inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold " + clsFor(state)}>
      <span className="whitespace-nowrap">{label}</span>
      <span className="ml-0.5 rounded-full bg-white/70 px-1.5 py-0.5 text-[11px] font-bold">
        {state === "present" ? "有" : state === "missing" ? "无" : "?"}
      </span>
      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-transparent text-red-600 hover:border-red-200 hover:bg-white"
          title={`删除${label}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

