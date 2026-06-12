'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  function validateForm() {
    const newErrors: typeof errors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    // Confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
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
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Account created and auto-logged in — redirect to dashboard
      const from = searchParams.get('from') || '/dashboard';
      router.push(from);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignup} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Input
            label="EMAIL"
            prompt="user@crondash:~$"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors({ ...errors, email: undefined });
            }}
            placeholder="enter your email"
            required
          />
          {errors.email && (
            <p className="font-mono text-xs text-error mt-1">[ERROR] {errors.email}</p>
          )}
        </div>

        <div>
          <Input
            label="PASSWORD"
            prompt="user@crondash:~$"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors({ ...errors, password: undefined });
            }}
            placeholder="enter a strong password"
            required
          />
          {errors.password && (
            <p className="font-mono text-xs text-error mt-1">[ERROR] {errors.password}</p>
          )}
          {!errors.password && password && (
            <p className="font-mono text-xs text-primary mt-1">[INFO] Min 8 chars, 1 uppercase, 1 number</p>
          )}
        </div>

        <div>
          <Input
            label="CONFIRM PASSWORD"
            prompt="user@crondash:~$"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrors({ ...errors, confirmPassword: undefined });
            }}
            placeholder="confirm your password"
            required
          />
          {errors.confirmPassword && (
            <p className="font-mono text-xs text-error mt-1">[ERROR] {errors.confirmPassword}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="font-mono text-sm text-error">
          [ERROR] {error}
        </div>
      )}

      <div className="flex items-start gap-2 font-mono text-xs text-primary">
        <input type="checkbox" className="accent-primary mt-1" required />
        <span>
          I AGREE TO THE <span className="text-primary hover:text-secondary cursor-pointer">TERMS OF SERVICE</span> AND <span className="text-primary hover:text-secondary cursor-pointer">PRIVACY POLICY</span>
        </span>
      </div>

      <Button variant="primary" className="w-full" type="submit" disabled={loading}>
        {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
      </Button>

      <div className="text-center font-mono text-sm text-primary">
        <span>ALREADY HAVE AN ACCOUNT? </span>
        <Link href="/login" className="text-primary hover:text-secondary transition-colors">
          [ LOGIN ]
        </Link>
      </div>
    </form>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-mono text-sm text-primary hover:text-secondary transition-colors">
            ~/crondash
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="font-mono text-sm text-primary hover:text-primary transition-colors">
              [ LOGIN ]
            </Link>
            <Link href="/signup" className="font-mono text-sm text-primary">[ SIGN UP ]</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <Logo />
          </div>

          <Card title="CREATE ACCOUNT">
            <Suspense fallback={<div className="font-mono text-sm text-primary">Loading...</div>}>
              <SignupForm />
            </Suspense>
          </Card>

          <div className="text-center font-mono text-xs text-primary">
            <span className="text-primary">[INFO]</span> CREATE AN ACCOUNT TO START MANAGING YOUR CRON JOBS
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between font-mono text-xs text-primary">
          <span>© 2026 CRONDASH</span>
          <span>NEW USER REGISTRATION</span>
        </div>
      </footer>
    </div>
  );
}