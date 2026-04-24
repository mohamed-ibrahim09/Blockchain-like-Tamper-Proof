import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/layout/AppShell";
import { AboutPage } from "./pages/AboutPage";
import { ChainPage } from "./pages/ChainPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { CreateLogPage } from "./pages/CreateLogPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { VerificationPage } from "./pages/VerificationPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/create" element={<CreateLogPage />} />
        <Route path="/chain" element={<ChainPage />} />
        <Route path="/verification" element={<VerificationPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

