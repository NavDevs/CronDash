'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  slackWebhook: string | null;
  alertEmail: string | null;
  apiKey: string;
}

export function ProfileMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  if (loading) {
    return (
      <span className="font-mono text-sm text-primary">[ ... ]</span>
    );
  }

  if (!user) {
    return (
      <Link href="/login" className="font-mono text-sm text-error hover:text-primary transition-colors">
        [ LOGIN ]
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="font-mono text-sm text-primary hover:text-secondary transition-colors flex items-center gap-2"
      >
        <span>[ {user.email.split('@')[0]} ]</span>
        <span className="text-xs">{showMenu ? '▲' : '▼'}</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-48 border border-border bg-background z-50">
          <div className="border-b border-border px-4 py-2">
            <div className="font-mono text-xs text-primary">
              {user.email}
            </div>
          </div>
          <Link
            href="/settings"
            className="block font-mono text-sm text-primary px-4 py-2 hover:bg-muted/20 transition-colors"
            onClick={() => setShowMenu(false)}
          >
            [ SETTINGS ]
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left font-mono text-sm text-error px-4 py-2 hover:bg-muted/20 transition-colors"
          >
            [ LOGOUT ]
          </button>
        </div>
      )}
    </div>
  );
}