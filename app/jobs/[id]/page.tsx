import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/lib/auth"
import { Card } from "@/components/ui/Card"
import { StatusIndicator } from "@/components/ui/StatusIndicator"
import { ProfileMenu } from "@/components/ui/ProfileMenu"
import { JobActions } from "./JobActions"
import { RunHistory } from "./RunHistory"

export const dynamic = "force-dynamic"

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    redirect("/login")
  }

  const job = await prisma.job.findFirst({
    where: { id: resolvedParams.id, userId },
    include: { runs: { orderBy: { executedAt: "desc" }, take: 50 } },
  })

  if (!job) {
    notFound()
  }

  const latestRun = job.runs?.[0] || null

  function formatLatestLog() {
    if (!latestRun) return "No runs yet"
    if (latestRun.error) return `[ERR] ${latestRun.error}`
    if (!latestRun.response) return "No response captured"
    try {
      return JSON.stringify(JSON.parse(latestRun.response), null, 2)
    } catch {
      return latestRun.response
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-4 sm:px-6 py-4 relative z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="hidden sm:inline font-mono text-sm text-primary hover:text-secondary transition-colors">
              ~/crondash
            </Link>
            <span className="hidden sm:inline font-mono text-sm text-primary">/</span>
            <span className="hidden sm:inline font-mono text-sm text-primary">jobs</span>
            <span className="hidden sm:inline font-mono text-sm text-primary">/</span>
            <span className="font-mono text-sm text-primary max-w-[150px] sm:max-w-none truncate">{job.id}</span>
          </div>
          <nav className="flex items-center gap-4 sm:gap-6 ml-4">
            <Link href="/dashboard" className="hidden sm:inline font-mono text-sm text-primary hover:text-primary transition-colors">
              [ DASHBOARD ]
            </Link>
            <Link href="/jobs/create" className="hidden sm:inline font-mono text-sm text-primary hover:text-primary transition-colors">
              [ CREATE JOB ]
            </Link>
            <ProfileMenu />
          </nav>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8 overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-mono text-2xl text-primary mb-2">
                // JOB DETAILS
              </h1>
              <p className="font-mono text-sm text-primary">
                ID: {job.id} | {job.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="JOB CONFIGURATION">
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-primary">NAME:</span>
                  <span className="text-primary">{job.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary">SCHEDULE:</span>
                  <span className="text-primary">{job.schedule}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary">METHOD:</span>
                  <span className="text-primary">{job.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary">URL:</span>
                  <span className="text-primary text-right">{job.url}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary">STATUS:</span>
                  <StatusIndicator status={job.enabled ? "success" : "pending"} />
                </div>
                <div className="flex justify-between">
                  <span className="text-primary">ENABLED:</span>
                  <span className={job.enabled ? "text-primary" : "text-error"}>
                    {job.enabled ? "[YES]" : "[NO]"}
                  </span>
                </div>
              </div>
            </Card>

            <Card title="SCHEDULE INFO">
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-primary">NEXT RUN:</span>
                  <span className="text-primary" suppressHydrationWarning>
                    {job.nextRun ? new Date(job.nextRun).toLocaleString() : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary">LAST RUN:</span>
                  <span className="text-primary" suppressHydrationWarning>
                    {job.lastRun ? new Date(job.lastRun).toLocaleString() : "N/A"}
                  </span>
                </div>
                <JobActions jobId={job.id} enabled={job.enabled} />
              </div>
            </Card>
          </div>

          <Card title="RUN HISTORY">
            {job.runs.length === 0 ? (
              <div className="font-mono text-sm text-primary py-4 text-center">
                [INFO] NO RUN HISTORY YET. Click RUN NOW to trigger manually.
              </div>
            ) : (
              <RunHistory
                runs={job.runs.map((r) => ({
                  ...r,
                  executedAt: r.executedAt,
                  response: r.response,
                  error: r.error,
                }))}
              />
            )}
          </Card>

          <Card title="LATEST LOGS">
            <pre
              className={`
              ${latestRun?.error ? "text-error" : "text-primary"}
              font-mono text-xs border border-primary/50 p-4
              overflow-auto max-h-[200px] whitespace-pre-wrap break-all bg-background m-0
            `}
            >
              {formatLatestLog()}
            </pre>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between font-mono text-xs text-primary">
          <span>© 2026 CRONDASH</span>
          <span>JOB DETAIL VIEW</span>
        </div>
      </footer>
    </div>
  )
}
