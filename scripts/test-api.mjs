const BASE = "http://localhost:3000";
let sessionCookie = "";

async function test(name, method, path, body) {
  const opts = { method, headers: {} };
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  if (sessionCookie) opts.headers["Cookie"] = `crondash-session=${sessionCookie}`;

  try {
    const res = await fetch(`${BASE}${path}`, opts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    const ok = res.ok ? "PASS" : "FAIL";
    console.log(`[${ok}] ${name} → ${res.status}`);
    if (data && typeof data === "object") console.log(`       ${JSON.stringify(data).slice(0, 120)}`);
    // Extract session cookie from Set-Cookie header
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/crondash-session=([^;]+)/);
      if (match) sessionCookie = match[1];
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.log(`[FAIL] ${name} → ${e.message}`);
    return { ok: false, error: e.message };
  }
}

async function run() {
  console.log("\n========== CRONDASH API TEST SUITE ==========\n");

  // 1. Register (unique email per run)
  const testEmail = `apitest${Date.now()}@test.com`;
  await test("Register new user", "POST", "/api/auth/register", {
    email: testEmail, password: "testpass123"
  });

  // 2. Me (authenticated)
  await test("Get current user", "GET", "/api/auth/me");

  // 3. Create job
  const createRes = await test("Create job", "POST", "/api/jobs", {
    name: "Test Job", url: "https://httpbin.org/get",
    method: "GET", schedule: "*/5 * * * *"
  });

  // 4. List jobs
  const listRes = await test("List jobs", "GET", "/api/jobs");

  const jobId = listRes.data?.[0]?.id;
  if (!jobId) { console.log("\nNo job ID found, skipping remaining tests.\n"); return; }

  // 5. Get single job
  await test("Get single job", "GET", `/api/jobs/${jobId}`);

  // 6. Run job manually
  await test("Run job manually", "POST", `/api/jobs/${jobId}/run`);

  // 7. Get run history
  await test("Get run history", "GET", `/api/jobs/${jobId}/runs`);

  // 8. Toggle job (disable)
  await test("Toggle job off", "POST", `/api/jobs/${jobId}/toggle`);

  // 9. Toggle job (enable)
  await test("Toggle job on", "POST", `/api/jobs/${jobId}/toggle`);

  // 10. Update job
  await test("Update job", "PUT", `/api/jobs/${jobId}`, {
    name: "Updated Test Job", schedule: "*/10 * * * *"
  });

  // 11. Duplicate job
  await test("Duplicate job", "POST", `/api/jobs/${jobId}/duplicate`);

  // 12. Save settings
  await test("Save email setting", "POST", "/api/settings/email", {
    alertEmail: "alerts@test.com"
  });
  await test("Save slack setting", "POST", "/api/settings/slack", {
    slackWebhook: "https://hooks.slack.com/test"
  });
  await test("Save webhook setting", "POST", "/api/settings/webhook", {
    webhookUrl: "https://hooks.example.com/test"
  });
  await test("Regenerate API key", "POST", "/api/settings/apikey");

  // 13. Test endpoint
  await test("Test endpoint", "POST", "/api/test", {
    url: "https://httpbin.org/get", method: "GET", headers: {}
  });

  // 14. Register duplicate (should fail)
  await test("Register duplicate email (should fail)", "POST", "/api/auth/register", {
    email: testEmail, password: "testpass123"
  });

  // 15. Login with wrong password (should fail)
  await test("Login wrong password (should fail)", "POST", "/api/auth/login", {
    email: testEmail, password: "wrongpassword"
  });

  // 16. Logout
  await test("Logout", "POST", "/api/auth/logout");

  // 17. Me without session (should fail)
  sessionCookie = "";
  await test("Me without session (should fail)", "GET", "/api/auth/me");

  // 18. Get job without session (should fail)
  await test("Get job without session (should fail)", "GET", `/api/jobs/${jobId}`);

  // 19. Delete job (re-login first)
  await test("Re-login", "POST", "/api/auth/login", {
    email: testEmail, password: "testpass123"
  });
  await test("Delete job", "DELETE", `/api/jobs/${jobId}`);

  console.log("\n========== TESTS COMPLETE ==========\n");
}

run();
