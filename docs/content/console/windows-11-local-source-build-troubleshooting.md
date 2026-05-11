---
title: "Windows 11 Local Source Build Troubleshooting"
linkTitle: "Windows 11 Source Build Troubleshooting"
weight: 6
description: >
  Troubleshoot common Windows 11 and WSL2 issues when running KubeStellar Console from source, including Vite/backend port mismatches, OAuth redirect mismatches, .env alignment, and missing kubeconfig handling.
keywords:
  - windows 11 kubestellar console troubleshooting
  - wsl2 vite proxy 5174 8080
  - localhost 127.0.0.1 oauth redirect mismatch
  - missing kubeconfig windows wsl
---

# Windows 11 local source build troubleshooting

Use **WSL2** for the source build and keep your browser, GitHub OAuth App, and local environment aligned to the same URL scheme. Most Windows-specific failures come from a mismatch between the Vite dev server, the Go backend, and the loopback address used during OAuth.

## Before you start

- Run `./start-dev.sh` or `./startup-oauth.sh` **inside WSL2**.
- Prefer **`localhost` everywhere** unless you intentionally switch to `127.0.0.1`.
- Verify which mode you are using before debugging ports:

| Command | Browser entrypoint | Backend target | OAuth required |
|---|---|---|---|
| `./start-dev.sh` | `http://localhost:5174` | `http://localhost:8080` | No |
| `./startup-oauth.sh` | `http://localhost:8080` | `http://localhost:8081` behind the watchdog on `:8080` | Yes |
| `./startup-oauth.sh --dev` | `http://localhost:5174` | `http://localhost:8081` via the Vite proxy and watchdog | Yes |

## Port configuration: Vite on `:5174`, backend on `:8080` or `:8081`

**Symptom:** the UI opens, but API calls fail, the login button spins forever, or the browser shows `404`, `502`, or WebSocket errors.

**Cause:** on source builds, the browser usually talks to **Vite on `:5174`**, while the API still lives on the Go backend. The checked-in Vite config proxies `/api`, `/auth/github`, `/auth/github/callback`, and `/ws` to the backend port.

```ts
const backendPort = process.env.BACKEND_LISTEN_PORT || '8081'
const target = `http://localhost:${backendPort}`

proxy: {
  '/api': { target, changeOrigin: true },
  '/auth/github': { target, changeOrigin: true },
  '/auth/github/callback': { target, changeOrigin: true },
  '/ws': { target: `ws://localhost:${backendPort}`, ws: true },
}
```

### What to use on Windows

- For **`./start-dev.sh`**, keep the browser on `http://localhost:5174` and make sure the proxy targets **port `8080`**.
- For **`./startup-oauth.sh --dev`**, keep the browser on `http://localhost:5174`, but let the proxy target the backend behind the watchdog on **port `8081`**.
- For **`./startup-oauth.sh`** without `--dev`, do not use Vite at all; open **`http://localhost:8080`**.

If you run Vite manually, export the backend port explicitly before starting it:

```bash
# start-dev.sh style
export BACKEND_LISTEN_PORT=8080
npm run dev -- --port 5174
```

## Loopback mismatches: `localhost` vs `127.0.0.1`

**Symptom:** GitHub redirects back with `redirect_uri_mismatch`, `csrf_validation_failed`, or the callback lands on the wrong page.

**Cause:** on Windows, `localhost` and `127.0.0.1` are usually equivalent for humans, but GitHub OAuth treats them as different redirect URIs. Mixing them across WSL, the Windows browser, the GitHub OAuth App, and the local script setup breaks the handshake.

### Recommended fix

Pick **one** hostname and use it everywhere. The easiest path is:

- Browser URL: `http://localhost:5174` or `http://localhost:8080`
- GitHub OAuth App homepage URL: `http://localhost:5174` for `--dev`, otherwise `http://localhost:8080`
- GitHub OAuth callback URL: `http://localhost:8080/auth/github/callback`
- Any manual overrides such as `FRONTEND_URL`: use `localhost`, not `127.0.0.1`

If you decide to use `127.0.0.1`, update **all** of those values together and clear cookies for the old host before retrying.

## Environment sync: GitHub App settings and `.env` must match

**Symptom:** the sign-in page loads, but GitHub rejects the callback or the backend cannot complete the token exchange.

Create `.env` in the **repo root** (the same directory as `startup-oauth.sh`) and then align it with the GitHub OAuth App.

```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

### Checklist

1. Create the GitHub OAuth App in GitHub Developer Settings.
2. Copy the **Client ID** and **Client Secret** into `.env`.
3. Make the GitHub App URLs match the mode you actually run:

| Mode | Homepage URL | Callback URL |
|---|---|---|
| `./startup-oauth.sh` | `http://localhost:8080` | `http://localhost:8080/auth/github/callback` |
| `./startup-oauth.sh --dev` | `http://localhost:5174` | `http://localhost:8080/auth/github/callback` |

4. Restart the console after every `.env` or GitHub App change.
5. If you changed hostnames, remove cookies for the old local origin and sign in again.

> `./start-dev.sh` does not require GitHub OAuth. Use it when you only need a local `dev-user` session.

## Missing `~/.kube/config` in WSL2 or Windows

**Symptom:** cluster views stay empty, backend logs keep warning about kubeconfig, or `kubectl`-backed features fail immediately.

**Cause:** the console checks `KUBECONFIG` first and otherwise falls back to `~/.kube/config`. On Windows 11, your kubeconfig may exist only in the Windows profile, not inside WSL.

### Fix option 1: copy the Windows kubeconfig into WSL

```bash
mkdir -p ~/.kube
cp /mnt/c/Users/<windows-user>/.kube/config ~/.kube/config
chmod 600 ~/.kube/config
kubectl config get-contexts
```

### Fix option 2: point `KUBECONFIG` at the Windows file

```bash
export KUBECONFIG=/mnt/c/Users/<windows-user>/.kube/config
kubectl config get-contexts
```

### Fix option 3: no-cluster / UI-only work

If you are only working on the frontend, use demo data instead of a live kubeconfig:

```bash
cd web
VITE_DEMO_MODE=true npm run dev -- --port 5174
```

That gives you a clean UI-only workflow while you sort out kubeconfig access.

## Quick verification commands

Run these from **WSL2** after changes:

```bash
# Frontend reachable
curl -I http://localhost:5174

# Backend / watchdog reachable
curl -I http://localhost:8080

# kubeconfig visible to kubectl
kubectl config get-contexts
```

From **PowerShell**, use `curl.exe` or `Invoke-RestMethod` instead of the PowerShell `curl` alias.
