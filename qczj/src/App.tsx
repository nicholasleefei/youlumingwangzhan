import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import JobProgress from "@/pages/JobProgress";
import JobResult from "@/pages/JobResult";
import PcautoHome from "@/pages/PcautoHome";
import PcautoJobProgress from "@/pages/PcautoJobProgress";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs/:jobId" element={<JobProgress />} />
        <Route path="/jobs/:jobId/result" element={<JobResult />} />
        <Route path="/pcauto" element={<PcautoHome />} />
        <Route path="/pcauto-jobs/:jobId" element={<PcautoJobProgress />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
