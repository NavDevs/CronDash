'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Server error. Please restart the dev server.');
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Logged in — redirect to dashboard or original page
      const from = searchParams.get('from') || '/dashboard';
      router.push(from);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="EMAIL"
          prompt="user@crondash:~$"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="enter your email"
          required
        />
        <Input
          label="PASSWORD"
          prompt="user@crondash:~$"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="enter your password"
          required
        />
      </div>

      {error && (
        <div className="font-mono text-sm text-error">
          [ERROR] {error}
        </div>
      )}

      <div className="flex items-center justify-between font-mono text-xs text-primary">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-primary" />
          <span>REMEMBER ME</span>
        </label>
        <span className="hover:text-primary transition-colors cursor-pointer">
          FORGOT PASSWORD?
        </span>
      </div>

      <Button variant="primary" className="w-full" type="submit" disabled={loading}>
        {loading ? 'AUTHENTICATING...' : 'LOGIN'}
      </Button>

      <div className="text-center font-mono text-sm text-primary">
        <span>NEW USER? </span>
        <Link href="/signup" className="text-primary hover:text-secondary transition-colors">
          [ SIGN UP ]
        </Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-mono text-sm text-primary hover:text-secondary transition-colors">
            ~/crondash
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="font-mono text-sm text-primary">[ LOGIN ]</Link>
            <Link href="/signup" className="font-mono text-sm text-primary hover:text-primary transition-colors">
              [ SIGN UP ]
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <Logo />
          </div>

          <Card title="AUTHENTICATION">
            <Suspense fallback={<div className="font-mono text-sm text-primary">Loading...</div>}>
              <LoginForm />
            </Suspense>
          </Card>

          <div className="text-center font-mono text-xs text-primary">
            <span className="text-primary">[INFO]</span> ENTER YOUR CREDENTIALS TO ACCESS THE DASHBOARD
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between font-mono text-xs text-primary">
          <span>© 2026 CRONDASH</span>
          <span>TERMINAL ACCESS GRANTED</span>
        </div>
      </footer>
    </div>
  );
}