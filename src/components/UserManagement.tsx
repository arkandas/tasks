'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { X, Trash2, UserPlus, Shield, User, AlertTriangle } from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
  created_at: string;
}

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_FORM = { username: '', email: '', password: '', role: 'USER' as 'ADMIN' | 'USER' };

export function UserManagement({ isOpen, onClose }: UserManagementProps) {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const loadUsers = () =>
    fetch('/api/users')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load users');
        return response.json();
      })
      .then(setUsers)
      .catch(error => console.error('Failed to load users:', error))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (isOpen && session?.user.role === 'ADMIN') {
      loadUsers();
    }
  }, [isOpen, session]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }

      await loadUsers();
      setShowCreateForm(false);
      setFormData(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setDeleteError('');

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      await loadUsers();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center">
      <div className="fixed inset-0 bg-scrim sm:backdrop-blur-xs" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="User Management"
        className="dialog-panel relative z-10 flex w-full max-w-3xl flex-col rounded-2xl border border-line-strong bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between rounded-t-2xl border-b border-line bg-raised px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-lg font-bold text-ink sm:text-xl">User Management</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-muted hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-4 sm:p-6">
          {showCreateForm ? (
            <form onSubmit={handleCreateUser} className="mb-6 space-y-4">
              <h3 className="mb-4 text-base font-semibold text-ink">Create New User</h3>

              <div>
                <label htmlFor="new-username" className="mb-1.5 block text-sm font-medium text-ink-muted">
                  Username
                </label>
                <Input
                  id="new-username"
                  type="text"
                  autoComplete="off"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label htmlFor="new-email" className="mb-1.5 block text-sm font-medium text-ink-muted">
                  Email
                </label>
                <Input
                  id="new-email"
                  type="email"
                  autoComplete="off"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-ink-muted">
                  Password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Enter password (min. 6 characters)"
                />
              </div>

              <div>
                <label htmlFor="new-role" className="mb-1.5 block text-sm font-medium text-ink-muted">
                  Role
                </label>
                <Select
                  id="new-role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'USER' })}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </Select>
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
                  <AlertTriangle size={16} className="mt-px shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit">
                  Create User
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData(EMPTY_FORM);
                    setError('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setShowCreateForm(true)} className="mb-6">
              <UserPlus size={16} className="mr-2" />
              Add New User
            </Button>
          )}

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              Users
              <span className="tabular-nums">{users.length}</span>
            </h3>

            {deleteError && (
              <div role="alert" className="mb-3 flex items-start gap-2 rounded-lg border border-danger/40 bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
                <AlertTriangle size={16} className="mt-px shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {loading && users.length === 0 ? (
              <div className="py-8 text-center text-sm text-ink-muted">Loading users...</div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card p-3 sm:p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-accent-ink">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">{user.username}</div>
                        <div className="truncate text-sm text-ink-muted">{user.email}</div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                      {confirmDeleteId === user.id ? (
                        <>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="rounded-lg bg-danger px-2.5 py-1.5 text-xs font-semibold text-accent-ink"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg px-2 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            user.role === 'ADMIN'
                              ? 'bg-accent-soft text-accent'
                              : 'bg-canvas text-ink-muted'
                          }`}>
                            {user.role === 'ADMIN' ? <Shield size={12} /> : <User size={12} />}
                            {user.role}
                          </div>

                          {session?.user.id !== user.id.toString() && (
                            <button
                              onClick={() => {
                                setDeleteError('');
                                setConfirmDeleteId(user.id);
                              }}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
                              title="Delete user"
                              aria-label={`Delete ${user.username}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
