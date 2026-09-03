import { NextResponse } from 'next/server'

// Liveness check for the docs app.
//
// This intentionally does NOT check the docs content dependency (that is
// /api/healthz's job, used for the readiness probe). A liveness probe must
// only answer "is this process alive and able to handle a request", because
// the orchestrator's response to a failed liveness check is to kill and
// restart the container. If liveness reused the readiness dependency check,
// a shared-cause outage (e.g. a bad volume mount or missing content in the
// deployed image, affecting every replica identically) would make every
// replica fail liveness at once, triggering a simultaneous restart loop that
// cannot fix the underlying problem and can take the whole deployment fully
// offline instead of just out of rotation. See runbooks/deploy-rollback.md.
export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 })
}
