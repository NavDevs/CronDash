'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ProfileMenu } from '@/components/ui/ProfileMenu';
import { TestEndpoint } from '@/components/TestEndpoint';
import { toast } from '@/components/Toast';
import { validateCronExpression, CRON_PRESETS } from '@/lib/cron-utils';

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cron validation
  const [cronError, setCronError] = useState('');
  const [cronDescription, setCronDescription] = useState('');

  const [form, setForm] = useState({
    name: '',
    url: '',
    method: 'GET',
    schedule: '',
    headers: '',
    body: '',
  });

  // Validate cron expression on change
  function handleScheduleChange(value: string) {
    setForm({ ...form, schedule: value });

    if (!value.trim()) {
      setCronError('Cron expression is required');
      setCronDescription('');
      return;
    }

    const validation = validateCronExpression(value);
    setCronError(validation.valid ? '' : validation.error || '');
    setCronDescription(validation.valid ? validation.description || '' : '');
  }

  // Apply preset
  function applyPreset(preset: string) {
    handleScheduleChange(preset);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(false);
    setError('');

    // Validate cron
    if (!form.schedule.trim()) {
      setCronError('Cron expression is required');
      setLoading(false);
      return;
    }

    const validation = validateCronExpression(form.schedule);
    if (!validation.valid) {
      setCronError(validation.error || 'Invalid cron expression');
      setLoading(false);
      return;
    }

    setLoading(true);

    // parse headers and body as JSON if provided
    let parsedHeaders = null;
    let parsedBody = null;

    try {
      if (form.headers.trim()) parsedHeaders = JSON.parse(form.headers);
      if (form.body.trim()) parsedBody = JSON.parse(form.body);
    } catch {
      setError("Headers and Body must be valid JSON");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          url: form.url,
          method: form.method,
          schedule: form.schedule,
          headers: parsedHeaders,
          body: parsedBody,
        }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Please restart the dev server.');
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create job");
        setLoading(false);
        return;
      }

      toast("Job created", "success");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-6 flex-wrap justify-center">
            <Link href="/" className="font-mono text-sm text-primary hover:text-secondary transition-colors">
              ~/crondash
            </Link>
            <span className="font-mono text-sm text-primary">/</span>
            <span className="font-mono text-sm text-primary">jobs</span>
            <span className="font-mono text-sm text-primary">/</span>
            <span className="font-mono text-sm text-primary">create</span>
          </div>
          <nav className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
            <Link href="/dashboard" className="font-mono text-sm text-primary hover:text-primary transition-colors">
              [ DASHBOARD ]
            </Link>
            <Link href="/jobs/create" className="font-mono text-sm text-primary">[ CREATE JOB ]</Link>
            <ProfileMenu />
          </nav>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="font-mono text-2xl text-primary mb-2">
              // CREATE NEW CRON JOB
            </h1>
            <p className="font-mono text-sm text-primary">
              Configure your automated task with the parameters below
            </p>
          </div>

          {/* Create Job Form */}
          <Card title="JOB CONFIGURATION">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <Input
                  label="JOB NAME"
                  prompt="user@crondash:~$"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Daily Backup"
                  required
                />
                <Input
                  label="TARGET URL"
                  prompt="user@crondash:~$"
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://api.example.com/endpoint"
                  required
                />

                {/* Cron Schedule with validation */}
                <div>
                  <label className="font-mono text-sm text-primary block mb-2">CRON SCHEDULE</label>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-primary mt-2">{'>'}</span>
                    <input
                      type="text"
                      value={form.schedule}
                      onChange={(e) => handleScheduleChange(e.target.value)}
                      placeholder="e.g., */5 * * * * (every 5 minutes)"
                      className="flex-1 bg-transparent border border-border text-primary font-mono outline-none focus:border-primary transition-colors p-3 text-sm"
                      required
                    />
                  </div>
                  {cronError && (
                    <p className="font-mono text-xs text-error mt-1">[ERROR] {cronError}</p>
                  )}
                  {cronDescription && !cronError && (
                    <p className="font-mono text-xs text-primary mt-1">[INFO] {cronDescription}</p>
                  )}
                </div>
              </div>

              {/* Cron Presets */}
              <div>
                <label className="font-mono text-sm text-primary block mb-2">QUICK PRESETS</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {CRON_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => applyPreset(preset.value)}
                      className={`font-mono text-xs p-2 border transition-colors text-left ${
                        form.schedule === preset.value
                          ? 'border-primary bg-muted text-primary'
                          : 'border-border text-primary hover:border-primary'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* HTTP Method */}
              <div>
                <label className="font-mono text-sm text-primary block mb-2">HTTP METHOD</label>
                <div className="flex flex-wrap gap-4">
                  {['GET', 'POST', 'PUT', 'DELETE'].map((method) => (
                    <label key={method} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="method"
                        value={method}
                        checked={form.method === method}
                        onChange={(e) => setForm({ ...form, method: e.target.value })}
                        className="accent-primary"
                      />
                      <span className="font-mono text-sm text-primary">{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Headers */}
              <div>
                <label className="font-mono text-sm text-primary block mb-2">HEADERS (JSON)</label>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-primary mt-1">{'>'}</span>
                  <textarea
                    value={form.headers}
                    onChange={(e) => setForm({ ...form, headers: e.target.value })}
                    placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                    className="flex-1 bg-transparent border border-border text-primary font-mono outline-none focus:border-primary transition-colors p-3 min-h-[100px] text-sm"
                  />
                </div>
              </div>

              {/* Body */}
              <div>
                <label className="font-mono text-sm text-primary block mb-2">REQUEST BODY (JSON)</label>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-primary mt-1">{'>'}</span>
                  <textarea
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    placeholder='{"key": "value"}'
                    className="flex-1 bg-transparent border border-border text-primary font-mono outline-none focus:border-primary transition-colors p-3 min-h-[100px] text-sm"
                  />
                </div>
              </div>

              <TestEndpoint
                url={form.url}
                method={form.method}
                headers={form.headers}
                body={form.body}
              />

              {error && (
                <div className="font-mono text-sm text-error">
                  [ERROR] {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? 'CREATING...' : 'CREATE JOB'}
                </Button>
                <Button variant="secondary">
                  <Link href="/dashboard">CANCEL</Link>
                </Button>
              </div>
            </form>
          </Card>

          {/* Cron Expression Help */}
          <Card title="CRON EXPRESSION REFERENCE">
            <div className="space-y-2 font-mono text-sm text-primary">
              <div className="flex justify-between">
                <span>* * * * *</span>
                <span className="text-primary">Every minute</span>
              </div>
              <div className="flex justify-between">
                <span>*/5 * * * *</span>
                <span className="text-primary">Every 5 minutes</span>
              </div>
              <div className="flex justify-between">
                <span>0 * * * *</span>
                <span className="text-primary">Every hour</span>
              </div>
              <div className="flex justify-between">
                <span>0 0 * * *</span>
                <span className="text-primary">Every day at midnight</span>
              </div>
              <div className="flex justify-between">
                <span>0 9 * * 1</span>
                <span className="text-primary">Every Monday at 9 AM</span>
              </div>
              <div className="flex justify-between">
                <span>0 0 1 * *</span>
                <span className="text-primary">First day of every month</span>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs text-primary">
          <span>© 2026 CRONDASH</span>
          <span>CREATE JOB VIEW</span>
        </div>
      </footer>
    </div>
  );
}