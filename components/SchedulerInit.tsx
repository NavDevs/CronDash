"use client"

import { useEffect } from "react"

export function SchedulerInit() {
  useEffect(() => {
    fetch("/api/init").catch(console.error)
  }, [])

  return null
}
