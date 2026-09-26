'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProviders } from 'next-auth/react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TasksMark } from '@/components/TasksMark';

export default function SetupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch('/api/users/check');
        const data = await response.json();
        if (data.hasUsers) {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Failed to check setup status:', error);
      }
    };
    checkSetup();
  }, [router]);

  useEffect(() => {
    getProviders()
      .then(providers => {
        if (providers?.oidc) router.replace('/login');
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: 'ADMIN',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }

      router.push('/login?setup=success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const label = 'mb-1.5 block text-sm font-semibold text-ink';

  return (
    <div className="login-page relative flex min-h-dvh items-center justify-center px-5">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <main className="dialog-panel relative w-full max-w-[420px] rounded-2xl border border-line shadow-[0_2px_4px_rgba(0,0,0,0.04),0_28px_64px_-32px_rgba(0,0,0,0.4)]">
        <header className="flex items-center gap-4 rounded-t-2xl border-b border-line bg-raised px-6 py-6 sm:px-7">
          <TasksMark size={52} />
          <span className="flex flex-col">
            <span className="text-[29px] font-semibold leading-none tracking-tight text-ink">Tasks</span>
            <span className="mt-2 text-[15px] text-ink-muted">Create the administrator account</span>
          </span>
        </header>

        <div className="rounded-b-2xl bg-surface px-6 py-7 sm:px-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className={label}>
                Username
              </label>
              <Input
                id="username"
                type="text"
                name="username"
                autoComplete="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="email" className={label}>
                Email
              </label>
              <Input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className={label}>
                Password
              </label>
              <Input
                id="password"
                type="password"
                name="password"
                autoComplete="new-password"
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className={label}>
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger"
              >
                <AlertTriangle size={16} className="mt-px shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full text-base disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create admin account'
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-ink-muted">
            This account has administrator privileges. You can add more users later.
          </p>
        </div>
      </main>
    </div>
  );
}
