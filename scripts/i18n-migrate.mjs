import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import * as ts from "typescript";

function isObjectLiteral(node) {
  return node && node.kind === ts.SyntaxKind.ObjectLiteralExpression;
}

function getPropertyNameText(name) {
  if (!name) return null;
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) return name.text;
  if (ts.isNumericLiteral(name)) return name.text;
  return null;
}

function getStringValue(expr) {
  if (!expr) return null;
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) return expr.text;
  return null;
}

function parseDictObject(obj) {
  const spreads = [];
  const props = {};

  for (const p of obj.properties) {
    if (ts.isSpreadAssignment(p)) {
      if (ts.isIdentifier(p.expression)) spreads.push(p.expression.text);
      continue;
    }
    if (ts.isPropertyAssignment(p)) {
      const key = getPropertyNameText(p.name);
      const value = getStringValue(p.initializer);
      if (key && typeof value === "string") {
        props[key] = value;
      }
      continue;
    }
    if (ts.isShorthandPropertyAssignment(p)) {
      const key = p.name.text;
      props[key] = key;
    }
  }

  return { spreads, props };
}

function topologicallyResolve(dictDefs, name, visiting = new Set()) {
  if (visiting.has(name)) throw new Error(`Cycle in dict spreads: ${name}`);
  const def = dictDefs.get(name);
  if (!def) throw new Error(`Missing dict: ${name}`);
  visiting.add(name);
  const merged = {};
  for (const base of def.spreads) {
    Object.assign(merged, topologicallyResolve(dictDefs, base, visiting));
  }
  Object.assign(merged, def.props);
  visiting.delete(name);
  return merged;
}

async function main() {
  const projectRoot = process.cwd();
  const inputPath = path.join(projectRoot, "src", "i18n", "resources.ts");
  const content = await readFile(inputPath, "utf8");

  const sf = ts.createSourceFile(inputPath, content, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);

  const dictDefs = new Map();
  const localeToDictName = new Map();

  for (const st of sf.statements) {
    if (!ts.isVariableStatement(st)) continue;

    for (const decl of st.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name)) continue;
      const varName = decl.name.text;
      const init = decl.initializer;
      if (isObjectLiteral(init)) {
        const parsed = parseDictObject(init);
        if (parsed.spreads.length > 0 || Object.keys(parsed.props).length > 0) {
          dictDefs.set(varName, parsed);
        }
      }
    }
  }

  for (const st of sf.statements) {
    if (!ts.isVariableStatement(st)) continue;
    for (const decl of st.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || decl.name.text !== "resources") continue;
      const init = decl.initializer;
      if (!isObjectLiteral(init)) continue;

      for (const p of init.properties) {
        if (!ts.isPropertyAssignment(p)) continue;
        const locale = getPropertyNameText(p.name);
        if (!locale) continue;
        const v = p.initializer;
        if (!isObjectLiteral(v)) continue;

        const commonProp = v.properties.find(
          (x) => ts.isPropertyAssignment(x) && getPropertyNameText(x.name) === "common"
        );
        if (!commonProp || !ts.isPropertyAssignment(commonProp)) continue;
        if (!ts.isIdentifier(commonProp.initializer)) continue;
        localeToDictName.set(locale, commonProp.initializer.text);
      }
    }
  }

  if (localeToDictName.size === 0) {
    throw new Error("Failed to locate exported resources map in src/i18n/resources.ts");
  }

  const outDir = path.join(projectRoot, "src", "i18n", "messages");
  await mkdir(outDir, { recursive: true });

  for (const [locale, dictName] of localeToDictName.entries()) {
    const merged = topologicallyResolve(dictDefs, dictName);
    const sorted = Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)));
    const outPath = path.join(outDir, `${locale}.json`);
    await writeFile(outPath, JSON.stringify(sorted, null, 2) + "\n", "utf8");
  }

  console.log(`i18n migrate done. Wrote ${localeToDictName.size} locale json files to src/i18n/messages/`);
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});

