"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { toast } from "@/components/Toast"

interface JobActionsProps {
  jobId: string
  enabled: boolean
  onToggle?: (enabled: boolean) => void
}

export function JobActions({ jobId, enabled, onToggle }: JobActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [duplicating, setDuplicating] = useState(false)

  async function handleRunNow() {
    setLoading(true)
    await fetch(`/api/jobs/${jobId}/run`, { method: "POST" })
    toast("Job triggered", "success")
    router.refresh()
    setLoading(false)
  }

  async function handleToggle() {
    setToggling(true)
    await fetch(`/api/jobs/${jobId}/toggle`, { method: "POST" })
    toast(enabled ? "Job disabled" : "Job enabled", "success")
    router.refresh()
    setToggling(false)
    if (onToggle) {
      onToggle(!enabled)
    }
  }

  async function handleDuplicate() {
    setDuplicating(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/duplicate`, { method: "POST" })
      if (!res.ok) {
        toast("Failed to duplicate job", "error")
        setDuplicating(false)
        return
      }
      const newJob = await res.json()
      toast("Job duplicated", "success")
      router.push(`/jobs/${newJob.id}`)
    } catch (err) {
      toast("Failed to duplicate job", "error")
      setDuplicating(false)
    }
  }

  return (
    <div className="space-y-3 pt-4">
      <Button
        variant="primary"
        className="w-full"
        onClick={handleRunNow}
        disabled={loading}
      >
        {loading ? 'RUNNING...' : 'RUN NOW'}
      </Button>

      <Button
        variant={enabled ? "secondary" : "primary"}
        className="w-full"
        onClick={handleToggle}
        disabled={toggling}
      >
        {toggling ? 'UPDATING...' : enabled ? 'DISABLE JOB' : 'ENABLE JOB'}
      </Button>

      <Link href={`/jobs/${jobId}/edit`}>
        <Button variant="secondary" className="w-full">
          EDIT JOB
        </Button>
      </Link>

      <Button
        variant="secondary"
        className="w-full"
        onClick={handleDuplicate}
        disabled={duplicating}
      >
        {duplicating ? 'DUPLICATING...' : 'DUPLICATE'}
      </Button>
    </div>
  )
}