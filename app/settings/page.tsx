'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ProfileMenu } from '@/components/ui/ProfileMenu';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [slackWebhook, setSlackWebhook] = useState('');
  const [alertEmail, setAlertEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Messages
  const [slackSaved, setSlackSaved] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);

  // Fetch current user settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }

        const data = await res.json();
        setSlackWebhook(data.slackWebhook || '');
        setAlertEmail(data.alertEmail || '');
        setApiKey(data.apiKey || '');
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        setLoading(false);
      }
    }

    fetchSettings();
  }, [router]);

  // Save Slack webhook
  async function handleSaveSlack(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSlackSaved(false);

    try {
      const res = await fetch('/api/settings/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slackWebhook }),
      });

      if (res.ok) {
        setSlackSaved(true);
        setTimeout(() => setSlackSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save Slack webhook:', error);
    } finally {
      setSaving(false);
    }
  }

  // Save email settings
  async function handleSaveEmail(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setEmailSaved(false);

    try {
      const res = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertEmail }),
      });

      if (res.ok) {
        setEmailSaved(true);
        setTimeout(() => setEmailSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save email:', error);
    } finally {
      setSaving(false);
    }
  }

  // Regenerate API key
  async function handleRegenerateKey() {
    if (!confirm('Are you sure? This will invalidate your current API key.')) {
      return;
    }

    try {
      const res = await fetch('/api/settings/apikey', {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setApiKey(data.apiKey);
      }
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
    }
  }

  // Copy API key
  function handleCopyKey() {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="font-mono text-primary">LOADING SETTINGS...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-mono text-sm text-primary hover:text-secondary transition-colors">
              ~/crondash
            </Link>
            <span className="font-mono text-sm text-primary">/</span>
            <span className="font-mono text-sm text-primary">settings</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="font-mono text-sm text-primary hover:text-primary transition-colors">
              [ DASHBOARD ]
            </Link>
            <Link href="/jobs/create" className="font-mono text-sm text-primary hover:text-primary transition-colors">
              [ CREATE JOB ]
            </Link>
            <ProfileMenu />
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="font-mono text-2xl text-primary mb-2">
              // SYSTEM CONFIGURATION
            </h1>
            <p className="font-mono text-sm text-primary">
              Configure notifications, alerts, and API access
            </p>
          </div>

          <Card title="SLACK INTEGRATION">
            <form onSubmit={handleSaveSlack} className="space-y-4">
              <Input
                label="WEBHOOK URL"
                prompt="user@crondash:~$"
                type="url"
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
              />
              <div className="font-mono text-xs text-primary">
                <span className="text-primary">[INFO]</span> Enter your Slack incoming webhook URL to receive job failure notifications
              </div>
              <div className="flex items-center gap-4">
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? 'SAVING...' : 'SAVE WEBHOOK'}
                </Button>
                {slackSaved && (
                  <span className="font-mono text-sm text-primary">[OK] Saved!</span>
                )}
              </div>
            </form>
          </Card>

          <Card title="EMAIL NOTIFICATIONS">
            <form onSubmit={handleSaveEmail} className="space-y-4">
              <Input
                label="EMAIL ADDRESS"
                prompt="user@crondash:~$"
                type="email"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                placeholder="user@example.com"
              />
              <div className="font-mono text-xs text-primary">
                <span className="text-primary">[INFO]</span> Enter your email to receive job failure notifications (coming soon)
              </div>
              <div className="flex items-center gap-4">
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? 'SAVING...' : 'SAVE EMAIL'}
                </Button>
                {emailSaved && (
                  <span className="font-mono text-sm text-primary">[OK] Saved!</span>
                )}
              </div>
            </form>
          </Card>

          <Card title="API KEY MANAGEMENT">
            <div className="space-y-4">
              <div>
                <label className="font-mono text-sm text-primary block mb-2">YOUR API KEY</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background border border-border p-3 font-mono text-sm text-primary">
                    {showKey ? apiKey : '•'.repeat(Math.min(apiKey.length, 40))}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setShowKey(!showKey)}
                    className="whitespace-nowrap"
                  >
                    {showKey ? 'HIDE' : 'REVEAL'}
                  </Button>
                </div>
              </div>

              <div className="font-mono text-xs text-primary">
                <span className="text-primary">[INFO]</span> Use this key with the external cron endpoint: <code className="bg-muted px-2 py-1">/api/cron?apiKey=YOUR_KEY</code>
              </div>

              <div className="flex gap-4">
                <Button variant="primary" onClick={handleRegenerateKey}>
                  REGENERATE KEY
                </Button>
                <Button variant="secondary" onClick={handleCopyKey}>
                  {copied ? 'COPIED!' : 'COPY KEY'}
                </Button>
              </div>
            </div>
          </Card>

          <Card title="EXTERNAL CRON SETUP">
            <div className="space-y-4 font-mono text-sm text-primary">
              <p>Configure an external cron service (like cron-job.org) to trigger your jobs:</p>
              <div className="bg-muted p-4 border border-border">
                <div className="text-xs text-primary mb-2">ENDPOINT URL:</div>
                <code className="text-sm break-all">https://your-domain.com/api/cron?apiKey={apiKey || 'YOUR_API_KEY'}</code>
              </div>
              <div className="text-xs text-primary">
                <span className="text-primary">[TIP]</span> Set the external cron to run every 5 minutes (*/5 * * * *) for best results.
              </div>
            </div>
          </Card>

          <Card title="DANGER ZONE">
            <div className="space-y-4">
              <div className="font-mono text-sm text-primary">
                These actions are irreversible. Please proceed with caution.
              </div>
              <div className="flex gap-4">
                <Button variant="error">
                  DELETE ALL JOBS
                </Button>
                <Button variant="error">
                  DELETE ACCOUNT
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between font-mono text-xs text-primary">
          <span>© 2026 CRONDASH</span>
          <span>SETTINGS VIEW</span>
        </div>
      </footer>
    </div>
  );
}