import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import LocaleLayout from "@/routes/LocaleLayout";
import RootRedirect from "@/routes/RootRedirect";
import Home from "@/pages/Home";
import ModelProfessionalDetail from "@/pages/ModelProfessionalDetail";
import ModelDetail from "@/pages/ModelDetail";
import SeriesDetail from "@/pages/SeriesDetail";
import Inquiry from "@/pages/Inquiry";
import BrandsList from "@/pages/BrandsList";
import AdminApp from "@/admin/AdminApp";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/:locale" element={<LocaleLayout />}>
          <Route index element={<Home />} />
          <Route path="brands" element={<BrandsList />} />
          <Route path="series/:id" element={<SeriesDetail />} />
          <Route path="model/:id" element={<ModelDetail />} />
          <Route path="models/all" element={<Navigate to="../brands" replace />} />
          <Route path="models/:slug" element={<ModelProfessionalDetail />} />
          <Route path="inquiry" element={<Inquiry />} />
        </Route>
        <Route path="/admin" element={<AdminApp />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
      <Analytics />
    </Router>
  );
}
