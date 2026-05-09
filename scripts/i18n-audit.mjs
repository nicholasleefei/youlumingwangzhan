import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

async function loadJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function walk(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "dist" || ent.name.startsWith(".")) continue;
      if (p.includes(`${path.sep}src${path.sep}admin${path.sep}`)) continue;
      if (p.includes(`${path.sep}src${path.sep}pages${path.sep}admin${path.sep}`)) continue;
      await walk(p, acc);
    } else {
      acc.push(p);
    }
  }
  return acc;
}

function extractKeysFromSource(source) {
  const keys = new Set();
  const re = /\bt\(\s*(["'`])([^"'`]+)\1\s*\)/g;
  let m;
  while ((m = re.exec(source))) {
    const key = m[2];
    if (key && !key.includes("${")) keys.add(key);
  }
  return keys;
}

function isLikelyEnglish(text) {
  if (typeof text !== "string") return false;
  const s = text.trim();
  if (!s) return false;

  const asciiLetters = (s.match(/[A-Za-z]/g) || []).length;
  const totalLetters = (s.match(/\p{L}/gu) || []).length;
  if (totalLetters === 0) return false;

  const ratio = asciiLetters / totalLetters;
  const containsCommonWords = /\b(the|and|for|with|to|in|of|models|bulk|request|submit|loading|not found)\b/i.test(s);
  return ratio >= 0.6 || (ratio >= 0.35 && containsCommonWords);
}

function normalizeText(s) {
  return typeof s === "string" ? s.trim() : "";
}

async function main() {
  const projectRoot = process.cwd();
  const messagesDir = path.join(projectRoot, "src", "i18n", "messages");
  const enPath = path.join(messagesDir, "en.json");

  const locales = (await readdir(messagesDir)).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
  if (!locales.includes("en")) throw new Error("Missing en.json");

  const en = await loadJson(enPath);
  const srcDir = path.join(projectRoot, "src");
  const files = (await walk(srcDir)).filter((p) => /\.(ts|tsx|js|jsx)$/.test(p));

  const usedKeys = new Set();
  for (const file of files) {
    const s = await readFile(file, "utf8");
    for (const k of extractKeysFromSource(s)) usedKeys.add(k);
  }

  const usedKeyList = Array.from(usedKeys);
  const excludeKeys = new Set(["brand", "model.fob", "inquiry.incoterm", "inquiry.whatsapp"]);
  const requiredKeys = usedKeyList.filter((k) => !excludeKeys.has(k));

  const report = {
    generatedAt: new Date().toISOString(),
    localeCount: locales.length,
    keyCount: requiredKeys.length,
    locales: {},
    worstLocales: [],
  };

  for (const locale of locales) {
    const dict = await loadJson(path.join(messagesDir, `${locale}.json`));

    const missing = [];
    const sameAsEn = [];
    const likelyEnglish = [];

    for (const k of requiredKeys) {
      const v = dict[k];
      if (typeof v !== "string") {
        missing.push(k);
        continue;
      }
      if (locale !== "en" && normalizeText(v) === normalizeText(en[k])) {
        sameAsEn.push(k);
      }
      if (locale !== "en" && isLikelyEnglish(v)) {
        likelyEnglish.push(k);
      }
    }

    report.locales[locale] = {
      missingCount: missing.length,
      sameAsEnCount: sameAsEn.length,
      likelyEnglishCount: likelyEnglish.length,
      sampleMissing: missing.slice(0, 20),
      sampleSameAsEn: sameAsEn.slice(0, 20),
      sampleLikelyEnglish: likelyEnglish.slice(0, 20),
    };
  }

  report.worstLocales = Object.entries(report.locales)
    .filter(([l]) => l !== "en")
    .map(([l, s]) => ({
      locale: l,
      sameAsEnCount: s.sameAsEnCount,
      likelyEnglishCount: s.likelyEnglishCount,
      missingCount: s.missingCount,
    }))
    .sort((a, b) => (b.sameAsEnCount + b.likelyEnglishCount) - (a.sameAsEnCount + a.likelyEnglishCount))
    .slice(0, 10);

  const outDir = path.join(projectRoot, ".trae", "i18n");
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "audit.json"), JSON.stringify(report, null, 2) + "\n", "utf8");

  const totalMissing = Object.values(report.locales).reduce((a, s) => a + s.missingCount, 0);
  console.log(`i18n audit done. locales=${locales.length} keys=${requiredKeys.length} totalMissing=${totalMissing}`);
  console.log("Worst locales (sameAsEn+likelyEnglish):");
  for (const w of report.worstLocales) {
    console.log(`- ${w.locale}: sameAsEn=${w.sameAsEnCount} likelyEnglish=${w.likelyEnglishCount} missing=${w.missingCount}`);
  }
  console.log("Wrote report: .trae/i18n/audit.json");
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
