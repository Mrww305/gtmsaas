import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import Landing from "./Landing";
import { Login, Signup, Verify, Onboarding } from "./AuthPages";
import AppShell from "./AppShell";
import { Spinner } from "./ui";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner label="Preparing your workspace" />
      </div>
    );
  }
  if (!user) return <Navigate to="/demo/login" state={{ from: location.pathname }} replace />;
  if (!user.verified) return <Navigate to="/demo/verify" replace />;
  if (!user.onboarded) return <Navigate to="/demo/onboarding" replace />;
  return <>{children}</>;
}

export default function DemoRoot() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <Routes>
          <Route index element={<Landing />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="verify" element={<Verify />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route
            path="app/*"
            element={
              <Protected>
                <AppShell />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/demo" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
