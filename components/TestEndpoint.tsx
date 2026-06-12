"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface TestEndpointProps {
  url: string;
  method: string;
  headers: string;
  body: string;
}

interface TestResult {
  status?: number;
  statusText?: string;
  duration?: number;
  data?: string;
  error?: string;
}

export function TestEndpoint({ url, method, headers, body }: TestEndpointProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  async function handleTest() {
    if (!url.trim()) return;

    setTesting(true);
    setResult(null);

    let parsedHeaders: Record<string, string> = {};
    let parsedBody: string | undefined;

    try {
      if (headers.trim()) parsedHeaders = JSON.parse(headers);
    } catch {
      setResult({ error: "Invalid JSON in Headers field" });
      setTesting(false);
      return;
    }

    try {
      if (body.trim()) parsedBody = JSON.parse(body);
    } catch {
      setResult({ error: "Invalid JSON in Body field" });
      setTesting(false);
      return;
    }

    try {
      const res = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          method,
          headers: parsedHeaders,
          body: parsedBody,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message || "Request failed" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        type="button"
        onClick={handleTest}
        disabled={testing || !url.trim()}
      >
        {testing ? "TESTING..." : "TEST ENDPOINT"}
      </Button>

      {result && (
        <div className="border border-border p-3 font-mono text-xs space-y-1">
          {result.error ? (
            <div className="text-error">[ERROR] {result.error}</div>
          ) : (
            <>
              <div className="flex gap-4">
                <span>
                  STATUS:{" "}
                  <span
                    className={
                      result.status && result.status < 400
                        ? "text-primary"
                        : "text-error"
                    }
                  >
                    {result.status} {result.statusText}
                  </span>
                </span>
                <span>DURATION: {result.duration}ms</span>
              </div>
              {result.data && (
                <div>
                  <div className="text-primary mt-2">RESPONSE:</div>
                  <pre className="text-primary mt-1 whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                    {result.data}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
