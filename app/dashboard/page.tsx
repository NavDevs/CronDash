import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { ProfileMenu } from "@/components/ui/ProfileMenu";

export const dynamic = "force-dynamic";

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("crondash-session");
  
  if (!sessionCookie?.value) return null;
  
  try {
    const session = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString());
    return session;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  const userEmail = session.email;

  let jobs: any[] = [];
  let totalJobs = 0;
  let activeJobs = 0;
  let disabledJobs = 0;
  let failedJobs = 0;
  let successCount = 0;

  if (userEmail) {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { 
        jobs: { 
          orderBy: { createdAt: 'desc' },
          include: { runs: { orderBy: { executedAt: 'desc' }, take: 1 } }
        } 
      },
    });

    if (user) {
      jobs = user.jobs;
      totalJobs = jobs.length;
      activeJobs = jobs.filter((j: any) => j.enabled).length;
      disabledJobs = jobs.filter((j: any) => !j.enabled).length;
      failedJobs = jobs.filter((j: any) => j.runs[0]?.status === "failed").length;
      successCount = jobs.filter((j: any) => j.runs[0]?.status === "success").length;
    }
  }

  const successRate = totalJobs === 0
    ? 100
    : Math.round((successCount / totalJobs) * 100);

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
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 font-mono text-xs text-primary border-b border-border pb-2">
                  <div className="col-span-3">NAME</div>
                  <div className="col-span-2">SCHEDULE</div>
                  <div className="col-span-2">STATUS</div>
                  <div className="col-span-2">NEXT RUN</div>
                  <div className="col-span-2">LAST RUN</div>
                  <div className="col-span-1">ACTIONS</div>
                </div>

                {jobs.map((job: any) => (
                  <div
                    key={job.id}
                    className="grid grid-cols-12 gap-4 font-mono text-sm items-center border-b border-border py-3 hover:bg-muted/10 transition-colors"
                  >
                    <div className="col-span-3 text-primary">{job.name}</div>
                    <div className="col-span-2 text-primary">{job.schedule}</div>
                    <div className="col-span-2">
                      <StatusIndicator status={job.enabled ? 'success' : 'pending'} />
                    </div>
                    <div className="col-span-2 text-primary">
                      {job.nextRun ? new Date(job.nextRun).toLocaleString() : 'N/A'}
                    </div>
                    <div className="col-span-2 text-primary">
                      {job.lastRun ? new Date(job.lastRun).toLocaleString() : 'N/A'}
                    </div>
                    <div className="col-span-1 flex gap-2">
                      <Button variant="primary" className="px-2 py-1 text-xs" href={`/jobs/${job.id}`}>
                        VIEW
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="flex justify-between items-center">
            <div className="font-mono text-sm text-primary">
              <span className="text-primary">[INFO]</span> {totalJobs === 0 ? 'GET STARTED BY CREATING YOUR FIRST JOB' : 'ALL SYSTEMS OPERATIONAL'}
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
  );
}