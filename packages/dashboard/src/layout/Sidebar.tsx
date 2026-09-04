import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { useWorkspace } from '../app/useWorkspace';
import { setCurrentOrganization } from '../features/organizations/currentOrganizationSlice';
import { useLogOutMutation } from '../features/auth/authApi';
import { clearCredentials } from '../features/auth/authSlice';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useGetHealthQuery } from '../features/health/healthApi';
import { Dot } from '../components/Badge';
import {
  AlertsIcon,
  IssuesIcon,
  LogoutIcon,
  PerformanceIcon,
  SettingsIcon,
  UptimeIcon,
  UsersIcon,
  NodesIcon,
} from '../components/icons';

const NAV_ITEMS = [
  { to: '/issues', label: 'Issues', Icon: IssuesIcon },
  { to: '/performance', label: 'Performance', Icon: PerformanceIcon },
  { to: '/nodes', label: 'Nodes', Icon: NodesIcon },
  { to: '/uptime', label: 'Uptime', Icon: UptimeIcon },
  { to: '/alerts', label: 'Alerts', Icon: AlertsIcon },
];

export function Sidebar() {
  const user = useAppSelector((s) => s.auth.user);
  const { organizations, organizationId } = useWorkspace();
  const { data: health } = useGetHealthQuery();
  const [logOut] = useLogOutMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  async function onConfirmLogout() {
    setConfirmingLogout(false);
    await logOut().catch(() => undefined);
    dispatch(clearCredentials());
    navigate('/login');
  }

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
      isActive
        ? 'bg-accent/15 text-accentSoft font-medium'
        : 'text-muted hover:text-ink hover:bg-raised'
    }`;

  return (
    <aside className="w-56 shrink-0 bg-surface border-r border-border flex flex-col h-screen sticky top-0">
      <div className="px-3 py-4 border-b border-border">
        <div className="flex items-center gap-2 px-1 mb-3">
          <span className="w-6 h-6 rounded bg-accent flex items-center justify-center text-white text-xs font-bold">
            n
          </span>
          <span className="text-sm font-semibold tracking-tight">amonitor</span>
        </div>

        <select
          className="w-full bg-bg border border-border rounded-md px-2 py-1.5 text-xs text-ink focus:outline-none focus:border-accent"
          value={organizationId ?? ''}
          onChange={(e) => dispatch(setCurrentOrganization(e.target.value))}
          aria-label="Organization"
        >
          {organizations.length === 0 && <option value="">No organization</option>}
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={linkClasses}>
            <Icon />
            {label}
          </NavLink>
        ))}

        <div className="mt-4 mb-1 px-2.5 text-2xs font-semibold uppercase tracking-wide text-faint">
          Settings
        </div>
        <NavLink to="/settings/projects" className={linkClasses}>
          <SettingsIcon />
          Projects
        </NavLink>
        {user?.isAdmin && (
          <NavLink to="/admin/users" className={linkClasses}>
            <UsersIcon />
            Users
          </NavLink>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-1.5 px-1 mb-2 text-2xs text-faint">
          <Dot tone={health ? 'good' : 'neutral'} />
          API {health ? health.status : 'unreachable'}
        </div>
        <div className="text-xs text-muted px-1 truncate mb-2" title={user?.email}>
          {user?.email}
        </div>
        <div className="flex gap-1.5">
          <NavLink
            to="/change-password"
            className="flex-1 text-xs text-muted hover:text-ink px-2 py-1.5 rounded-md hover:bg-raised transition-colors text-center"
          >
            Password
          </NavLink>
          <button
            onClick={() => setConfirmingLogout(true)}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-danger px-2 py-1.5 rounded-md hover:bg-raised transition-colors"
          >
            <LogoutIcon width={14} height={14} />
            Log out
          </button>
        </div>
      </div>

      {confirmingLogout && (
        <ConfirmDialog
          title="Log out?"
          message="You'll need to log back in to access your projects."
          confirmLabel="Log out"
          confirmVariant="danger"
          onConfirm={onConfirmLogout}
          onCancel={() => setConfirmingLogout(false)}
        />
      )}
    </aside>
  );
}
