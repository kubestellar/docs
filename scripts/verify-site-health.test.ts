/**
 * Subprocess-style tests for scripts/verify-site-health.sh — the runbook
 * script cited from runbooks/deploy-rollback.md ("Detecting a bad deploy").
 * The script polls `${site-url}/api/healthz` and exits 0 on HTTP 200,
 * 1 on any other status or on network failure.
 *
 * Each test starts a fresh local HTTP server whose handler encodes the
 * scenario, invokes the script against it, and stops the server before
 * returning. No network is required.
 *
 * Same subprocess-harness pattern used by scripts/update-version.test.ts.
 *
 * Filed under kubestellar/docs#6842.
 */
import { describe, test, expect } from "vitest";
import { spawn } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { AddressInfo } from "node:net";
import { join } from "node:path";

const SCRIPT_PATH = join(__dirname, "verify-site-health.sh");

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

async function withServer<T>(
  handler: Handler,
  body: (url: string) => Promise<T>
): Promise<T> {
  const server = createServer(handler);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as AddressInfo).port;
  const url = `http://127.0.0.1:${port}`;
  try {
    return await body(url);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
}

// Async — MUST be async so the in-process HTTP server (same event loop)
// can accept and respond while curl is in flight. spawnSync would block
// the event loop and deadlock every non-first test.
function runScript(siteUrl: string): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn("bash", [SCRIPT_PATH, siteUrl], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (b) => { stdout += b.toString(); });
    proc.stderr.on("data", (b) => { stderr += b.toString(); });
    proc.on("close", (code) => resolve({ status: code, stdout, stderr }));
  });
}

function statusHandler(code: number, body: string): Handler {
  return (_req, res) => {
    res.writeHead(code, { "content-type": "application/json", "content-length": Buffer.byteLength(body) });
    res.end(body);
  };
}

describe("verify-site-health.sh", () => {
  test("exits 0 and prints OK when /api/healthz returns 200", async () => {
    await withServer(statusHandler(200, JSON.stringify({ status: "ok" })), async (url) => {
      const res = await runScript(url);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain("[verify-site-health] OK");
      expect(res.stdout).toContain("returned 200");
      expect(res.stdout).toContain('"status":"ok"');
    });
  });

  test("strips a trailing slash from the site URL (no doubled //api/healthz)", async () => {
    await withServer(statusHandler(200, "{}"), async (url) => {
      const res = await runScript(url + "/");
      expect(res.status).toBe(0);
      expect(res.stdout).toContain(`${url}/api/healthz`);
      expect(res.stdout).not.toContain("//api/healthz");
    });
  });

  test("exits 1 on 503 and echoes the failure body plus the runbook pointer", async () => {
    const body = JSON.stringify({ status: "degraded", reason: "content-missing" });
    await withServer(statusHandler(503, body), async (url) => {
      const res = await runScript(url);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("[verify-site-health] UNHEALTHY");
      expect(res.stdout).toContain("returned 503");
      expect(res.stdout).toContain('"reason":"content-missing"');
      expect(res.stdout).toContain("runbooks/deploy-rollback.md");
    });
  });

  test("exits 1 on 404 with a plain-text body", async () => {
    await withServer(statusHandler(404, "not found"), async (url) => {
      const res = await runScript(url);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("returned 404");
      expect(res.stdout).toContain("not found");
      expect(res.stdout).toContain("runbooks/deploy-rollback.md");
    });
  });

  test("exits 1 on 500 with an empty body (no crash on empty response)", async () => {
    await withServer(statusHandler(500, ""), async (url) => {
      const res = await runScript(url);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("returned 500");
      expect(res.stdout).toContain("runbooks/deploy-rollback.md");
    });
  });

  test("exits 1 when the URL is unreachable (immediate connection refused)", async () => {
    // Bind an ephemeral port then release it — subsequent connects are refused
    // fast (no 15s curl --max-time wait).
    const s = createServer(() => {});
    await new Promise<void>((r) => s.listen(0, "127.0.0.1", r));
    const port = (s.address() as AddressInfo).port;
    await new Promise<void>((r) => s.close(() => r()));
    const res = await runScript(`http://127.0.0.1:${port}`);
    expect(res.status).toBe(1);
    expect(res.stdout).toContain("[verify-site-health] UNHEALTHY");
    expect(res.stdout).toContain("could not reach");
  });
});
