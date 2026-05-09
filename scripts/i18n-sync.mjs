import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

function parseDotEnv(content) {
  const out = {};
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}

async function loadEnvFromLocalFiles(projectRoot) {
  const candidates = [path.join(projectRoot, ".env"), path.join(projectRoot, ".env.local")];
  for (const envPath of candidates) {
    try {
      const content = await readFile(envPath, "utf8");
      const parsed = parseDotEnv(content);
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof process.env[k] === "undefined" && typeof v === "string") {
          process.env[k] = v;
        }
      }
    } catch {
      continue;
    }
  }
}

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    check: args.has("--check"),
    translate: args.has("--translate"),
    translateExisting: args.has("--translate-existing"),
  };
}

function chunkEntries(obj, maxItems) {
  const entries = Object.entries(obj);
  const chunks = [];
  for (let i = 0; i < entries.length; i += maxItems) {
    chunks.push(Object.fromEntries(entries.slice(i, i + maxItems)));
  }
  return chunks;
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

async function loadJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function saveJson(filePath, obj) {
  const sorted = Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(filePath, JSON.stringify(sorted, null, 2) + "\n", "utf8");
}

async function geminiTranslate({ apiKey, model, targetLocale, sourceTexts }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const input = {
    locale: targetLocale,
    items: sourceTexts,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "Translate UI strings for a B2B website about compliant & efficient China auto bulk supply. " +
                "Keep brand names (Youluming/YLM/呦鹿鸣) unchanged. Keep technical terms (FOB, Incoterm, RFQ, WhatsApp) as-is. " +
                "Return ONLY valid JSON object mapping keys to translated strings.\n\n" +
                JSON.stringify(input),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Gemini error ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("\n") ??
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "";
  if (typeof text !== "string" || !text.trim()) throw new Error("Gemini returned empty text");
  return JSON.parse(text);
}

async function openAiTranslate({ apiKey, model, targetLocale, sourceTexts }) {
  const input = {
    locale: targetLocale,
    items: sourceTexts,
  };

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text:
                "You translate UI strings for a B2B website about compliant & efficient China auto bulk supply. " +
                "Keep brand names (Youluming/YLM/呦鹿鸣) unchanged. Keep technical terms (FOB, Incoterm, RFQ, WhatsApp) as-is. " +
                "Return ONLY valid JSON object mapping keys to translated strings.",
            },
          ],
        },
        {
          role: "user",
          content: [{ type: "text", text: JSON.stringify(input) }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.output_text;
  if (typeof text !== "string" || !text.trim()) throw new Error("OpenAI returned empty output_text");
  return JSON.parse(text);
}

async function doubaoTranslate({ apiKey, endpoint, model, targetLocale, sourceTexts }) {
  const input = {
    model,
    messages: [
      {
        role: "system",
        content:
          "Translate UI strings for a B2B website about compliant & efficient China auto bulk supply. " +
          "Keep brand names (Youluming/YLM/呦鹿鸣) unchanged. Keep technical terms (FOB, Incoterm, RFQ, WhatsApp) as-is. " +
          "Return ONLY valid JSON object mapping keys to translated strings.",
      },
      {
        role: "user",
        content: JSON.stringify({
          locale: targetLocale,
          items: sourceTexts,
        }),
      },
    ],
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Doubao error ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("Doubao returned empty content");
  return JSON.parse(text);
}

async function main() {
  const { check, translate, translateExisting } = parseArgs(process.argv);

  const projectRoot = process.cwd();
  await loadEnvFromLocalFiles(projectRoot);
  const messagesDir = path.join(projectRoot, "src", "i18n", "messages");
  await mkdir(messagesDir, { recursive: true });

  const srcDir = path.join(projectRoot, "src");
  const files = (await walk(srcDir)).filter((p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const usedKeys = new Set();
  for (const file of files) {
    const s = await readFile(file, "utf8");
    for (const k of extractKeysFromSource(s)) usedKeys.add(k);
  }

  const localeFiles = (await readdir(messagesDir)).filter((f) => f.endsWith(".json"));
  if (localeFiles.length === 0) {
    throw new Error("No locale json files found. Run: npm run i18n:migrate");
  }

  const locales = localeFiles.map((f) => f.replace(/\.json$/, ""));
  const enPath = path.join(messagesDir, "en.json");
  const enExists = await stat(enPath).then(() => true).catch(() => false);
  if (!enExists) throw new Error("Missing src/i18n/messages/en.json");

  const en = await loadJson(enPath);
  const missingInEn = [];
  for (const k of usedKeys) {
    if (typeof en[k] !== "string") missingInEn.push(k);
  }

  if (missingInEn.length > 0) {
    if (check) {
      console.error(`Missing ${missingInEn.length} keys in en.json`);
      for (const k of missingInEn.slice(0, 50)) console.error(`- ${k}`);
      process.exit(1);
    }
    for (const k of missingInEn) {
      en[k] = `__MISSING_EN__ ${k}`;
    }
    await saveJson(enPath, en);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    usedKeyCount: usedKeys.size,
    locales,
    missingByLocale: {},
    sameAsEnByLocale: {},
  };

  const geminiKey = process.env.GOOGLE_API_KEY;
  const geminiModel = process.env.I18N_GEMINI_MODEL || "gemini-1.5-flash";
  const openaiKey = process.env.OPENAI_API_KEY;
  const openaiModel = process.env.I18N_OPENAI_MODEL || "gpt-4o-mini";
  const doubaoKey = process.env.DOUBAO_API_KEY;
  const doubaoEndpoint = process.env.DOUBAO_API_ENDPOINT || "https://ark.cn-beijing.volces.com/api/v3/responses";
  const doubaoModel = process.env.DOUBAO_MODEL || "doubao-seed-2-0-lite-260215";

  if (translate && !geminiKey && !openaiKey && !doubaoKey) {
    console.warn(
      "i18n:sync:ai is enabled but no API key found. Set GOOGLE_API_KEY (Gemini), OPENAI_API_KEY (OpenAI), or DOUBAO_API_KEY (Doubao) in .env.local or environment."
    );
  }

  for (const locale of locales) {
    const filePath = path.join(messagesDir, `${locale}.json`);
    const dict = await loadJson(filePath);

    const missing = [];
    const sameAsEn = [];
    for (const k of usedKeys) {
      if (typeof dict[k] !== "string") {
        missing.push(k);
        continue;
      }
      if (locale !== "en" && typeof en[k] === "string" && dict[k] === en[k]) {
        sameAsEn.push(k);
      }
      if (typeof dict[k] === "string" && dict[k].startsWith("__MISSING_EN__")) {
        sameAsEn.push(k);
      }
    }
    report.missingByLocale[locale] = missing;
    report.sameAsEnByLocale[locale] = locale === "en" ? [] : sameAsEn;

    if (check) continue;

    const toFill = missing;
    const toTranslate = translateExisting ? Array.from(new Set([...missing, ...sameAsEn])) : missing;

    if (toFill.length === 0 && toTranslate.length === 0) continue;

    if (translate && locale !== "en" && (geminiKey || openaiKey || doubaoKey) && toTranslate.length > 0) {
      const sourceTexts = {};
      for (const k of toTranslate) sourceTexts[k] = en[k];

      try {
        console.log(`Translating ${toTranslate.length} keys for ${locale}...`);
        const chunks = chunkEntries(sourceTexts, 40);
        for (const ch of chunks) {
          let translated;
          if (geminiKey) {
            translated = await geminiTranslate({ apiKey: geminiKey, model: geminiModel, targetLocale: locale, sourceTexts: ch });
          } else if (openaiKey) {
            translated = await openAiTranslate({ apiKey: openaiKey, model: openaiModel, targetLocale: locale, sourceTexts: ch });
          } else if (doubaoKey) {
            translated = await doubaoTranslate({ apiKey: doubaoKey, endpoint: doubaoEndpoint, model: doubaoModel, targetLocale: locale, sourceTexts: ch });
          }
          for (const [k, v] of Object.entries(translated)) {
            if (typeof v === "string" && v.trim()) dict[k] = v;
          }
        }
        console.log(`Successfully translated ${toTranslate.length} keys for ${locale}`);
      } catch (err) {
        console.error(`Error translating ${locale}:`, err?.message ?? err);
        for (const k of toFill) dict[k] = en[k];
      }
    } else {
      for (const k of toFill) dict[k] = en[k];
    }

    await saveJson(filePath, dict);
  }

  const outDir = path.join(projectRoot, ".trae", "i18n");
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");

  if (!check) {
    const totalMissing = Object.values(report.missingByLocale).reduce((a, b) => a + b.length, 0);
    let provider = "none";
    if (translate && geminiKey) provider = "gemini";
    else if (translate && openaiKey) provider = "openai";
    else if (translate && doubaoKey) provider = "doubao";
    console.log(`i18n sync done. usedKeys=${usedKeys.size} filledMissing=${totalMissing} translate=${provider}`);
    console.log(`Wrote report: .trae/i18n/report.json`);
  } else {
    console.log(`i18n check ok. usedKeys=${usedKeys.size}`);
  }
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
