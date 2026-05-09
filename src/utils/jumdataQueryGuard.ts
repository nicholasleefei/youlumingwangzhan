type WhereBuilder = (q: any) => any;

export async function confirmJumdataQueryIfExists(opts: {
  supabase: any;
  table: string;
  where?: WhereBuilder;
  subjectLabel: string;
  extraHint?: string;
}): Promise<boolean> {
  const { supabase, table, where, subjectLabel, extraHint } = opts;

  try {
    let q = supabase.from(table).select('id', { count: 'exact', head: true });
    if (where) q = where(q);
    const { count, error } = await q;
    if (error) return true;
    if (!count || count <= 0) return true;
    const hint = extraHint ? `\n${extraHint}` : '';
    return window.confirm(`数据库中已存在 ${subjectLabel} 数据（${count} 条），是否更新并继续查询？${hint}`);
  } catch {
    return true;
  }
}

