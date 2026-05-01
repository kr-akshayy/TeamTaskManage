import React, { useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { clearSession, getSession, setSession } from "../lib/auth.js";
import { TopNav } from "./components.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { SignupPage } from "./pages/SignupPage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { ProjectPage } from "./pages/ProjectPage.jsx";

function RequireAuth({ children }) {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export function App() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);

  const session = useMemo(() => {
    void tick;
    return getSession();
  }, [tick]);

  return (
    <div className="min-h-screen">
      <TopNav
        user={session?.user || null}
        onLogout={() => {
          clearSession();
          setTick((x) => x + 1);
          navigate("/login");
        }}
      />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <HomePage />
              </RequireAuth>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <RequireAuth>
                <ProjectPage />
              </RequireAuth>
            }
          />
          <Route
            path="/login"
            element={
              <LoginPage
                onAuthed={(payload) => {
                  setSession(payload);
                  setTick((x) => x + 1);
                  navigate("/");
                }}
              />
            }
          />
          <Route
            path="/signup"
            element={
              <SignupPage
                onAuthed={(payload) => {
                  setSession(payload);
                  setTick((x) => x + 1);
                  navigate("/");
                }}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

