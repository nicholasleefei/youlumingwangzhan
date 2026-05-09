import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LocaleLayout from "@/routes/LocaleLayout";
import RootRedirect from "@/routes/RootRedirect";
import Home from "@/pages/Home";
import ModelsList from "@/pages/ModelsList";
import ModelDetail from "@/pages/ModelDetail";
import ModelProfessionalDetail from "@/pages/ModelProfessionalDetail";
import ModelParams from "@/pages/ModelParams";
import ModelExterior from "@/pages/ModelExterior";
import ModelInterior from "@/pages/ModelInterior";
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
          <Route path="models/all" element={<ModelsList />} />
          <Route path="models/:category" element={<ModelsList />} />
          <Route path="models/:slug" element={<ModelDetail />} />
          <Route path="detail/:slug" element={<ModelProfessionalDetail />} />
          <Route path="models/:slug/params" element={<ModelParams />} />
          <Route path="models/:slug/exterior" element={<ModelExterior />} />
          <Route path="models/:slug/interior" element={<ModelInterior />} />
          <Route path="inquiry" element={<Inquiry />} />
        </Route>
        <Route path="/admin" element={<AdminApp />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Router>
  );
}
