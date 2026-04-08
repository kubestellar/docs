---
title: "Authentication & Sessions"
linkTitle: "Authentication"
weight: 5
description: >
  How KubeStellar Console handles authentication via GitHub OAuth, session management with JWTs, and security considerations.
---

# Authentication & Sessions

KubeStellar Console uses GitHub OAuth 2.0 for user authentication and JWT-based sessions for maintaining login state. This page documents the full authentication lifecycle.

## Overview

The console separates two types of credentials:

| Credential | Purpose | Flow |
|-----------|---------|------|
| **GitHub OAuth** | User identity (who you are) | Browser > GitHub > Backend |
| **Kubeconfig** | Cluster access (what you can see) | Backend > MCP Bridge > Clusters |

GitHub login establishes your identity inside the console. Kubernetes cluster credentials come from your kubeconfig and never pass through GitHub.

---

## Authentication Modes

### 1. OAuth Mode (`startup-oauth.sh`)

Full GitHub authentication with multi-user support.

**Flow:**

1. User clicks "Sign in with GitHub" on the console login page
2. Browser redirects to GitHub's authorization endpoint with the console's `client_id`
3. User authorizes the console on GitHub
4. GitHub redirects back to `http://localhost:8080/auth/github/callback` with an authorization code
5. The Go backend exchanges the authorization code for an access token using the `client_secret`
6. Backend fetches the user's GitHub profile (username, avatar, email)
7. Backend creates a JWT session token containing the user identity
8. JWT is stored as an HTTP-only cookie in the browser
9. User is redirected to the dashboard

**Security properties:**

- The `client_secret` never leaves the backend server
- The authorization code is single-use and short-lived
- The access token is used server-side only to fetch the user profile
- CSRF protection is enforced on the callback (state parameter validation)

### 2. Development Mode (`start-dev.sh`)

No authentication required. A local `dev-user` session is created automatically.

**Flow:**

1. Backend starts and detects no OAuth credentials are configured
2. A `dev-user` session is created with a default profile
3. All API requests are treated as authenticated
4. No login page is shown

This mode is suitable for local development only and should never be used in production.

---

## Session Lifecycle

### JWT Structure

The console uses JSON Web Tokens (JWTs) for session management:

| Field | Description |
|-------|-------------|
| `sub` | GitHub username |
| `name` | Display name |
| `avatar` | GitHub avatar URL |
| `email` | GitHub email (if public) |
| `iat` | Token issued-at timestamp |
| `exp` | Token expiration timestamp |

### Session Duration

- Sessions are valid for the duration configured on the backend (default: 24 hours)
- The JWT is stored as an HTTP-only, secure cookie
- Sessions persist across browser restarts (cookie-based)
- Closing all browser tabs does not end the session

### Session Refresh

- The frontend checks session validity on page load
- If the JWT is expired, the user is redirected to the login page
- There is no silent refresh -- expired sessions require re-authentication

---

## Logout

When a user logs out:

1. The frontend calls the `/auth/logout` endpoint
2. The backend invalidates the session cookie (sets expiry to the past)
3. Any active WebSocket connections are closed
4. The browser is redirected to the login page
5. Local storage preferences (theme, dashboard layout) are preserved
6. Cached cluster data is cleared from the frontend

---

## WebSocket Authentication

The console uses WebSocket connections for real-time features (AI Missions, live updates). WebSocket authentication works as follows:

1. The frontend establishes a WebSocket connection to the backend
2. The session JWT cookie is sent with the WebSocket upgrade request
3. The backend validates the JWT before accepting the connection
4. If the JWT expires during an active WebSocket session, the backend closes the connection
5. The frontend automatically attempts to reconnect and redirects to login if re-authentication is needed

---

## Security Features

### CORS Policy

The backend enforces strict CORS rules:

- Only the configured origin (e.g., `http://localhost:8080`) is allowed
- Credentials (cookies) are included in cross-origin requests
- Preflight requests are cached to reduce latency

### CSRF Protection

- The OAuth flow uses a `state` parameter to prevent CSRF attacks
- The state is generated server-side and validated on the callback
- Mismatched state values result in a `csrf_validation_failed` error

### XSS Prevention

- All user-generated content is sanitized with DOMPurify before rendering
- The Content-Security-Policy header restricts script sources
- `dangerouslySetInnerHTML` usage has been eliminated in favor of safe rendering

### Path Traversal Protection

- API endpoints validate and sanitize file paths
- Directory traversal sequences (`../`) are rejected
- Static file serving is restricted to the frontend build directory

### MCP Input Validation

- All MCP (Model Context Protocol) query parameters are validated before being passed to cluster operations
- Invalid or malicious inputs are rejected with descriptive error messages

### RBAC Endpoint Restrictions

Seven sensitive API endpoints are restricted to the **admin** role:

- Cluster sync triggers, webhook management, session termination
- System-wide settings modification, backup/restore operations, cache clearing
- Non-admin users receive a `403 Forbidden` response with a descriptive error message

See [Console Features — RBAC Endpoint Restrictions](console-features.md#rbac-endpoint-restrictions-new-in-april-2026) for the full endpoint list.

### Body Size Limits

Webhook and cluster sync endpoints enforce request body size limits to prevent denial-of-service:

- Webhook endpoints: 1 MB max
- Cluster sync endpoints: 5 MB max
- Configurable via `MAX_WEBHOOK_BODY_BYTES` and `MAX_CLUSTER_SYNC_BODY_BYTES` environment variables

### Supply Chain Security

- **OpenSSF Silver** badge achieved
- **SLSA Level 3** provenance attestations published with every release
- **Cosign signatures** on all container images and Helm charts

See [Console Features — OpenSSF Silver, SLSA, and Cosign](console-features.md#openssf-silver-slsa-provenance-and-cosign-signing-new-in-april-2026) for verification commands.

---

## Configuring OAuth for Different Environments

| Environment | Homepage URL | Callback URL |
|-------------|-------------|--------------|
| Local dev | `http://localhost:8080` | `http://localhost:8080/auth/github/callback` |
| Kubernetes | `https://console.your-domain.com` | `https://console.your-domain.com/auth/github/callback` |
| OpenShift | `https://ksc.apps.your-cluster.com` | `https://ksc.apps.your-cluster.com/auth/github/callback` |

Each environment requires its own GitHub OAuth App registration with matching callback URLs.

---

## Troubleshooting

### "exchange_failed" After GitHub Login

The Client Secret is wrong or has been regenerated:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers) > your OAuth App
2. Generate a new Client Secret
3. Update `GITHUB_CLIENT_SECRET` in your `.env` file
4. Restart the console

### "csrf_validation_failed"

The callback URL in GitHub does not match the console's URL:

1. Verify the **Authorization callback URL** in your GitHub OAuth App settings matches exactly
2. Clear your browser cookies for `localhost`
3. Restart the console

### 404 or Blank Page After Login

OAuth credentials are not configured correctly:

1. Verify the `.env` file exists in the repository root
2. Check that both `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set
3. View backend logs for error details

### Session Expires Too Quickly

The JWT expiration is configured on the backend. If sessions expire unexpectedly:

1. Check system clock synchronization (JWT validation is time-sensitive)
2. Verify the backend has not been restarted (signing keys may change)

---

## Related Documentation

- [Local Setup Guide](local-setup.md) -- Environment variables and startup scripts
- [Architecture](architecture.md) -- How auth fits into the system design
- [Installation](installation.md) -- Deploying with OAuth in production
