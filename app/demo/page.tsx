'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface DemoItem {
  id: number;
  name: string;
  status: string;
  updatedAt: string;
}

interface ActivityLog {
  id: string;
  method: string;
  timestamp: string;
  details: string;
}

export default function DemoPage() {
  const [items, setItems] = useState<DemoItem[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const targetUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/demo-target` : '/api/demo-target';

  const fetchDemoData = async () => {
    try {
      const res = await fetch('/api/demo-target');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setLogs(data.recentActivity || []);
      }
    } catch {
      // Ignore poll errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemoData();
    const timer = setInterval(fetchDemoData, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleReset = async () => {
    await fetch('/api/demo-target?reset=true', { method: 'DELETE' });
    fetchDemoData();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(label);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-primary font-mono">
      {/* Header */}
      <header className="border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-primary text-sm hover:text-secondary transition-colors">
              ~/crondash
            </Link>
            <span className="text-primary/40">/</span>
            <span className="text-secondary text-sm font-bold">live-demo-target</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xs text-primary hover:text-secondary border border-border px-3 py-1.5 transition-colors">
              [ ← DASHBOARD ]
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Banner */}
        <div className="border border-secondary/40 bg-secondary/5 p-6 rounded-sm space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-secondary flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
              REAL-TIME TARGET DASHBOARD
            </h1>
            <Button variant="secondary" onClick={handleReset} className="text-xs py-1 px-3">
              [ ↺ RESET DATA ]
            </Button>
          </div>
          <p className="text-xs text-primary/80 leading-relaxed max-w-3xl">
            This live endpoint is running directly inside your CronDash platform. When you create CronDash jobs targeting <code className="text-secondary bg-black/40 px-1.5 py-0.5 border border-border">{targetUrl}</code>, you will watch the data and logs update on this page <strong>live in real-time every 2 seconds!</strong>
          </p>
        </div>

        {/* Live Data Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Active Items Table */}
          <Card title="LIVE TARGET DATABASE ITEMS">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-primary/50 border-b border-border pb-2">
                <span>TOTAL ITEMS: {items.length}</span>
                <span>STATUS: LIVE POLLING (2s)</span>
              </div>
              {loading ? (
                <div className="text-center py-6 text-xs text-primary/50 animate-pulse">
                  LOADING TARGET DATA...
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-6 text-xs text-error">
                  [EMPTY] ALL ITEMS DELETED. Send a POST job or click RESET!
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="border border-border bg-black/40 p-3 rounded-sm flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-primary">{item.name}</div>
                        <div className="text-[10px] text-primary/50">ID: {item.id} | {new Date(item.updatedAt).toLocaleTimeString()}</div>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold border ${
                        item.status === 'CREATED' ? 'border-blue-500 text-blue-400 bg-blue-950/30' :
                        item.status === 'UPDATED' ? 'border-yellow-500 text-yellow-400 bg-yellow-950/30' :
                        'border-green-500 text-green-400 bg-green-950/30'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Activity Feed */}
          <Card title="LIVE HTTP ACTIVITY FEED">
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="text-center py-6 text-xs text-primary/50">NO HTTP REQUESTS RECEIVED YET</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="text-xs font-mono border-b border-border/50 pb-2 flex items-start justify-between">
                    <div>
                      <span className={`font-bold mr-2 ${
                        log.method === 'POST' ? 'text-blue-400' :
                        log.method === 'PUT' ? 'text-yellow-400' :
                        log.method === 'DELETE' ? 'text-red-400' :
                        'text-green-400'
                      }`}>
                        [{log.method}]
                      </span>
                      <span className="text-primary/90">{log.details}</span>
                    </div>
                    <span className="text-[10px] text-primary/40 whitespace-nowrap ml-2">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Copy-Paste Presets for CronDash */}
        <div className="space-y-4 pt-4">
          <h2 className="text-sm font-bold text-secondary tracking-wider uppercase">
            // PRE-CONFIGURED CRONDASH JOB TEST PARAMETERS
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* GET Card */}
            <div className="border border-border bg-black/40 p-4 rounded-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-green-400">[ METHOD: GET ]</span>
                <button
                  onClick={() => copyToClipboard(targetUrl, 'GET')}
                  className="text-[10px] border border-border px-2 py-0.5 hover:border-primary transition-colors"
                >
                  {copiedIndex === 'GET' ? 'COPIED!' : 'COPY URL'}
                </button>
              </div>
              <p className="text-[11px] text-primary/70">Fetches live target item counts and status.</p>
              <div className="text-[10px] bg-black/60 p-2 border border-border/50 break-all text-primary/80">
                {targetUrl}
              </div>
            </div>

            {/* POST Card */}
            <div className="border border-border bg-black/40 p-4 rounded-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400">[ METHOD: POST ]</span>
                <button
                  onClick={() => copyToClipboard('{"name": "Automated Cron Task", "status": "CREATED"}', 'POST')}
                  className="text-[10px] border border-border px-2 py-0.5 hover:border-primary transition-colors"
                >
                  {copiedIndex === 'POST' ? 'COPIED!' : 'COPY BODY'}
                </button>
              </div>
              <p className="text-[11px] text-primary/70">Adds a new item into the live target database.</p>
              <div className="text-[10px] bg-black/60 p-2 border border-border/50 break-all text-primary/80">
                {`{"name": "Automated Cron Task", "status": "CREATED"}`}
              </div>
            </div>

            {/* PUT Card */}
            <div className="border border-border bg-black/40 p-4 rounded-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-400">[ METHOD: PUT ]</span>
                <button
                  onClick={() => copyToClipboard('{"name": "Updated Task Status", "status": "UPDATED"}', 'PUT')}
                  className="text-[10px] border border-border px-2 py-0.5 hover:border-primary transition-colors"
                >
                  {copiedIndex === 'PUT' ? 'COPIED!' : 'COPY BODY'}
                </button>
              </div>
              <p className="text-[11px] text-primary/70">Updates status of items in real-time.</p>
              <div className="text-[10px] bg-black/60 p-2 border border-border/50 break-all text-primary/80">
                {`{"name": "Updated Task Status", "status": "UPDATED"}`}
              </div>
            </div>

            {/* DELETE Card */}
            <div className="border border-border bg-black/40 p-4 rounded-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400">[ METHOD: DELETE ]</span>
                <button
                  onClick={() => copyToClipboard(targetUrl, 'DELETE')}
                  className="text-[10px] border border-border px-2 py-0.5 hover:border-primary transition-colors"
                >
                  {copiedIndex === 'DELETE' ? 'COPIED!' : 'COPY URL'}
                </button>
              </div>
              <p className="text-[11px] text-primary/70">Deletes the top item from the database.</p>
              <div className="text-[10px] bg-black/60 p-2 border border-border/50 break-all text-primary/80">
                {targetUrl}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-4 sm:px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-primary/50">
          <span>© 2026 CRONDASH</span>
          <span>LIVE TARGET DEMO PAGE</span>
        </div>
      </footer>
    </div>
  );
}
