'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { toast } from '@/components/Toast';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Show Google OAuth errors
  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      const messages: Record<string, string> = {
        google_denied: 'Google sign-in was cancelled',
        missing_params: 'Invalid OAuth response',
        invalid_state: 'Security check failed. Please try again',
        token_exchange_failed: 'Failed to authenticate with Google',
        userinfo_failed: 'Failed to get Google account info',
        no_email: 'No email found in Google account',
        oauth_not_configured: 'Google sign-in is not configured',
        server_error: 'Something went wrong. Please try again',
      };
      setError(messages[err] || 'Login failed');
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      toast('Logged in successfully', 'success');
      router.push('/dashboard');
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-primary font-mono text-sm hover:text-secondary transition-colors">
            ~/crondash
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <Logo />
          </div>

          <Card title="LOGIN">
            <div className="space-y-6">
              {/* Google Sign-In */}
              <button
                onClick={() => window.location.href = '/api/auth/google'}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border bg-white/5 hover:bg-white/10 text-primary font-mono text-sm transition-colors"
              >
                <GoogleIcon />
                SIGN IN WITH GOOGLE
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 border-t border-border"></div>
                <span className="font-mono text-xs text-primary/50">── OR ──</span>
                <div className="flex-1 border-t border-border"></div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="EMAIL"
                  prompt=">"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
                <Input
                  label="PASSWORD"
                  prompt=">"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                {error && (
                  <div className="font-mono text-sm text-error">
                    [ERROR] {error}
                  </div>
                )}

                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? 'AUTHENTICATING...' : 'LOGIN'}
                </Button>

                <div className="font-mono text-sm text-primary text-center">
                  No account?{' '}
                  <Link href="/signup" className="text-secondary hover:text-primary transition-colors">
                    Sign up
                  </Link>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between font-mono text-xs text-primary">
          <span>© 2026 CRONDASH</span>
          <span>LOGIN</span>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
