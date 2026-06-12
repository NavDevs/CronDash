"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"

export function JobActions({ jobId }: { jobId: string }) {
  const router = useRouter()
  
  async function handleRunNow() {
    await fetch(`/api/jobs/${jobId}/run`, { method: "POST" })
    router.refresh()
  }

  return (
    <div className="pt-4">
      <Button variant="primary" className="w-full" onClick={handleRunNow}>
        RUN NOW
      </Button>
    </div>
  )
}
