"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { LocalTime } from "@/components/LocalTime"

type Run = {
  id: string
  status: string
  statusCode: number | null
  duration: number | null
  response: string | null
  error: string | null
  executedAt: string
}

export function LogModal({ run }: { run: Run }) {
  const [open, setOpen] = useState(false)

  function formatResponse() {
    if (run.error) return `[ERR] ${run.error}`
    if (!run.response) return "No response captured"
    try {
      return JSON.stringify(JSON.parse(run.response), null, 2)
    } catch {
      return run.response
    }
  }

  return (
    <>
      <Button
        variant="primary"
        className="px-2 py-1 text-xs"
        onClick={() => setOpen(true)}
      >
        VIEW LOGS
      </Button>

      {open && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="border border-primary bg-background w-full max-w-2xl p-6 font-mono"
            onClick={e => e.stopPropagation()}
          >
            {/* title bar */}
            <div className="border-b border-primary pb-3 mb-4 flex justify-between items-center">
              <span className="text-primary">+--- RUN LOG ---+</span>
              <button
                onClick={() => setOpen(false)}
                className="border border-primary bg-transparent text-primary hover:bg-primary hover:text-background font-mono px-2 py-1 transition-colors"
              >
                [ X ]
              </button>
            </div>

            {/* meta info */}
            <div className="mb-4 text-sm space-y-2">
              <p className="text-primary m-0">
                TIMESTAMP: <LocalTime date={run.executedAt} />
              </p>
              <p className={`m-0 ${run.status === "success" ? "text-primary" : "text-error"}`}>
                STATUS: [{run.status === "success" ? "OK" : "ERR"}]
              </p>
              <p className="text-primary m-0">
                STATUS CODE: {run.statusCode ?? "N/A"}
              </p>
              <p className="text-primary m-0">
                DURATION: {run.duration ?? 0}ms
              </p>
            </div>

            {/* divider */}
            <div className="border-t border-primary/50 my-3" />

            {/* response output */}
            <p className="text-primary/70 text-xs mb-2">
              {run.error ? "ERROR OUTPUT:" : "RESPONSE BODY:"}
            </p>
            <pre className={`
              ${run.error ? "text-error" : "text-primary"}
              bg-background border border-primary/50 p-4 
              overflow-auto max-h-[240px] text-xs whitespace-pre-wrap break-all m-0
            `}>
              {formatResponse()}
            </pre>

            {/* 404 helper tip */}
            {run.statusCode === 404 && (
              <div className="mt-4 border border-primary/40 bg-primary/5 p-3 text-xs text-primary/90">
                <p className="font-semibold mb-2">[TIP] Your server returned a 404 Not Found error.</p>
                <p className="mb-2">If you are just pinging your server to keep it awake, this still works! However, to get a green [OK], add a route to your server for this URL. For example, in Express:</p>
                <pre className="bg-background/80 border border-primary/20 p-2 overflow-x-auto m-0 text-primary/80">
{`app.get('/', (req, res) => {
  res.status(200).send('Server is awake!');
});`}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
