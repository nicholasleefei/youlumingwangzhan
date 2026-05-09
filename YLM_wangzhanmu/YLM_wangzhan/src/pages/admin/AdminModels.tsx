import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { supabase } from "@/utils/supabaseClient";
import type { ModelRow, ModelTranslationRow } from "@/utils/db";
import AdminModelsList from "./AdminModelsList";
import AdminModelEditor, { type ModelForm } from "./AdminModelEditor";

function emptyForm(): ModelForm {
  return {
    name: "",
    slug: "",
    brand: "",
    vehicle_class: "",
    energy_type: "",
    year: "",
    fob_price_min: "",
    fob_price_max: "",
    currency: "USD",
    is_hot: true,
    is_active: true,
    summary: "",
    description: "",
    cover_image: "",
    manufacturer: "",
    level: "",
    cltc_range: "",
    charging_time_fast: "",
    charging_time_slow: "",
    fast_charge_percentage: "",
    motor_type: "",
    transmission: "",
    motor_horsepower: "",
    motor_total_power: "",
    motor_total_torque: "",
    body_type: "",
    length_mm: "",
    width_mm: "",
    height_mm: "",
    wheelbase_mm: "",
    max_speed: "",
    acceleration_0_100: "",
  };
}

export default function AdminModels(props: { locale: Locale }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<ModelRow[]>([]);
  const [translations, setTranslations] = useState<ModelTranslationRow[]>([]);
  const [edit, setEdit] = useState<ModelForm>(emptyForm());
  const [editingLocale, setEditingLocale] = useState<Locale>(props.locale);

  const trMap = useMemo(() => {
    const map = new Map<string, ModelTranslationRow>();
    translations.forEach((x) => {
      if (x.locale === editingLocale) map.set(x.model_id, x);
    });
    return map;
  }, [translations, editingLocale]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [{ data: m, error: mErr }, { data: tr, error: trErr }] = await Promise.all([
        supabase.from("models").select("*").order("updated_at", { ascending: false }),
        supabase.from("model_translations").select("*").order("updated_at", { ascending: false }),
      ]);
      if (mErr) throw mErr;
      if (trErr) throw trErr;
      setModels(m ?? []);
      setTranslations(tr ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function loadToEditor(m: ModelRow) {
    const tr = trMap.get(m.id);
    setEdit({
      id: m.id,
      name: m.name,
      slug: m.slug ?? "",
      brand: m.brand ?? "",
      vehicle_class: m.vehicle_class ?? "",
      energy_type: m.energy_type ?? "",
      year: m.year?.toString() ?? "",
      fob_price_min: m.fob_price_min?.toString() ?? "",
      fob_price_max: m.fob_price_max?.toString() ?? "",
      currency: m.currency,
      is_hot: m.is_hot,
      is_active: m.is_active,
      summary: tr?.summary ?? "",
      description: tr?.description ?? "",
      cover_image: "",
      manufacturer: m.manufacturer ?? "",
      level: m.level ?? "",
      cltc_range: m.cltc_range?.toString() ?? "",
      charging_time_fast: m.charging_time_fast ?? "",
      charging_time_slow: m.charging_time_slow ?? "",
      fast_charge_percentage: m.fast_charge_percentage?.toString() ?? "",
      motor_type: m.motor_type ?? "",
      transmission: m.transmission ?? "",
      motor_horsepower: m.motor_horsepower?.toString() ?? "",
      motor_total_power: m.motor_total_power?.toString() ?? "",
      motor_total_torque: m.motor_total_torque?.toString() ?? "",
      body_type: m.body_type ?? "",
      length_mm: m.length_mm?.toString() ?? "",
      width_mm: m.width_mm?.toString() ?? "",
      height_mm: m.height_mm?.toString() ?? "",
      wheelbase_mm: m.wheelbase_mm?.toString() ?? "",
      max_speed: m.max_speed?.toString() ?? "",
      acceleration_0_100: m.acceleration_0_100?.toString() ?? "",
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <AdminModelsList loading={loading} error={error} models={models} onRefresh={refresh} onSelect={loadToEditor} />
      </div>
      <div className="lg:col-span-2">
        <AdminModelEditor
          loading={loading}
          error={error}
          form={edit}
          editingLocale={editingLocale}
          onEditingLocaleChange={setEditingLocale}
          onFormChange={setEdit}
          onNew={() => setEdit(emptyForm())}
          onSaved={async () => {
            await refresh();
          }}
        />
      </div>
    </div>
  );
}
