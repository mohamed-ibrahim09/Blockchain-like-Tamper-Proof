import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AppShell } from "./components/layout/AppShell";
import { AboutPage } from "./pages/AboutPage";
import { ChainPage } from "./pages/ChainPage";
import { CryptoAdminPage } from "./pages/CryptoAdminPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { CreateLogPage } from "./pages/CreateLogPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { VerificationPage } from "./pages/VerificationPage";
import { isAuthenticated } from "./lib/auth";

function ProtectedRoute({ children }) {
  const location = useLocation();
  
  if (!isAuthenticated()) {
    // Redirect to login, saving the attempted URL for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
}

function AuthenticatedLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

function PublicRoute({ children }) {
  // Redirect authenticated users away from login to home
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes - only login is accessible when not authenticated */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      
      {/* Protected routes - require authentication */}
      <Route
        path="/"
        element={
          <AuthenticatedLayout>
            <LandingPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/dashboard"
        element={
          <AuthenticatedLayout>
            <DashboardPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/create"
        element={
          <AuthenticatedLayout>
            <CreateLogPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/chain"
        element={
          <AuthenticatedLayout>
            <ChainPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/verification"
        element={
          <AuthenticatedLayout>
            <VerificationPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/statistics"
        element={
          <AuthenticatedLayout>
            <StatisticsPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/about"
        element={
          <AuthenticatedLayout>
            <AboutPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/admin/crypto"
        element={
          <AuthenticatedLayout>
            <CryptoAdminPage />
          </AuthenticatedLayout>
        }
      />
      
      {/* Catch-all: redirect unauthenticated to login, authenticated to home */}
      <Route path="*" element={<Navigate to={isAuthenticated() ? "/" : "/login"} replace />} />
    </Routes>
  );
}

