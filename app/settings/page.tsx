'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ProfileMenu } from '@/components/ui/ProfileMenu';

export default function SettingsPage() {
  const [slackWebhook, setSlackWebhook] = useState('');
  const [email, setEmail] = useState('');
  const [emailAlerts, setEmailAlerts] = useState({
    onFailure: true,
    onSuccess: false,
    onStart: false,
  });
  const [apiKey, setApiKey] = useState('cd_live_sk_3f7a9b2c8d4e1f6a...');
  const [showKey, setShowKey] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Settings saved');
  };

  const generateNewKey = () => {
    const newKey = 'cd_live_sk_' + Math.random().toString(36).substring(2, 15);
    setApiKey(newKey);
  };

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
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="WEBHOOK URL"
                prompt="user@crondash:~$"
                type="url"
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
              />
              <div className="font-mono text-xs text-primary">
                <span className="text-primary">[INFO]</span> Enter your Slack incoming webhook URL to receive job notifications
              </div>
              <Button variant="primary" type="submit">
                SAVE WEBHOOK
              </Button>
            </form>
          </Card>

          <Card title="EMAIL NOTIFICATIONS">
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="EMAIL ADDRESS"
                prompt="user@crondash:~$"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />

              <div>
                <label className="font-mono text-sm text-primary block mb-3">NOTIFICATION TRIGGERS</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailAlerts.onFailure}
                      onChange={(e) => setEmailAlerts({ ...emailAlerts, onFailure: e.target.checked })}
                      className="accent-primary"
                    />
                    <span className="font-mono text-sm text-primary">ON FAILURE</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailAlerts.onSuccess}
                      onChange={(e) => setEmailAlerts({ ...emailAlerts, onSuccess: e.target.checked })}
                      className="accent-primary"
                    />
                    <span className="font-mono text-sm text-primary">ON SUCCESS</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailAlerts.onStart}
                      onChange={(e) => setEmailAlerts({ ...emailAlerts, onStart: e.target.checked })}
                      className="accent-primary"
                    />
                    <span className="font-mono text-sm text-primary">ON JOB START</span>
                  </label>
                </div>
              </div>

              <Button variant="primary" type="submit">
                SAVE EMAIL SETTINGS
              </Button>
            </form>
          </Card>

          <Card title="API KEY MANAGEMENT">
            <div className="space-y-4">
              <div>
                <label className="font-mono text-sm text-primary block mb-2">CURRENT API KEY</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background border border-border p-3 font-mono text-sm text-primary">
                    {showKey ? apiKey : '•'.repeat(40)}
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
                <span className="text-warning">[WARNING]</span> Your API key grants full access to your account. Keep it secure.
              </div>

              <div className="flex gap-4">
                <Button variant="primary" onClick={generateNewKey}>
                  REGENERATE KEY
                </Button>
                <Button variant="secondary">
                  COPY KEY
                </Button>
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