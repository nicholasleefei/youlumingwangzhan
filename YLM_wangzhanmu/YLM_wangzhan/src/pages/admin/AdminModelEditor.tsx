import { useTranslation } from "react-i18next";
import { useState, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/i18n/locales";
import { supabase } from "@/utils/supabaseClient";
import { slugify } from "@/utils/slug";

export type ModelForm = {
  id?: string;
  name: string;
  slug: string;
  brand: string;
  vehicle_class: string;
  energy_type: string;
  year: string;
  fob_price_min: string;
  fob_price_max: string;
  currency: string;
  is_hot: boolean;
  is_active: boolean;
  summary: string;
  description: string;
  cover_image: string;
  manufacturer: string;
  level: string;
  cltc_range: string;
  charging_time_fast: string;
  charging_time_slow: string;
  fast_charge_percentage: string;
  motor_type: string;
  transmission: string;
  motor_horsepower: string;
  motor_total_power: string;
  motor_total_torque: string;
  body_type: string;
  length_mm: string;
  width_mm: string;
  height_mm: string;
  wheelbase_mm: string;
  max_speed: string;
  acceleration_0_100: string;
};

export default function AdminModelEditor(props: {
  loading: boolean;
  error: string | null;
  form: ModelForm;
  editingLocale: Locale;
  onEditingLocaleChange: (l: Locale) => void;
  onFormChange: (next: ModelForm) => void;
  onNew: () => void;
  onSaved: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const f = props.form;
  const [uploading, setUploading] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !f.id) return;
    uploadFile(file);
  }, [f.id]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !f.id) return;
    uploadFile(file);
  }, [f.id]);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${f.id}-${Date.now()}.${ext}`;
      const filePath = `models/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("models")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("models")
        .getPublicUrl(filePath);

      props.onFormChange({ ...f, cover_image: publicUrl });
    } catch (err) {
      console.error("Upload failed:", err);
      throw err;
    } finally {
      setUploading(false);
    }
  }

  function clearImage() {
    props.onFormChange({ ...f, cover_image: "" });
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  async function save() {
    const baseName = f.name.trim();
    if (!baseName) throw new Error("Name is required");

    const slug = f.slug.trim() || slugify(baseName);
    const year = f.year.trim() ? Number(f.year.trim()) : null;
    const min = f.fob_price_min.trim() ? Number(f.fob_price_min.trim()) : null;
    const max = f.fob_price_max.trim() ? Number(f.fob_price_max.trim()) : null;

    const cltc_range = f.cltc_range.trim() ? Number(f.cltc_range.trim()) : null;
    const fast_charge_percentage = f.fast_charge_percentage.trim() ? Number(f.fast_charge_percentage.trim()) : null;
    const motor_horsepower = f.motor_horsepower.trim() ? Number(f.motor_horsepower.trim()) : null;
    const motor_total_power = f.motor_total_power.trim() ? Number(f.motor_total_power.trim()) : null;
    const motor_total_torque = f.motor_total_torque.trim() ? Number(f.motor_total_torque.trim()) : null;
    const length_mm = f.length_mm.trim() ? Number(f.length_mm.trim()) : null;
    const width_mm = f.width_mm.trim() ? Number(f.width_mm.trim()) : null;
    const height_mm = f.height_mm.trim() ? Number(f.height_mm.trim()) : null;
    const wheelbase_mm = f.wheelbase_mm.trim() ? Number(f.wheelbase_mm.trim()) : null;
    const max_speed = f.max_speed.trim() ? Number(f.max_speed.trim()) : null;
    const acceleration_0_100 = f.acceleration_0_100.trim() ? Number(f.acceleration_0_100.trim()) : null;

    if (f.year.trim() && Number.isNaN(year)) throw new Error("Invalid year");
    if (f.fob_price_min.trim() && Number.isNaN(min)) throw new Error("Invalid FOB min");
    if (f.fob_price_max.trim() && Number.isNaN(max)) throw new Error("Invalid FOB max");
    if (f.cltc_range.trim() && Number.isNaN(cltc_range)) throw new Error("Invalid CLTC range");
    if (f.fast_charge_percentage.trim() && Number.isNaN(fast_charge_percentage)) throw new Error("Invalid fast charge percentage");
    if (f.motor_horsepower.trim() && Number.isNaN(motor_horsepower)) throw new Error("Invalid motor horsepower");
    if (f.motor_total_power.trim() && Number.isNaN(motor_total_power)) throw new Error("Invalid motor total power");
    if (f.motor_total_torque.trim() && Number.isNaN(motor_total_torque)) throw new Error("Invalid motor total torque");
    if (f.length_mm.trim() && Number.isNaN(length_mm)) throw new Error("Invalid length");
    if (f.width_mm.trim() && Number.isNaN(width_mm)) throw new Error("Invalid width");
    if (f.height_mm.trim() && Number.isNaN(height_mm)) throw new Error("Invalid height");
    if (f.wheelbase_mm.trim() && Number.isNaN(wheelbase_mm)) throw new Error("Invalid wheelbase");
    if (f.max_speed.trim() && Number.isNaN(max_speed)) throw new Error("Invalid max speed");
    if (f.acceleration_0_100.trim() && Number.isNaN(acceleration_0_100)) throw new Error("Invalid acceleration");

    const upsertModel = {
      id: f.id,
      name: baseName,
      slug,
      brand: f.brand.trim() || null,
      vehicle_class: f.vehicle_class.trim() || null,
      energy_type: f.energy_type.trim() || null,
      year,
      fob_price_min: min,
      fob_price_max: max,
      currency: f.currency.trim() || "USD",
      is_hot: f.is_hot,
      is_active: f.is_active,
      manufacturer: f.manufacturer.trim() || null,
      level: f.level.trim() || null,
      cltc_range,
      charging_time_fast: f.charging_time_fast.trim() || null,
      charging_time_slow: f.charging_time_slow.trim() || null,
      fast_charge_percentage,
      motor_type: f.motor_type.trim() || null,
      transmission: f.transmission.trim() || null,
      motor_horsepower,
      motor_total_power,
      motor_total_torque,
      body_type: f.body_type.trim() || null,
      length_mm,
      width_mm,
      height_mm,
      wheelbase_mm,
      max_speed,
      acceleration_0_100,
    };

    const { data: model, error: upErr } = await supabase.from("models").upsert(upsertModel).select("*").single();
    if (upErr) throw upErr;

    const trUpsert = {
      model_id: model.id,
      locale: props.editingLocale,
      name: baseName,
      summary: f.summary.trim() || null,
      description: f.description.trim() || null,
    };
    const { error: trUpErr } = await supabase.from("model_translations").upsert(trUpsert);
    if (trUpErr) throw trUpErr;

    if (f.cover_image.trim()) {
      const { error: imgErr } = await supabase.from("model_images").insert({
        model_id: model.id,
        path: f.cover_image.trim(),
        is_cover: true,
        sort_order: 0,
      });
      if (imgErr) throw imgErr;
    }

    props.onFormChange({ ...props.form, id: model.id, slug });
    await props.onSaved();
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-zinc-800">编辑</div>
        <button
          type="button"
          onClick={props.onNew}
          className="inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 hover:bg-zinc-50"
        >
          {t("action.create")}
        </button>
      </div>

      {props.error ? <div className="mt-3 text-sm text-red-300">{props.error}</div> : null}

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1">
          <span className="text-xs text-zinc-400">翻译语言</span>
          <select
            value={props.editingLocale}
            onChange={(e) => props.onEditingLocaleChange(e.target.value as Locale)}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
          >
            {SUPPORTED_LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_LABELS[l]} ({l})
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-zinc-400">名称</span>
          <input
            value={f.name}
            onChange={(e) => props.onFormChange({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) })}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-zinc-400">链接标识（Slug）</span>
          <input
            value={f.slug}
            onChange={(e) => props.onFormChange({ ...f, slug: e.target.value })}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-zinc-400">品牌</span>
            <input
              value={f.brand}
              onChange={(e) => props.onFormChange({ ...f, brand: e.target.value })}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-zinc-400">能源类型</span>
            <input
              value={f.energy_type}
              onChange={(e) => props.onFormChange({ ...f, energy_type: e.target.value })}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-zinc-400">年份</span>
            <input
              value={f.year}
              onChange={(e) => props.onFormChange({ ...f, year: e.target.value })}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
              inputMode="numeric"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-zinc-400">FOB 最低价</span>
            <input
              value={f.fob_price_min}
              onChange={(e) => props.onFormChange({ ...f, fob_price_min: e.target.value })}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
              inputMode="decimal"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-zinc-400">FOB 最高价</span>
            <input
              value={f.fob_price_max}
              onChange={(e) => props.onFormChange({ ...f, fob_price_max: e.target.value })}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
              inputMode="decimal"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800">
            <input type="checkbox" checked={f.is_hot} onChange={(e) => props.onFormChange({ ...f, is_hot: e.target.checked })} />
            <span>热销</span>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800">
            <input type="checkbox" checked={f.is_active} onChange={(e) => props.onFormChange({ ...f, is_active: e.target.checked })} />
            <span>启用</span>
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-xs text-zinc-400">摘要</span>
          <input
            value={f.summary}
            onChange={(e) => props.onFormChange({ ...f, summary: e.target.value })}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-zinc-400">描述</span>
          <textarea
            value={f.description}
            onChange={(e) => props.onFormChange({ ...f, description: e.target.value })}
            className="min-h-24 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <div className="grid gap-1">
          <span className="text-xs text-zinc-400">封面图片（可选）</span>
          {f.cover_image ? (
            <div className="relative rounded-lg border border-zinc-200 overflow-hidden">
              <img src={f.cover_image} alt="Cover preview" className="w-full h-48 object-cover" />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                uploading ? "border-zinc-300 bg-zinc-50" : "border-zinc-200 hover:border-amber-400 hover:bg-amber-50"
              }`}
            >
              {!f.id ? (
                <div className="text-sm text-zinc-400">
                  请先保存车型后再上传图片
                </div>
              ) : uploading ? (
                <div className="text-sm text-zinc-500">
                  <Upload className="mx-auto h-8 w-8 animate-bounce text-zinc-400 mb-2" />
                  上传中...
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
                  <p className="text-sm text-zinc-600 mb-1">拖拽图片到此处上传</p>
                  <p className="text-xs text-zinc-400 mb-3">或点击选择文件</p>
                  <label className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 text-sm font-medium hover:bg-amber-400 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    选择文件
                  </label>
                </>
              )}
            </div>
          )}
          {f.cover_image && (
            <p className="text-xs text-zinc-400 break-all">{f.cover_image}</p>
          )}
        </div>

        <div className="border-t border-zinc-200 pt-4 mt-4">
          <div className="text-sm font-medium text-zinc-800 mb-3">基本参数</div>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">厂商</span>
                <input
                  value={f.manufacturer}
                  onChange={(e) => props.onFormChange({ ...f, manufacturer: e.target.value })}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">级别</span>
                <input
                  value={f.level}
                  onChange={(e) => props.onFormChange({ ...f, level: e.target.value })}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                />
              </label>
            </div>

            <label className="grid gap-1">
              <span className="text-xs text-zinc-400">CLTC 纯电续航里程 (km)</span>
              <input
                value={f.cltc_range}
                onChange={(e) => props.onFormChange({ ...f, cltc_range: e.target.value })}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                inputMode="decimal"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">快充时间</span>
                <input
                  value={f.charging_time_fast}
                  onChange={(e) => props.onFormChange({ ...f, charging_time_fast: e.target.value })}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">慢充时间</span>
                <input
                  value={f.charging_time_slow}
                  onChange={(e) => props.onFormChange({ ...f, charging_time_slow: e.target.value })}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                />
              </label>
            </div>

            <label className="grid gap-1">
              <span className="text-xs text-zinc-400">快充电量 (%)</span>
              <input
                value={f.fast_charge_percentage}
                onChange={(e) => props.onFormChange({ ...f, fast_charge_percentage: e.target.value })}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                inputMode="numeric"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">电动机</span>
                <input
                  value={f.motor_type}
                  onChange={(e) => props.onFormChange({ ...f, motor_type: e.target.value })}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">变速箱</span>
                <input
                  value={f.transmission}
                  onChange={(e) => props.onFormChange({ ...f, transmission: e.target.value })}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                />
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">最大马力 (Ps)</span>
                <input
                  value={f.motor_horsepower}
                  onChange={(e) => props.onFormChange({ ...f, motor_horsepower: e.target.value })}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  inputMode="decimal"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">总功率 (kW)</span>
                <input
                  value={f.motor_total_power}
                  onChange={(e) => props.onFormChange({ ...f, motor_total_power: e.target.value })}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  inputMode="decimal"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">总扭矩 (N・m)</span>
                <input
                  value={f.motor_total_torque}
                  onChange={(e) => props.onFormChange({ ...f, motor_total_torque: e.target.value })}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  inputMode="decimal"
                />
              </label>
            </div>

            <label className="grid gap-1">
              <span className="text-xs text-zinc-400">车身类型</span>
              <input
                value={f.body_type}
                onChange={(e) => props.onFormChange({ ...f, body_type: e.target.value })}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
              />
            </label>

            <div className="grid grid-cols-4 gap-3">
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">长 (mm)</span>
                <input
                  value={f.length_mm}
                  onChange={(e) => props.onFormChange({ ...f, length_mm: e.target.value })}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  inputMode="numeric"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">宽 (mm)</span>
                <input
                  value={f.width_mm}
                  onChange={(e) => props.onFormChange({ ...f, width_mm: e.target.value })}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  inputMode="numeric"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">高 (mm)</span>
                <input
                  value={f.height_mm}
                  onChange={(e) => props.onFormChange({ ...f, height_mm: e.target.value })}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  inputMode="numeric"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">轴距 (mm)</span>
                <input
                  value={f.wheelbase_mm}
                  onChange={(e) => props.onFormChange({ ...f, wheelbase_mm: e.target.value })}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  inputMode="numeric"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">最高车速 (km/h)</span>
                <input
                  value={f.max_speed}
                  onChange={(e) => props.onFormChange({ ...f, max_speed: e.target.value })}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  inputMode="numeric"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">0-100km/h 加速 (s)</span>
                <input
                  value={f.acceleration_0_100}
                  onChange={(e) => props.onFormChange({ ...f, acceleration_0_100: e.target.value })}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  inputMode="decimal"
                />
              </label>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={props.loading}
          onClick={async () => {
            await save();
          }}
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-amber-500 px-4 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
        >
          {props.loading ? "Saving..." : t("action.save")}
        </button>
      </div>
    </div>
  );
}
