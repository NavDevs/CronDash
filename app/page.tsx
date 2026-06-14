'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProfileMenu } from '@/components/ui/ProfileMenu';

export default function Home() {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [typedText, setTypedText] = useState('');
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const lines = [
    'MANAGE YOUR CRON JOBS LIKE A PRO',
    'SCHEDULE. MONITOR. ALERT.',
    'YOUR TERMINAL FOR CRON JOBS',
  ];

  // Check auth status
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        setIsSignedIn(res.ok);
      })
      .catch(() => {
        setIsSignedIn(false);
      });
  }, []);

  // Typewriter effect
  useEffect(() => {
    const currentLine = lines[lineIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && charIndex < currentLine.length) {
      timeout = setTimeout(() => {
        setTypedText(currentLine.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 80);
    } else if (!isDeleting && charIndex === currentLine.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && charIndex > 0) {
      timeout = setTimeout(() => {
        setTypedText(currentLine.slice(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      }, 40);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setLineIndex((lineIndex + 1) % lines.length);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, lineIndex]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-primary font-mono text-sm">~/crondash</span>
          </div>
          <nav className="flex items-center gap-6">
            <ProfileMenu />
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-4xl w-full space-y-12">
          {/* Logo */}
          <div className="flex justify-center">
            <Logo />
          </div>

          {/* Hero Text with Typewriter Effect */}
          <div className="text-center space-y-4">
            <div className="font-mono text-2xl md:text-4xl text-primary min-h-[2.5rem] md:min-h-[3rem]">
              <span>{typedText}</span><span className="animate-blink">_</span>
            </div>
            <p className="font-mono text-primary text-sm md:text-base max-w-2xl mx-auto">
              A visual cron job manager with terminal-style interface. Schedule, monitor, and manage your automated tasks with precision.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isSignedIn === null ? (
              <div className="font-mono text-sm text-primary animate-pulse">LOADING...</div>
            ) : isSignedIn ? (
              <Button variant="primary" href="/dashboard">
                DASHBOARD
              </Button>
            ) : (
              <>
                <Button variant="primary" href="/signup">
                  GET STARTED
                </Button>
                <Button variant="secondary" href="/login">
                  LOGIN
                </Button>
              </>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 pt-12">
            <Card title="SCHEDULE">
              <div className="space-y-3">
                <p className="font-mono text-sm text-primary">
                  &gt; Define cron expressions
                </p>
                <p className="font-mono text-sm text-primary">
                  &gt; Set HTTP endpoints
                </p>
                <p className="font-mono text-sm text-primary">
                  &gt; Configure headers &amp; body
                </p>
              </div>
            </Card>

            <Card title="MONITOR">
              <div className="space-y-3">
                <p className="font-mono text-sm text-primary">
                  &gt; Real-time status tracking
                </p>
                <p className="font-mono text-sm text-primary">
                  &gt; Run history logs
                </p>
                <p className="font-mono text-sm text-primary">
                  &gt; Success/failure metrics
                </p>
              </div>
            </Card>

            <Card title="ALERT">
              <div className="space-y-3">
                <p className="font-mono text-sm text-primary">
                  &gt; Slack webhooks
                </p>
                <p className="font-mono text-sm text-primary">
                  &gt; Email notifications
                </p>
                <p className="font-mono text-sm text-primary">
                  &gt; Custom alert rules
                </p>
              </div>
            </Card>
          </div>

          {/* How It Works */}
          <div className="pt-12 space-y-6">
            <h2 className="font-mono text-xl text-primary text-center">
              // HOW IT WORKS
            </h2>
            <div className="space-y-4 font-mono text-sm text-primary max-w-2xl mx-auto">
              <div className="flex items-start gap-4">
                <span className="text-secondary">01.</span>
                <p>Create a cron job with your desired schedule (e.g., */5 * * * *)</p>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-secondary">02.</span>
                <p>Configure the HTTP endpoint to call (POST/GET with custom headers)</p>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-secondary">03.</span>
                <p>Monitor execution in real-time with detailed logs and status codes</p>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-secondary">04.</span>
                <p>Receive alerts on failures via Slack or email</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs text-primary">
          <span>© 2026 CRONDASH</span>
          <span>BUILT WITH NEXT.JS + TAILWIND</span>
        </div>
      </footer>
    </div>
  );
}
