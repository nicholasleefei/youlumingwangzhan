import { mkdir, readFile, writeFile } from "node:fs/promises";
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

async function loadEnvFromLocalFile(projectRoot) {
  const envPath = path.join(projectRoot, ".env.local");
  try {
    const content = await readFile(envPath, "utf8");
    const parsed = parseDotEnv(content);
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof process.env[k] === "undefined" && typeof v === "string") {
        process.env[k] = v;
      }
    }
  } catch {
    return;
  }
}

async function figmaGetJson(url, token) {
  const res = await fetch(url, {
    headers: {
      "X-Figma-Token": token,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Figma API ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
  }
  return await res.json();
}

function normalizeColor(paint) {
  if (!paint || paint.type !== "SOLID" || !paint.color) return null;
  const { r, g, b } = paint.color;
  const a = typeof paint.opacity === "number" ? paint.opacity : 1;
  const to255 = (x) => Math.round(Math.max(0, Math.min(1, x)) * 255);
  const rr = to255(r).toString(16).padStart(2, "0");
  const gg = to255(g).toString(16).padStart(2, "0");
  const bb = to255(b).toString(16).padStart(2, "0");
  const hex = `#${rr}${gg}${bb}`;
  return { hex, alpha: a };
}

function extractTokensFromStyles(stylesJson, fileJson) {
  const styles = Array.isArray(stylesJson?.meta?.styles) ? stylesJson.meta.styles : [];
  const tokens = {
    generatedAt: new Date().toISOString(),
    fileName: fileJson?.name ?? null,
    colors: {},
    textStyles: {},
  };

  for (const s of styles) {
    if (!s || typeof s !== "object") continue;
    const name = typeof s.name === "string" ? s.name : null;
    const styleType = typeof s.style_type === "string" ? s.style_type : null;
    const key = typeof s.key === "string" ? s.key : null;
    if (!name || !styleType || !key) continue;

    if (styleType === "FILL") {
      const styleNode = fileJson?.styles?.[key];
      const paints = Array.isArray(styleNode?.fills) ? styleNode.fills : null;
      const solid = paints ? normalizeColor(paints.find((p) => p?.type === "SOLID")) : null;
      if (solid) {
        tokens.colors[name] = solid.alpha === 1 ? solid.hex : `rgba(${parseInt(solid.hex.slice(1, 3), 16)}, ${parseInt(solid.hex.slice(3, 5), 16)}, ${parseInt(solid.hex.slice(5, 7), 16)}, ${solid.alpha})`;
      }
    }

    if (styleType === "TEXT") {
      const styleNode = fileJson?.styles?.[key];
      const st = styleNode?.style;
      if (st && typeof st === "object") {
        tokens.textStyles[name] = {
          fontFamily: st.fontFamily ?? null,
          fontPostScriptName: st.fontPostScriptName ?? null,
          fontSize: st.fontSize ?? null,
          fontWeight: st.fontWeight ?? null,
          letterSpacing: st.letterSpacing ?? null,
          lineHeightPx: st.lineHeightPx ?? null,
          lineHeightPercent: st.lineHeightPercent ?? null,
          textCase: st.textCase ?? null,
          textDecoration: st.textDecoration ?? null,
        };
      }
    }
  }

  return tokens;
}

async function main() {
  const projectRoot = process.cwd();
  await loadEnvFromLocalFile(projectRoot);

  const token = process.env.FIGMA_TOKEN;
  const fileKey = process.env.FIGMA_FILE_KEY;

  if (!token) {
    throw new Error("Missing FIGMA_TOKEN. Put it in .env.local or your shell env.");
  }
  if (!fileKey) {
    throw new Error("Missing FIGMA_FILE_KEY. Put it in .env.local or your shell env.");
  }

  const cacheDir = path.join(projectRoot, ".trae", "figma-cache");
  const outDir = path.join(projectRoot, "src", "design");
  await mkdir(cacheDir, { recursive: true });
  await mkdir(outDir, { recursive: true });

  const fileUrl = `https://api.figma.com/v1/files/${fileKey}`;
  const stylesUrl = `https://api.figma.com/v1/files/${fileKey}/styles`;

  const fileJson = await figmaGetJson(fileUrl, token);
  const stylesJson = await figmaGetJson(stylesUrl, token);
  const tokens = extractTokensFromStyles(stylesJson, fileJson);

  await writeFile(path.join(cacheDir, "file.json"), JSON.stringify(fileJson, null, 2), "utf8");
  await writeFile(path.join(cacheDir, "styles.json"), JSON.stringify(stylesJson, null, 2), "utf8");
  await writeFile(path.join(outDir, "figma.tokens.json"), JSON.stringify(tokens, null, 2), "utf8");

  const colorCount = Object.keys(tokens.colors).length;
  const textCount = Object.keys(tokens.textStyles).length;
  console.log(`Figma sync done. colors=${colorCount} textStyles=${textCount}`);
  console.log(`Wrote: .trae/figma-cache/{file.json,styles.json} and src/design/figma.tokens.json`);
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});

