'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Home() {
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const fullText = 'MANAGE YOUR CRON JOBS LIKE A PRO_';

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorTimer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-primary font-mono text-sm">~/crondash</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="font-mono text-sm text-muted hover:text-primary transition-colors">
              [ LOGIN ]
            </Link>
            <Link href="/signup" className="font-mono text-sm text-muted hover:text-primary transition-colors">
              [ SIGN UP ]
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-4xl w-full space-y-12">
          {/* Logo */}
          <div className="flex justify-center">
            <Logo />
          </div>

          {/* Hero Text with Typewriter Effect */}
          <div className="text-center space-y-4">
            <div className="font-mono text-2xl md:text-4xl text-primary">
              <span>{typedText}</span>
              <span className={`animate-blink ${showCursor ? 'opacity-100' : 'opacity-0'}`}>█</span>
            </div>
            <p className="font-mono text-primary text-sm md:text-base max-w-2xl mx-auto">
              A visual cron job manager with terminal-style interface. Schedule, monitor, and manage your automated tasks with precision.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="primary">
              <Link href="/signup">GET STARTED</Link>
            </Button>
            <Button variant="secondary">
              <Link href="/login">LOGIN</Link>
            </Button>
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
                  &gt; Configure headers & body
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
      <footer className="border-t border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between font-mono text-xs text-primary">
          <span>© 2026 CRONDASH</span>
          <span>BUILT WITH NEXT.JS + TAILWIND</span>
        </div>
      </footer>
    </div>
  );
}
