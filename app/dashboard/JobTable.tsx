"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputClass =
  "bg-transparent border border-border text-primary font-mono outline-none focus:border-primary transition-colors px-3 py-2 text-sm";

interface JobTableProps {
  jobs: any[];
}

const PAGE_SIZE = 10;

function StatusBadge({ enabled, lastStatus }: { enabled: boolean; lastStatus?: string }) {
  if (!enabled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-[#1a1a1a] border border-[#333] text-[#888]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#555]" />
        DISABLED
      </span>
    );
  }
  if (lastStatus === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-red-950/40 border border-red-800/50 text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        FAILED
      </span>
    );
  }
  if (lastStatus === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-green-950/40 border border-green-700/50 text-green-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        ACTIVE
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-yellow-950/40 border border-yellow-700/50 text-yellow-400">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
      WAITING
    </span>
  );
}

function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function JobTable({ jobs }: JobTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        job.name.toLowerCase().includes(search.toLowerCase()) ||
        job.url.toLowerCase().includes(search.toLowerCase()) ||
        job.schedule.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && job.enabled) ||
        (statusFilter === "disabled" && !job.enabled) ||
        (statusFilter === "failed" && job.runs[0]?.status === "failed") ||
        (statusFilter === "success" && job.runs[0]?.status === "success");

      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => setPage(0), [search, statusFilter]);

  useEffect(() => {
    if (!autoRefresh) return;
    intervalRef.current = setInterval(() => router.refresh(), 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, router]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="font-mono text-xs text-primary/60 block mb-1.5">SEARCH</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, URL, or schedule..."
            className={`${inputClass} w-full`}
          />
        </div>
        <div className="w-44">
          <label className="font-mono text-xs text-primary/60 block mb-1.5">STATUS FILTER</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${inputClass} w-full`}
          >
            <option value="all">ALL JOBS</option>
            <option value="active">ACTIVE</option>
            <option value="disabled">DISABLED</option>
            <option value="success">LAST: SUCCESS</option>
            <option value="failed">LAST: FAILED</option>
          </select>
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`font-mono text-xs px-3 py-2 border transition-colors ${
            autoRefresh
              ? "border-primary/60 text-primary bg-primary/5"
              : "border-border text-primary/40"
          }`}
          title={autoRefresh ? "Auto-refresh ON (30s)" : "Auto-refresh OFF"}
        >
          {autoRefresh ? "⟳ AUTO REFRESH ON" : "⟳ AUTO REFRESH OFF"}
        </button>
      </div>

      {/* Table header — desktop only */}
      <div className="hidden md:grid grid-cols-12 gap-x-4 font-mono text-[11px] text-primary/40 uppercase tracking-wider border-b border-border pb-2 px-4">
        <div className="col-span-2">Name</div>
        <div className="col-span-2">Schedule</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Last Run</div>
        <div className="col-span-2">Next Run</div>
        <div className="col-span-2">Target URL</div>
      </div>

      {/* Job rows */}
      {filtered.length === 0 ? (
        <div className="font-mono text-sm text-primary/50 py-8 text-center border border-border rounded">
          [INFO] NO JOBS MATCH YOUR FILTERS
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map((job: any) => {
            const lastStatus = job.runs[0]?.status;
            return (
              <div
                key={job.id}
                className="group border border-border hover:border-primary/40 bg-[#0d0d0d] hover:bg-[#111] transition-all duration-200 rounded-sm px-4 py-3"
              >
                {/* Mobile layout */}
                <div className="md:hidden space-y-2">
                  <div className="flex items-center justify-between">
                    <Link href={`/jobs/${job.id}`} className="font-mono text-base text-primary hover:text-secondary transition-colors font-semibold">
                      {job.name}
                    </Link>
                    <StatusBadge enabled={job.enabled} lastStatus={lastStatus} />
                  </div>
                  <div className="font-mono text-xs text-primary/50 break-all">
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                      {job.url}
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-4 font-mono text-xs text-primary/60">
                    <span>⏱ {job.schedule}</span>
                    <span suppressHydrationWarning>Last: {mounted ? formatDate(job.lastRun) : "—"}</span>
                    <span suppressHydrationWarning>Next: {mounted ? formatDate(job.nextRun) : "—"}</span>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden md:grid grid-cols-12 gap-x-4 items-center">
                  <div className="col-span-2">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-mono text-sm text-primary hover:text-secondary transition-colors font-semibold truncate block"
                      title={job.name}
                    >
                      {job.name}
                    </Link>
                  </div>
                  <div className="col-span-2 font-mono text-sm text-primary/70 truncate" title={job.schedule}>
                    {job.schedule}
                  </div>
                  <div className="col-span-2">
                    <StatusBadge enabled={job.enabled} lastStatus={lastStatus} />
                  </div>
                  <div className="col-span-2 font-mono text-sm text-primary/70" title={mounted && job.lastRun ? new Date(job.lastRun).toLocaleString() : ""} suppressHydrationWarning>
                    {mounted ? formatDate(job.lastRun) : "—"}
                  </div>
                  <div className="col-span-2 font-mono text-sm text-primary/70" title={mounted && job.nextRun ? new Date(job.nextRun).toLocaleString() : ""} suppressHydrationWarning>
                    {mounted ? formatDate(job.nextRun) : "—"}
                  </div>
                  <div className="col-span-2 font-mono text-xs text-primary/50 truncate" title={job.url}>
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                      {job.url.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 font-mono text-sm">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className={`px-3 py-1 border transition-colors ${
              page === 0
                ? "border-border text-primary/20 cursor-not-allowed"
                : "border-border text-primary hover:border-primary"
            }`}
          >
            ← PREV
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`px-3 py-1 border transition-colors ${
                  i === page
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-primary hover:border-primary"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className={`px-3 py-1 border transition-colors ${
              page >= totalPages - 1
                ? "border-border text-primary/20 cursor-not-allowed"
                : "border-border text-primary hover:border-primary"
            }`}
          >
            NEXT →
          </button>
        </div>
      )}

      <div className="font-mono text-xs text-primary/40 text-right pt-1">
        {filtered.length} / {jobs.length} JOBS
      </div>
    </div>
  );
}
