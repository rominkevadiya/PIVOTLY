import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AnalyzePage } from "../pages/AnalyzePage";
import { HomePage } from "../pages/HomePage";
import { ReportPage } from "../pages/ReportPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/reports/:reportId" element={<ReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
