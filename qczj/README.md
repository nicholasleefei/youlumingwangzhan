# React + TypeScript + Vite

## 本地开发

1. `npm install`
2. `npm run dev`

前端默认端口：`http://localhost:21000/`
后端默认端口：`http://localhost:22000/`

## 抓取参数（可选）

- `IMG_MAX_PAGES`：每个“车型+类型”最多翻页数（默认 `20`）
- `IMG_MAX_IMAGES`：每个“车型+类型”最多图片数（默认 `300`）
- `IMG_MAX_EXTERIOR`：外观图最多下载数量（默认 `60`）
- `IMG_MAX_INTERIOR`：内饰图最多下载数量（默认 `60`）
- `IMG_MAX_DETAIL`：细节图最多下载数量（默认 `60`）
- `IMG_MAX_OFFICIAL`：官图最多下载数量（默认 `60`）
- `SPEC_MAX`：最多处理的车型（配置）数量（默认不限制）
- `INCLUDE_DISCONTINUED`：是否包含停售车型（默认 `false`，只下载在售）

## 输出方式

- 默认：后端直接把文件写到项目目录下的 `downloads/`（可在首页“下载设置”修改为其他绝对路径）

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
