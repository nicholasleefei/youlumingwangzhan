import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import LocaleLayout from "@/routes/LocaleLayout";
import RootRedirect from "@/routes/RootRedirect";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Home = lazy(() => import("@/pages/Home"));
const ModelProfessionalDetail = lazy(() => import("@/pages/ModelProfessionalDetail"));
const SeriesDetail = lazy(() => import("@/pages/SeriesDetail"));
const Inquiry = lazy(() => import("@/pages/Inquiry"));
const BrandsList = lazy(() => import("@/pages/BrandsList"));
const AdminApp = lazy(() => import("@/admin/AdminApp"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 border-t-zinc-600" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/:locale" element={<LocaleLayout />}>
              <Route index element={<Home />} />
              <Route path="brands" element={<BrandsList />} />
              <Route path="series/:id" element={<SeriesDetail />} />
              <Route path="models/all" element={<Navigate to="../brands" replace />} />
              <Route path="models/:slug" element={<ModelProfessionalDetail />} />
              <Route path="inquiry" element={<Inquiry />} />
            </Route>
            <Route path="/admin" element={<AdminApp />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}
