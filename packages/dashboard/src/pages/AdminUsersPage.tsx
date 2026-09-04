import { FormEvent, useState } from 'react';
import {
  useListUsersQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useResetUserPasswordMutation,
} from '../features/admin/adminApi';
import { useAppSelector } from '../app/hooks';
import { SafeUser } from '../features/auth/authSlice';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingRow } from '../components/EmptyState';
import { PlusIcon } from '../components/icons';
import { formatDateTime, timeAgo } from '../lib/time';

export function AdminUsersPage() {
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const { data: users, isLoading } = useListUsersQuery();
  const [createUser, { isLoading: isCreating, error: createError }] = useCreateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [resetUserPassword] = useResetUserPasswordMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const [resetTarget, setResetTarget] = useState<SafeUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SafeUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    await createUser({ email, name, password, isAdmin }).unwrap();
    setEmail('');
    setName('');
    setPassword('');
    setIsAdmin(false);
    setShowCreate(false);
  }

  async function onResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    await resetUserPassword({ userId: resetTarget.id, newPassword }).unwrap();
    setResetTarget(null);
    setNewPassword('');
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Everyone with an account on this instance. Self-signup is disabled — accounts are created here."
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <PlusIcon width={14} height={14} />
            New user
          </Button>
        }
      />

      {isLoading && <LoadingRow label="Loading users…" />}

      {users && (
        <div className="border border-border rounded-lg overflow-hidden bg-surface">
          <div className="flex items-center gap-3 px-4 py-2 bg-raised border-b border-border text-2xs font-semibold uppercase tracking-wide text-faint">
            <span className="flex-1">User</span>
            <span className="w-24 text-right">Joined</span>
            <span className="w-60" />
          </div>

          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-raised/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink truncate">{user.name}</span>
                  {user.isAdmin && <Badge tone="accent">admin</Badge>}
                  {user.mustChangePassword && <Badge tone="warn">password pending</Badge>}
                  {user.id === currentUserId && <Badge tone="neutral">you</Badge>}
                </div>
                <div className="text-xs text-faint mt-1 truncate">{user.email}</div>
              </div>

              <div
                className="w-24 text-right text-xs text-muted"
                title={formatDateTime(user.createdAt)}
              >
                {timeAgo(user.createdAt)}
              </div>

              <div className="w-60 flex justify-end gap-2 whitespace-nowrap">
                <Button onClick={() => setResetTarget(user)}>Reset password</Button>
                <Button
                  variant="ghost"
                  disabled={user.id === currentUserId}
                  onClick={() => setDeleteTarget(user)}
                  className="hover:text-danger"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Create user" onClose={() => setShowCreate(false)}>
          <form className="flex flex-col gap-4" onSubmit={onCreate}>
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Initial password"
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="They'll be required to set their own password on first login."
              required
            />
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                className="accent-accent"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
              Grant platform admin access
            </label>
            {createError && <p className="text-sm text-danger">Could not create user</p>}
            <Button size="md" variant="primary" type="submit" disabled={isCreating}>
              {isCreating ? 'Creating…' : 'Create user'}
            </Button>
          </form>
        </Modal>
      )}

      {resetTarget && (
        <Modal title={`Reset password for ${resetTarget.name}`} onClose={() => setResetTarget(null)}>
          <form className="flex flex-col gap-4" onSubmit={onResetPassword}>
            <Input
              label="New password"
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              hint="They'll be required to change it again on next login."
              required
              autoFocus
            />
            <Button size="md" variant="primary" type="submit">
              Set new password
            </Button>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete user?"
          message={`${deleteTarget.name} (${deleteTarget.email}) will lose access immediately, along with their organization memberships.`}
          confirmLabel="Delete user"
          confirmVariant="danger"
          onConfirm={() => {
            deleteUser(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
