import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import SignupPage from "./pages/signup";
import SigninPage from "./pages/signin";
import DashboardPage from "./pages/dashboard";
import SharedContentPage from "./pages/shared-content";
import { getStoredToken } from "./lib/auth";

function AuthShell() {
  return (
    <div className="min-h-full bg-canvas dark:bg-canvas-dark">
      <Outlet />
    </div>
  );
}

function RequireAuth() {
  const location = useLocation();
  const token = getStoredToken();

  if (!token) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function RedirectIfAuthenticated() {
  const token = getStoredToken();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AuthShell />}>
        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signin" element={<SigninPage />} />
        </Route>

        <Route path="/shared/:shareLink" element={<SharedContentPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
