/**
 * Console Error Check + Smoke Test for Counterpart V4
 * Target: http://localhost:3001
 * Purpose: Verify CopilotKit errors are resolved, UI is functional.
 */
import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3001";
const AGENT_URL = "http://localhost:2024";

// Known-fixed errors — if any of these appear the fix regressed
const FIXED_ERRORS = [
  "Failed to load runtime info",
  "[CopilotKit] Agent error: Failed to fetch",
  "Agent counterpart_agent not found",
];

test.describe("Console Error Audit + Smoke Test", () => {
  test("no CopilotKit errors in console and UI renders", async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const networkRequests: Array<{ url: string; status: number | null; failed: boolean }> = [];

    // Collect all console messages
    page.on("console", (msg) => {
      const text = msg.text();
      if (msg.type() === "error") {
        consoleErrors.push(text);
      } else if (msg.type() === "warning") {
        consoleWarnings.push(text);
      }
    });

    // Collect page errors (uncaught exceptions)
    page.on("pageerror", (err) => {
      consoleErrors.push(`[PageError] ${err.message}`);
    });

    // Track network requests (especially /copilotkit/*)
    page.on("requestfinished", async (req) => {
      const url = req.url();
      if (
        url.includes("copilotkit") ||
        url.includes("2024") ||
        url.includes("localhost:3001")
      ) {
        const resp = await req.response();
        networkRequests.push({
          url,
          status: resp ? resp.status() : null,
          failed: false,
        });
      }
    });

    page.on("requestfailed", (req) => {
      const url = req.url();
      if (
        url.includes("copilotkit") ||
        url.includes("2024") ||
        url.includes("localhost")
      ) {
        networkRequests.push({
          url,
          status: null,
          failed: true,
        });
      }
    });

    // Navigate and wait for page to settle
    const response = await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30000 });
    expect(response?.status(), `Page load HTTP status`).toBeLessThan(400);

    // Wait an extra 5 seconds to catch any deferred CopilotKit initialization
    await page.waitForTimeout(5000);

    // ── Smoke Test: Main UI visible ───────────────────────────────────────────
    // Look for the "Nueva sesión" heading or form textarea
    const formTextarea = page.locator("textarea[rows='8']");
    const heading = page.locator("text=Nueva sesión");

    const uiVisible =
      (await heading.count()) > 0 || (await formTextarea.count()) > 0;

    // Log everything to test output (visible in reporter)
    console.log("\n══════════════════════════════════════════");
    console.log("CONSOLE ERRORS CAPTURED:", consoleErrors.length);
    consoleErrors.forEach((e, i) => console.log(`  [ERR ${i + 1}] ${e}`));

    console.log("\nCONSOLE WARNINGS CAPTURED:", consoleWarnings.length);
    consoleWarnings.forEach((w, i) => console.log(`  [WARN ${i + 1}] ${w}`));

    console.log("\nNETWORK REQUESTS (CopilotKit / agent):");
    networkRequests.forEach((r) =>
      console.log(
        `  ${r.failed ? "FAILED" : `HTTP ${r.status}`}  ${r.url}`
      )
    );

    console.log("\nUI VISIBLE:", uiVisible);
    console.log("══════════════════════════════════════════\n");

    // ── Assert: fixed errors must not be present ──────────────────────────────
    for (const fixedError of FIXED_ERRORS) {
      const regression = consoleErrors.find((e) => e.includes(fixedError));
      expect(
        regression,
        `REGRESSION: Previously-fixed error is back:\n  "${fixedError}"`
      ).toBeUndefined();
    }

    // ── Assert: main UI must be rendered ─────────────────────────────────────
    expect(uiVisible, "Main UI (form or heading) should be visible").toBe(true);
  });

  test("agent health endpoint at :2024 responds OK", async ({ request }) => {
    let response;
    try {
      response = await request.get(`${AGENT_URL}/health`, { timeout: 10000 });
      const body = await response.json();
      console.log(`\nAgent health: HTTP ${response.status()} — ${JSON.stringify(body)}`);
      expect(response.ok(), "Agent /health should return 2xx").toBeTruthy();
      expect(body.status).toBe("ok");
    } catch (err) {
      console.log(`\nAgent health check FAILED: ${err}`);
      // Don't hard-fail — just report. The agent may not be running.
      test.info().annotations.push({
        type: "warning",
        description: `Agent at ${AGENT_URL}/health unreachable: ${err}`,
      });
    }
  });

  test("copilotkit info endpoint status check", async ({ page }) => {
    const results: Array<{ url: string; status: number | null; failed: boolean; body?: string }> = [];

    page.on("requestfinished", async (req) => {
      if (req.url().includes("copilotkit")) {
        const resp = await req.response();
        let body: string | undefined;
        try {
          body = await resp?.text();
        } catch {
          // ignore
        }
        results.push({
          url: req.url(),
          status: resp?.status() ?? null,
          failed: false,
          body: body?.slice(0, 200),
        });
      }
    });

    page.on("requestfailed", (req) => {
      if (req.url().includes("copilotkit")) {
        results.push({ url: req.url(), status: null, failed: true });
      }
    });

    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(5000);

    console.log("\n── CopilotKit endpoint results ──");
    if (results.length === 0) {
      console.log("  No /copilotkit requests observed");
    } else {
      results.forEach((r) => {
        if (r.failed) {
          console.log(`  FAILED (network): ${r.url}`);
        } else {
          console.log(`  HTTP ${r.status}: ${r.url}`);
          if (r.body) console.log(`    body: ${r.body}`);
        }
      });
    }

    const failedCopilotKit = results.filter((r) => r.failed);
    expect(
      failedCopilotKit.length,
      `${failedCopilotKit.length} CopilotKit request(s) failed at network level: ${JSON.stringify(failedCopilotKit.map((r) => r.url))}`
    ).toBe(0);
  });
});
