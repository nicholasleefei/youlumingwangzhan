# React + TypeScript + Vite

## i18n 多语言维护

- 语言文件：`src/i18n/messages/*.json`（`en.json` 作为主语言基准）。
- 当你新增/修改页面文案并新增 `t("...")` 键后：
  - `npm.cmd run i18n:sync`：自动补齐缺失键（其它语言默认回填英文），并生成报告 `.trae/i18n/report.json`。
  - `npm.cmd run i18n:check`：只校验是否缺少键（不写文件）。
  - `npm.cmd run i18n:audit`：生成翻译覆盖审计报告（哪些语言仍大量等同英文）。

提示：`npm run dev` 会自动先执行一次 `i18n:sync`（通过 `predev`），避免开发过程中出现缺失键。

### 可选：用 AI 自动翻译缺失键

- 优先使用 Gemini：在 `.env.local` 或系统环境变量中配置 `GOOGLE_API_KEY` 后运行 `npm.cmd run i18n:sync:ai`。
- 也可使用 OpenAI：配置 `OPENAI_API_KEY` 后运行 `npm.cmd run i18n:sync:ai`。
- 未配置任何密钥时会回退为英文。

说明：`i18n:sync:ai` 会翻译“缺失键”以及“和英文完全相同的键”（用于修复看起来像没翻译的情况）。

提示：报告 `.trae/i18n/report.json` 里会记录各语言的 `missingByLocale` 和 `sameAsEnByLocale`。
审计报告 `.trae/i18n/audit.json` 会额外统计 `likelyEnglish`（非英文语种中疑似仍是英文的文案）。

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  extends: [
    // other configs...
    // Enable lint rules for React
    reactX.configs['recommended-typescript'],
    // Enable lint rules for React DOM
    reactDom.configs.recommended,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```
