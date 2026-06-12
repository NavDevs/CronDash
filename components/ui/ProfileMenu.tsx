'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser, useClerk } from '@clerk/nextjs';

export function ProfileMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) {
    return (
      <Link href="/login" className="font-mono text-sm text-error hover:text-primary transition-colors">
        [ LOGIN ]
      </Link>
    );
  }

  const email = user.emailAddresses[0]?.emailAddress || '';
  const displayName = email.split('@')[0];

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="font-mono text-sm text-primary hover:text-secondary transition-colors flex items-center gap-2"
      >
        <span>[ {displayName} ]</span>
        <span className="text-xs">{showMenu ? '▲' : '▼'}</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-48 border border-border bg-background z-50">
          <div className="border-b border-border px-4 py-2">
            <div className="font-mono text-xs text-primary">{email}</div>
          </div>
          <Link
            href="/settings"
            className="block font-mono text-sm text-primary px-4 py-2 hover:bg-muted/20 transition-colors"
            onClick={() => setShowMenu(false)}
          >
            [ SETTINGS ]
          </Link>
          <button
            onClick={() => signOut()}
            className="w-full text-left font-mono text-sm text-error px-4 py-2 hover:bg-muted/20 transition-colors"
          >
            [ LOGOUT ]
          </button>
        </div>
      )}
    </div>
  );
}
