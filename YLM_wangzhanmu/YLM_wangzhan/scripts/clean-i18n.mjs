import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

async function main() {
  const projectRoot = process.cwd();
  const messagesDir = path.join(projectRoot, "src", "i18n", "messages");

  const enPath = path.join(messagesDir, "en.json");
  const enContent = await readFile(enPath, "utf-8");
  const en = JSON.parse(enContent);

  const localeFiles = (await readdir(messagesDir)).filter(
    (f) => f.endsWith(".json") && f !== "en.json" && f !== "zh-CN.json"
  );

  for (const file of localeFiles) {
    const filePath = path.join(messagesDir, file);
    const content = await readFile(filePath, "utf-8");
    let dict = JSON.parse(content);

    const newDict = {};
    for (const k of Object.keys(en)) {
      if (typeof dict[k] === "string" && !dict[k].startsWith("__MISSING_EN__")) {
        newDict[k] = dict[k];
      } else {
        newDict[k] = en[k];
      }
    }

    await writeFile(
      filePath,
      JSON.stringify(
        Object.fromEntries(Object.entries(newDict).sort(([a], [b]) => a.localeCompare(b))),
        null,
        2
      ) + "\n",
      "utf-8"
    );
    console.log(`Cleaned ${file}`);
  }

  console.log("Done cleaning i18n files.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
