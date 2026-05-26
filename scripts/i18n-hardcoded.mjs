import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const args = { includeAdmin: false, maxPerFile: 80 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--include-admin") args.includeAdmin = true;
    if (a === "--max-per-file") {
      const v = Number(argv[i + 1]);
      if (Number.isFinite(v) && v > 0) args.maxPerFile = Math.floor(v);
      i++;
    }
  }
  return args;
}

async function walk(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "dist" || ent.name.startsWith(".")) continue;
      await walk(p, acc);
    } else {
      acc.push(p);
    }
  }
  return acc;
}

function isSourceFile(p) {
  return /\.(ts|tsx|js|jsx)$/.test(p);
}

function shouldIgnore(p, includeAdmin) {
  const norm = p.split(path.sep).join("/");
  if (norm.includes("/src/i18n/messages/")) return true;
  if (norm.includes("/src/i18n/")) return true;
  if (norm.includes("/.trae/")) return true;
  if (!includeAdmin) {
    if (norm.includes("/src/admin/")) return true;
    if (norm.includes("/src/pages/admin/")) return true;
    if (norm.includes("/src/components/admin/")) return true;
  }
  return false;
}

function findHardcodedLines(src, maxPerFile) {
  const lines = src.split(/\r?\n/);
  const hits = [];
  const hanRe = /[\u4e00-\u9fff]/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!hanRe.test(line)) continue;
    if (line.trim().startsWith("//")) continue;
    if (line.includes("console.") || line.includes("addLog(") || line.includes("addModelLog(")) {
      hits.push({ line: i + 1, text: line.trim().slice(0, 240), kind: "log" });
      if (hits.length >= maxPerFile) break;
      continue;
    }
    hits.push({ line: i + 1, text: line.trim().slice(0, 240), kind: "text" });
    if (hits.length >= maxPerFile) break;
  }
  return hits;
}

async function main() {
  const projectRoot = process.cwd();
  const srcDir = path.join(projectRoot, "src");
  const args = parseArgs(process.argv.slice(2));

  const all = await walk(srcDir);
  const files = all.filter(isSourceFile).filter((p) => !shouldIgnore(p, args.includeAdmin));

  const report = {
    generatedAt: new Date().toISOString(),
    includeAdmin: args.includeAdmin,
    fileCount: files.length,
    matchedFileCount: 0,
    totalHits: 0,
    files: [],
  };

  for (const file of files) {
    const st = await stat(file);
    if (!st.isFile()) continue;
    const src = await readFile(file, "utf8");
    const hits = findHardcodedLines(src, args.maxPerFile);
    if (hits.length === 0) continue;
    report.matchedFileCount++;
    report.totalHits += hits.length;
    report.files.push({
      file: path.relative(projectRoot, file).split(path.sep).join("/"),
      hitCount: hits.length,
      hits,
    });
  }

  report.files.sort((a, b) => b.hitCount - a.hitCount);

  const outDir = path.join(projectRoot, ".trae", "i18n");
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "hardcoded.json"), JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log(`hardcoded scan done. files=${report.fileCount} matched=${report.matchedFileCount} hits=${report.totalHits}`);
  console.log("Wrote report: .trae/i18n/hardcoded.json");
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
