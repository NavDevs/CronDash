'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ProfileMenu } from '@/components/ui/ProfileMenu';
import { toast } from '@/components/Toast';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [slackWebhook, setSlackWebhook] = useState('');
  const [alertEmail, setAlertEmail] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const [deleteAllJobsConfirm, setDeleteAllJobsConfirm] = useState('');
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState('');
  const [deletingJobs, setDeletingJobs] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [dangerError, setDangerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [slackSaved, setSlackSaved] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        setSlackWebhook(data.slackWebhook || '');
        setAlertEmail(data.alertEmail || '');
        setWebhookUrl(data.webhookUrl || '');
        setApiKey(data.apiKey || '');
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSaveSlack(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slackWebhook }),
      });
      if (res.ok) { toast("Webhook saved", "success"); setSlackSaved(true); setTimeout(() => setSlackSaved(false), 3000); }
    } finally { setSaving(false); }
  }

  async function handleSaveEmail(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertEmail }),
      });
      if (res.ok) { toast("Email saved", "success"); setEmailSaved(true); setTimeout(() => setEmailSaved(false), 3000); }
    } finally { setSaving(false); }
  }

  async function handleSaveWebhook(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl }),
      });
      if (res.ok) { toast("Webhook URL saved", "success"); setWebhookSaved(true); setTimeout(() => setWebhookSaved(false), 3000); }
    } finally { setSaving(false); }
  }

  async function handleRegenerateKey() {
    if (!confirm('Are you sure? This will invalidate your current API key.')) return;
    try {
      const res = await fetch('/api/settings/apikey', { method: 'POST' });
      if (res.ok) { const data = await res.json(); setApiKey(data.apiKey); }
    } catch {}
  }

  function handleCopyKey() {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDeleteAllJobs() {
    if (deleteAllJobsConfirm !== 'DELETE ALL JOBS') { setDangerError("Please type 'DELETE ALL JOBS' to confirm"); return; }
    setDangerError('');
    setDeletingJobs(true);
    try {
      const res = await fetch('/api/settings/danger/delete-all-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText: deleteAllJobsConfirm }),
      });
      const data = await res.json();
      if (!res.ok) { setDangerError(data.error || 'Failed'); setDeletingJobs(false); return; }
      setSuccessMessage(data.message || 'All jobs deleted');
      setDeleteAllJobsConfirm('');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch { setDangerError('Something went wrong'); }
    finally { setDeletingJobs(false); }
  }

  async function handleDeleteAccount() {
    if (deleteAccountConfirm !== 'DELETE MY ACCOUNT') { setDangerError("Please type 'DELETE MY ACCOUNT' to confirm"); return; }
    if (!confirm('Are you absolutely sure? This will permanently delete your account and all your jobs.')) return;
    setDangerError('');
    setDeletingAccount(true);
    try {
      const res = await fetch('/api/settings/danger/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText: deleteAccountConfirm }),
      });
      const data = await res.json();
      if (!res.ok) { setDangerError(data.error || 'Failed'); setDeletingAccount(false); return; }
      window.location.href = '/';
    } catch { setDangerError('Something went wrong'); }
    finally { setDeletingAccount(false); }
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
      <header className="border-b border-border px-4 sm:px-6 py-4 relative z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="hidden sm:inline font-mono text-sm text-primary hover:text-secondary transition-colors">~/crondash</Link>
            <span className="hidden sm:inline font-mono text-sm text-primary">/</span>
            <span className="font-mono text-sm text-primary">settings</span>
          </div>
          <nav className="flex items-center gap-4 sm:gap-6 ml-4">
            <Link href="/dashboard" className="hidden sm:inline font-mono text-sm text-primary hover:text-primary transition-colors">[ DASHBOARD ]</Link>
            <Link href="/jobs/create" className="hidden sm:inline font-mono text-sm text-primary hover:text-primary transition-colors">[ CREATE JOB ]</Link>
            <ProfileMenu />
          </nav>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8 overflow-hidden w-full">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="font-mono text-2xl text-primary mb-2">// SYSTEM CONFIGURATION</h1>
            <p className="font-mono text-sm text-primary">Configure notifications, alerts, and API access</p>
          </div>

          {successMessage && (
            <div className="font-mono text-sm text-primary bg-muted border border-primary p-4">[OK] {successMessage}</div>
          )}

          <Card title="SLACK INTEGRATION">
            <form onSubmit={handleSaveSlack} className="space-y-4">
              <Input label="WEBHOOK URL" prompt="user@crondash:~$" type="url" value={slackWebhook} onChange={(e) => setSlackWebhook(e.target.value)} placeholder="https://hooks.slack.com/services/..." />
              <div className="font-mono text-xs text-primary"><span className="text-primary">[INFO]</span> Enter your Slack incoming webhook URL to receive job failure notifications</div>
              <div className="flex items-center gap-4">
                <Button variant="primary" type="submit" disabled={saving}>{saving ? 'SAVING...' : 'SAVE WEBHOOK'}</Button>
                {slackSaved && <span className="font-mono text-sm text-primary">[OK] Saved!</span>}
              </div>
            </form>
          </Card>

          <Card title="EMAIL NOTIFICATIONS">
            <form onSubmit={handleSaveEmail} className="space-y-4">
              <Input label="EMAIL ADDRESS" prompt="user@crondash:~$" type="email" value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)} placeholder="user@example.com" />
              <div className="font-mono text-xs text-primary"><span className="text-primary">[INFO]</span> Enter your email to receive job failure notifications</div>
              <div className="flex items-center gap-4">
                <Button variant="primary" type="submit" disabled={saving}>{saving ? 'SAVING...' : 'SAVE EMAIL'}</Button>
                {emailSaved && <span className="font-mono text-sm text-primary">[OK] Saved!</span>}
              </div>
            </form>
          </Card>

          <Card title="WEBHOOK NOTIFICATIONS">
            <form onSubmit={handleSaveWebhook} className="space-y-4">
              <Input label="WEBHOOK URL" prompt="user@crondash:~$" type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://hooks.example.com/crondash-alerts" />
              <div className="font-mono text-xs text-primary"><span className="text-primary">[INFO]</span> CronDash will POST a JSON payload to this URL on job failure</div>
              <div className="flex items-center gap-4">
                <Button variant="primary" type="submit" disabled={saving}>{saving ? 'SAVING...' : 'SAVE WEBHOOK'}</Button>
                {webhookSaved && <span className="font-mono text-sm text-primary">[OK] Saved!</span>}
              </div>
            </form>
          </Card>

          <Card title="API KEY MANAGEMENT">
            <div className="space-y-4">
              <div>
                <label className="font-mono text-sm text-primary block mb-2">YOUR API KEY</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background border border-border p-3 font-mono text-sm text-primary overflow-x-auto whitespace-nowrap">
                    {showKey ? apiKey : '•'.repeat(Math.min(apiKey.length, 40))}
                  </div>
                  <Button variant="secondary" onClick={() => setShowKey(!showKey)} className="whitespace-nowrap">
                    {showKey ? 'HIDE' : 'REVEAL'}
                  </Button>
                </div>
              </div>
              <div className="font-mono text-xs text-primary">
                <span className="text-primary">[INFO]</span> Use this key with the external cron endpoint: <code className="bg-muted px-2 py-1">/api/cron?apiKey=YOUR_KEY</code>
              </div>
              <div className="flex gap-4">
                <Button variant="primary" onClick={handleRegenerateKey}>REGENERATE KEY</Button>
                <Button variant="secondary" onClick={handleCopyKey}>{copied ? 'COPIED!' : 'COPY KEY'}</Button>
              </div>
            </div>
          </Card>

          <Card title="EXTERNAL CRON SETUP">
            <div className="space-y-4 font-mono text-sm text-primary">
              <p>Configure an external cron service (like cron-job.org) to trigger your jobs:</p>
              <div className="bg-muted p-4 border border-border">
                <div className="text-xs text-primary mb-2">ENDPOINT URL:</div>
                <code className="text-sm break-all inline-block w-full overflow-x-auto whitespace-nowrap">https://your-domain.com/api/cron?apiKey={apiKey || 'YOUR_API_KEY'}</code>
              </div>
              <div className="text-xs text-primary"><span className="text-primary">[TIP]</span> Set the external cron to run every 5 minutes (*/5 * * * *) for best results.</div>
            </div>
          </Card>

          <Card title="DANGER ZONE">
            <div className="space-y-6">
              {dangerError && <div className="font-mono text-sm text-error border border-error p-3">[ERROR] {dangerError}</div>}

              <div className="space-y-3">
                <div className="font-mono text-sm text-primary">
                  <span className="text-error font-bold">DELETE ALL JOBS</span> - This will permanently delete all your cron jobs and their run history.
                </div>
                <Input label="CONFIRM BY TYPING 'DELETE ALL JOBS'" prompt="user@crondash:~$" type="text" value={deleteAllJobsConfirm} onChange={(e) => setDeleteAllJobsConfirm(e.target.value)} placeholder="DELETE ALL JOBS" />
                <Button variant="error" onClick={handleDeleteAllJobs} disabled={deleteAllJobsConfirm !== 'DELETE ALL JOBS' || deletingJobs}>
                  {deletingJobs ? 'DELETING...' : 'DELETE ALL JOBS'}
                </Button>
              </div>

              <div className="border-t border-border pt-4" />

              <div className="space-y-3">
                <div className="font-mono text-sm text-primary">
                  <span className="text-error font-bold">DELETE ACCOUNT</span> - This will permanently delete your account and all associated data. This action cannot be undone.
                </div>
                <Input label="CONFIRM BY TYPING 'DELETE MY ACCOUNT'" prompt="user@crondash:~$" type="text" value={deleteAccountConfirm} onChange={(e) => setDeleteAccountConfirm(e.target.value)} placeholder="DELETE MY ACCOUNT" />
                <Button variant="error" onClick={handleDeleteAccount} disabled={deleteAccountConfirm !== 'DELETE MY ACCOUNT' || deletingAccount}>
                  {deletingAccount ? 'DELETING...' : 'DELETE MY ACCOUNT'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between font-mono text-xs text-primary">
          <span>© 2026 CRONDASH</span>
          <span>SETTINGS VIEW</span>
        </div>
      </footer>
    </div>
  );
}
