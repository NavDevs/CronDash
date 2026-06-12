import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { ProfileMenu } from "@/components/ui/ProfileMenu"
import { JobTable } from "./JobTable"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  let jobs: any[] = []
  let totalJobs = 0
  let activeJobs = 0
  let disabledJobs = 0
  let failedJobs = 0
  let successCount = 0

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      jobs: {
        orderBy: { createdAt: "desc" },
        include: { runs: { orderBy: { executedAt: "desc" }, take: 1 } },
      },
    },
  })

  if (user) {
    jobs = user.jobs
    totalJobs = jobs.length
    activeJobs = jobs.filter((j: any) => j.enabled).length
    disabledJobs = jobs.filter((j: any) => !j.enabled).length
    failedJobs = jobs.filter((j: any) => j.runs[0]?.status === "failed").length
    successCount = jobs.filter((j: any) => j.runs[0]?.status === "success").length
  }

  const successRate = totalJobs === 0 ? 100 : Math.round((successCount / totalJobs) * 100)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-mono text-sm text-primary hover:text-secondary transition-colors">
              ~/crondash
            </Link>
            <span className="font-mono text-sm text-primary">/</span>
            <span className="font-mono text-sm text-primary">dashboard</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="font-mono text-sm text-primary">[ DASHBOARD ]</Link>
            <Link href="/jobs/create" className="font-mono text-sm text-primary hover:text-primary transition-colors">
              [ CREATE JOB ]
            </Link>
            <ProfileMenu />
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card title="TOTAL JOBS">
              <div className="font-mono text-3xl text-primary">{totalJobs}</div>
            </Card>
            <Card title="ACTIVE">
              <div className="font-mono text-3xl text-primary">{activeJobs}</div>
            </Card>
            <Card title="FAILED">
              <div className="font-mono text-3xl text-error">{failedJobs}</div>
            </Card>
            <Card title="SUCCESS RATE">
              <div className="font-mono text-3xl text-primary">{successRate}%</div>
            </Card>
          </div>

          <Card title="CRON JOBS">
            {jobs.length === 0 ? (
              <div className="font-mono text-sm text-primary py-8 text-center">
                [INFO] NO JOBS FOUND. CREATE YOUR FIRST JOB!
              </div>
            ) : (
              <JobTable jobs={jobs} />
            )}
          </Card>

          <div className="flex justify-between items-center">
            <div className="font-mono text-sm text-primary">
              <span className="text-primary">[INFO]</span> {totalJobs === 0 ? "GET STARTED BY CREATING YOUR FIRST JOB" : "ALL SYSTEMS OPERATIONAL"}
            </div>
            <Button variant="primary" href="/jobs/create">
              CREATE NEW JOB
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between font-mono text-xs text-primary">
          <span>© 2026 CRONDASH</span>
          <span>DASHBOARD VIEW</span>
        </div>
      </footer>
    </div>
  )
}
