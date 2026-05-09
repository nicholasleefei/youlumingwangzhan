export type FlattenedParam = {
  path: string;
  value: string;
};

export function flattenParams(input: unknown, opts?: { maxItems?: number; maxDepth?: number }) {
  const maxItems = opts?.maxItems ?? 600;
  const maxDepth = opts?.maxDepth ?? 6;

  const out: FlattenedParam[] = [];

  function push(path: string, value: unknown) {
    if (out.length >= maxItems) return;
    if (value === null || value === undefined) return;
    if (typeof value === "string") {
      const v = value.trim();
      if (!v) return;
      out.push({ path, value: v });
      return;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      out.push({ path, value: String(value) });
      return;
    }
  }

  function walk(node: unknown, path: string, depth: number) {
    if (out.length >= maxItems) return;
    if (depth > maxDepth) return;

    if (node === null || node === undefined) return;
    if (typeof node !== "object") {
      push(path, node);
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item, idx) => {
        if (out.length >= maxItems) return;
        walk(item, path ? `${path}[${idx}]` : `[${idx}]`, depth + 1);
      });
      return;
    }

    const rec = node as Record<string, unknown>;
    Object.keys(rec)
      .sort((a, b) => a.localeCompare(b))
      .forEach((key) => {
        if (out.length >= maxItems) return;
        const nextPath = path ? `${path}.${key}` : key;
        walk(rec[key], nextPath, depth + 1);
      });
  }

  walk(input, "", 0);
  return out;
}

