import type { PropsWithChildren } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthBootstrap } from './app/AuthBootstrap';
import { RequireAuth } from './app/RequireAuth';
import { RequirePasswordChange } from './app/RequirePasswordChange';
import { RequireAdmin } from './app/RequireAdmin';
import { AppLayout } from './layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { IssuesPage } from './pages/IssuesPage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import { PerformancePage } from './pages/PerformancePage';
import { TraceDetailPage } from './pages/TraceDetailPage';
import { UptimePage } from './pages/UptimePage';
import { NodesPage } from './pages/NodesPage';
import { NodeDetailPage } from './pages/NodeDetailPage';
import { AlertsPage } from './pages/AlertsPage';
import { ProjectsSettingsPage } from './pages/ProjectsSettingsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';

/** Logged in, past any forced password change, rendered inside the app shell. */
function Protected({ children }: PropsWithChildren) {
  return (
    <RequireAuth>
      <RequirePasswordChange>
        <AppLayout>{children}</AppLayout>
      </RequirePasswordChange>
    </RequireAuth>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/change-password"
            element={
              <RequireAuth>
                <ChangePasswordPage />
              </RequireAuth>
            }
          />

          <Route path="/" element={<Navigate to="/issues" replace />} />

          <Route
            path="/issues"
            element={
              <Protected>
                <IssuesPage />
              </Protected>
            }
          />
          <Route
            path="/issues/:issueId"
            element={
              <Protected>
                <IssueDetailPage />
              </Protected>
            }
          />
          <Route
            path="/performance"
            element={
              <Protected>
                <PerformancePage />
              </Protected>
            }
          />
          <Route
            path="/performance/traces/:traceId"
            element={
              <Protected>
                <TraceDetailPage />
              </Protected>
            }
          />
          <Route
            path="/nodes"
            element={
              <Protected>
                <NodesPage />
              </Protected>
            }
          />
          <Route
            path="/nodes/:instanceId"
            element={
              <Protected>
                <NodeDetailPage />
              </Protected>
            }
          />
          <Route
            path="/uptime"
            element={
              <Protected>
                <UptimePage />
              </Protected>
            }
          />
          <Route
            path="/alerts"
            element={
              <Protected>
                <AlertsPage />
              </Protected>
            }
          />
          <Route
            path="/settings/projects"
            element={
              <Protected>
                <ProjectsSettingsPage />
              </Protected>
            }
          />
          <Route
            path="/admin/users"
            element={
              <Protected>
                <RequireAdmin>
                  <AdminUsersPage />
                </RequireAdmin>
              </Protected>
            }
          />

          <Route path="*" element={<Navigate to="/issues" replace />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  );
}
