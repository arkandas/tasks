'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Settings, LogOut, ChevronDown } from 'lucide-react';
import { LanguagePicker } from '@/components/LanguageToggle';
import { ThemePicker } from '@/components/ThemeToggle';

interface UserMenuProps {
  onOpenSettings: () => void;
}

const sectionLabel = 'mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-faint';

export function UserMenu({ onOpenSettings }: UserMenuProps) {
  const t = useTranslations('userMenu');
  const tRoles = useTranslations('roles');
  const tTheme = useTranslations('theme');
  const tLanguage = useTranslations('language');
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (!session) return null;

  const initial = session.user.name?.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('accountMenu')}
        className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted sm:px-3"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-ink">
          {initial}
        </span>
        <div className="hidden text-left md:block">
          <div className="text-sm font-medium leading-tight text-ink">{session.user.name}</div>
          <div className="text-xs leading-tight text-ink-muted">{tRoles(session.user.role)}</div>
        </div>
        <ChevronDown size={16} className="text-ink-faint" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div role="menu" className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-line-strong bg-raised pb-1 shadow-xl dark:bg-surface">
            <div className="border-b border-line px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-base font-semibold text-accent-ink">
                  {initial}
                </span>
                <span className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">{session.user.name}</div>
                  <div className="truncate text-xs text-ink-muted">{session.user.email}</div>
                </span>
              </div>
            </div>

            <div className="space-y-2.5 border-b border-line px-3 pb-3 pt-2.5">
              <div>
                <div className={sectionLabel}>{tTheme('label')}</div>
                <ThemePicker />
              </div>
              <div>
                <div className={sectionLabel}>{tLanguage('label')}</div>
                <LanguagePicker />
              </div>
            </div>

            {session.user.role === 'ADMIN' && (
              <button
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-muted"
              >
                <Settings size={16} />
                {t('manageUsers')}
              </button>
            )}

            <button
              role="menuitem"
              onClick={() => signOut({ callbackUrl: '/login?signedOut=1' })}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
            >
              <LogOut size={16} />
              {t('signOut')}
            </button>

            <p className="mt-1 border-t border-line px-4 pb-1 pt-2 text-[11px] text-ink-faint">
              v{process.env.APP_VERSION}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
