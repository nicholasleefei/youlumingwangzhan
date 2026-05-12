import { getActivityStatusColor, getActivityStatusLabel } from "@/utils/fieldLabels";

const options: Array<{ value: number; label: string }> = [
  { value: 0, label: "正常" },
  { value: 1, label: "不显示" },
  { value: 2, label: "不可用" },
];

export default function ActivityStatusPills(props: {
  value: number | null | undefined;
  disabled?: boolean;
  onChange: (next: number) => void;
}) {
  const { value, disabled, onChange } = props;
  const v = typeof value === "number" ? value : 0;

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1">
      {options.map((opt) => {
        const active = v === opt.value;
        const color = getActivityStatusColor(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            title={getActivityStatusLabel(opt.value)}
            className={
              "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors " +
              (active
                ? `border ${color} bg-white shadow-sm`
                : "border border-transparent text-zinc-500 hover:bg-zinc-50") +
              (disabled ? " opacity-60" : "")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

