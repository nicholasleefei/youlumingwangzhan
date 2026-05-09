import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AdminApp from "./AdminApp";
import "../index.css";
import i18n, { setDocumentLocale } from "../i18n/i18n";

i18n.changeLanguage("zh-CN");
setDocumentLocale("zh-CN");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>
);
