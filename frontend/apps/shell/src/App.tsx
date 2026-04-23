import { Suspense, lazy, type ReactNode } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { useAuthSession } from "@sashecka/auth-session/react";
import { PageLoader, RemoteErrorBoundary } from "@sashecka/shared-ui";

import { ShellLayout } from "./layouts/ShellLayout";
import { VueProfileRoute } from "./routes/VueProfileRoute";

const LoginPage = lazy(() =>
  import("authRemote/login-page").then((module) => ({
    default: module.LoginPage,
  })),
);

const RegisterPage = lazy(() =>
  import("authRemote/register-page").then((module) => ({
    default: module.RegisterPage,
  })),
);

const HomePage = lazy(() =>
  import("reactAppRemote/home-page").then((module) => ({
    default: module.HomePage,
  })),
);

const SettingsPage = lazy(() =>
  import("reactAppRemote/settings-page").then((module) => ({
    default: module.SettingsPage,
  })),
);

const GroupPage = lazy(() =>
  import("reactAppRemote/group-page").then((module) => ({
    default: module.GroupPage,
  })),
);

function AuthOnlyRoute() {
  const { token } = useAuthSession();
  if (token) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

function ProtectedRoute() {
  const { token } = useAuthSession();
  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  return <ShellLayout />;
}

function RemotePage({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <RemoteErrorBoundary>
      <Suspense fallback={<PageLoader label={label} />}>{children}</Suspense>
    </RemoteErrorBoundary>
  );
}

export function App() {
  const { token } = useAuthSession();

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={token ? "/app" : "/auth/login"} replace />}
      />
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/register" element={<Navigate to="/auth/register" replace />} />

      <Route element={<AuthOnlyRoute />}>
        <Route
          path="/auth/login"
          element={
            <RemotePage label="Загружаем страницу входа...">
              <LoginPage />
            </RemotePage>
          }
        />
        <Route
          path="/auth/register"
          element={
            <RemotePage label="Загружаем страницу регистрации...">
              <RegisterPage />
            </RemotePage>
          }
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route
          path="/app"
          element={
            <RemotePage label="Загружаем главную страницу...">
              <HomePage />
            </RemotePage>
          }
        />
        <Route
          path="/profile"
          element={
            <RemotePage label="Загружаем профиль...">
              <VueProfileRoute />
            </RemotePage>
          }
        />
        <Route
          path="/settings"
          element={
            <RemotePage label="Загружаем настройки...">
              <SettingsPage />
            </RemotePage>
          }
        />
        <Route
          path="/groups/:groupId"
          element={
            <RemotePage label="Загружаем страницу группы...">
              <GroupPage />
            </RemotePage>
          }
        />
      </Route>
    </Routes>
  );
}
