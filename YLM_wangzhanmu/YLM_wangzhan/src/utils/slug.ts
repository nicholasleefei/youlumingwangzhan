export function slugify(input: string) {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "model";
}
