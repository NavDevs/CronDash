"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusIndicator } from "@/components/ui/StatusIndicator";

const inputClass =
  "bg-transparent border border-border text-primary font-mono outline-none focus:border-primary transition-colors px-3 py-2 text-sm";

interface JobTableProps {
  jobs: any[];
}

const PAGE_SIZE = 10;

export function JobTable({ jobs }: JobTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Reset to page 0 when search/filter changes
  useEffect(() => setPage(0), [search, statusFilter]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    intervalRef.current = setInterval(() => router.refresh(), 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, router]);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="font-mono text-xs text-primary block mb-1">
            SEARCH
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, URL, or schedule..."
            className={`${inputClass} w-full`}
          />
        </div>
        <div className="w-48">
          <label className="font-mono text-xs text-primary block mb-1">
            STATUS FILTER
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${inputClass} w-full`}
          >
            <option value="all">ALL</option>
            <option value="active">ACTIVE</option>
            <option value="disabled">DISABLED</option>
            <option value="success">LAST RUN: SUCCESS</option>
            <option value="failed">LAST RUN: FAILED</option>
          </select>
        </div>
        <div className="pb-1">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`font-mono text-xs px-3 py-2 border transition-colors ${
              autoRefresh
                ? "border-primary text-primary"
                : "border-border text-muted"
            }`}
            title={autoRefresh ? "Auto-refresh ON (30s)" : "Auto-refresh OFF"}
          >
            {autoRefresh ? "[ REFRESH: ON ]" : "[ REFRESH: OFF ]"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 font-mono text-xs text-primary border-b border-border pb-2">
        <div className="col-span-2">NAME</div>
        <div className="col-span-1">SCHEDULE</div>
        <div className="col-span-1">STATUS</div>
        <div className="col-span-2">NEXT RUN</div>
        <div className="col-span-2">LAST RUN</div>
        <div className="col-span-4">URL</div>
      </div>

      {filtered.length === 0 ? (
        <div className="font-mono text-sm text-primary py-4 text-center">
          [INFO] NO JOBS MATCH YOUR FILTERS.
        </div>
      ) : (
        paginated.map((job: any) => (
          <div
            key={job.id}
            className="grid grid-cols-12 gap-4 font-mono text-sm items-center border-b border-border py-3 hover:bg-muted/10 transition-colors"
          >
            <div className="col-span-2">
              <Link
                href={`/jobs/${job.id}`}
                className="text-primary hover:text-secondary transition-colors"
              >
                {job.name}
              </Link>
            </div>
            <div className="col-span-1 text-primary">{job.schedule}</div>
            <div className="col-span-1 flex items-center gap-2">
              <StatusIndicator status={job.enabled ? "success" : "pending"} />
              <span className="text-xs text-primary">
                {job.enabled ? "ON" : "OFF"}
              </span>
              {job.runs[0] && (
                <span className={`text-xs ${job.runs[0].status === "success" ? "text-primary" : "text-error"}`}>
                  | {job.runs[0].status === "success" ? "OK" : "FAIL"}
                </span>
              )}
            </div>
            <div className="col-span-2 text-primary">
              {job.nextRun
                ? new Date(job.nextRun).toLocaleString()
                : "N/A"}
            </div>
            <div className="col-span-2 text-primary">
              {job.lastRun
                ? new Date(job.lastRun).toLocaleString()
                : "N/A"}
            </div>
            <div className="col-span-4 text-primary truncate" title={job.url}>
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">
                {job.url}
              </a>
            </div>
          </div>
        ))
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 font-mono text-sm">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className={`px-3 py-1 border transition-colors ${
              page === 0
                ? "border-border text-muted cursor-not-allowed"
                : "border-border text-primary hover:border-primary"
            }`}
          >
            PREV
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`px-3 py-1 border transition-colors ${
                  i === page
                    ? "border-primary bg-muted text-primary"
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
                ? "border-border text-muted cursor-not-allowed"
                : "border-border text-primary hover:border-primary"
            }`}
          >
            NEXT
          </button>
        </div>
      )}

      <div className="font-mono text-xs text-primary text-right pt-2">
        {filtered.length} / {jobs.length} JOBS
      </div>
    </div>
  );
}
