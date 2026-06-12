"use client";

import { useState } from "react";
import { LogModal } from "@/components/LogModal";

interface Run {
  id: string;
  status: string;
  statusCode: number | null;
  duration: number | null;
  response: string | null;
  error: string | null;
  executedAt: Date;
}

const inputClass =
  "bg-transparent border border-border text-primary font-mono outline-none focus:border-primary transition-colors px-3 py-2 text-sm";

export function RunHistory({ runs }: { runs: Run[] }) {
  const [filter, setFilter] = useState<string>("all");

  const filtered = runs.filter(
    (run) => filter === "all" || run.status === filter
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-4 items-end">
        <div className="w-48">
          <label className="font-mono text-xs text-primary block mb-1">
            FILTER
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`${inputClass} w-full`}
          >
            <option value="all">ALL RUNS</option>
            <option value="success">SUCCESS ONLY</option>
            <option value="failed">FAILED ONLY</option>
          </select>
        </div>
        <div className="font-mono text-xs text-primary pb-2">
          {filtered.length} / {runs.length} RUNS
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="font-mono text-sm text-primary py-4 text-center">
          [INFO] NO RUNS MATCH YOUR FILTER.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-5 gap-4 font-mono text-xs text-primary border-b border-border pb-2">
            <div>TIMESTAMP</div>
            <div>STATUS</div>
            <div>STATUS CODE</div>
            <div>DURATION</div>
            <div>ACTIONS</div>
          </div>
          {filtered.map((run) => (
            <div
              key={run.id}
              className="grid grid-cols-5 gap-4 font-mono text-sm items-center border-b border-border py-2 hover:bg-muted/10 transition-colors"
            >
              <div className="text-primary">
                {new Date(run.executedAt).toLocaleString()}
              </div>
              <div
                className={
                  run.status === "success" ? "text-primary" : "text-error"
                }
              >
                {run.status === "success" ? "[OK]" : "[ERR]"}
              </div>
              <div
                className={
                  run.statusCode === 200 ? "text-primary" : "text-error"
                }
              >
                {run.statusCode ?? "N/A"}
              </div>
              <div className="text-primary">{run.duration ?? 0}ms</div>
              <div>
                <LogModal
                  run={{ ...run, executedAt: run.executedAt.toISOString() }}
                />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
