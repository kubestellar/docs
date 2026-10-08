# Runbook: Rollout-Checker CronJob Stalled

## Scope

Applies to the `DocsRolloutCheckerStalled` and `DocsPrRolloutCheckerStalled`
alerts defined in `cluster-objects/prometheusrule.yaml`. Both fire from
kube-state-metrics' `kube_cronjob_status_last_successful_time`, so they
require a Prometheus Operator and kube-state-metrics already running in the
cluster (no exporter is installed by this repo) — if neither alert has ever
fired and you don't know whether that monitoring exists, the CronJobs
themselves are still the thing to check by hand below.

These two CronJobs (`cluster-objects/job.yaml`,
`cluster-objects/pr-job.yaml`) are the only mechanism that deploys new
`kubestellar-docs` images:

- **`nextra-rollout-checker`** (schedule `*/2 * * * *`, namespace `docs`) —
  polls OCIR for the latest `kubestellar-docs` image digest and
  `kubectl set image`s the production Deployment
  (`cluster-objects/deployment.yaml`) when a newer digest appears. A run
  that finds no newer image still exits `0` ("skipping rollout"), so a
  healthy CronJob does **not** mean a new image went out — only that the
  checker itself is working.
- **`nextra-pr-rollout-checker`** (schedule `*/1 * * * *`, namespace `docs`)
  — the same mechanism for per-PR preview Deployments.

Both scripts run with `set -e` (any failed step — missing env vars,
`kubectl`/`oci` auth, a malformed OCI API response — exits the job
non-zero), both CronJobs are `concurrencyPolicy: Forbid` with
`backoffLimit: 0`, and `failedJobsHistoryLimit: 1` keeps at most one failed
Job around. There is no retry beyond the next scheduled tick.

- **`DocsRolloutCheckerStalled`** — fires when the production checker has
  not completed a successful run in over 15 minutes (more than 7 missed
  2-minute ticks).
- **`DocsPrRolloutCheckerStalled`** — fires when the PR-preview checker has
  not completed a successful run in over 10 minutes (more than 9 missed
  1-minute ticks).

## Diagnosis

1. Confirm the CronJob is actually failing, not just slow to be scraped:
   ```sh
   kubectl get cronjob -n docs nextra-rollout-checker nextra-pr-rollout-checker
   kubectl get jobs -n docs -l 'job-name' --sort-by=.metadata.creationTimestamp
   ```
   Look at `LAST SCHEDULE` and whether the most recent Job succeeded.
2. Read the failing Job's logs — the script's `[DEBUG]`/`[ERROR]` lines
   (`cluster-objects/job.yaml` / `cluster-objects/pr-job.yaml`
   ConfigMap data) point at the failing step directly:
   ```sh
   kubectl logs -n docs job/<failing-job-name>
   ```
3. Common root causes, roughly in likelihood order:
   - **Expired/rotated `oci-config-secret`** — `oci artifacts container
     image list` fails auth. Re-provision the secret
     (`cluster-objects/rbac.yaml` mounts it at `/home/appuser/.oci`).
   - **RBAC regression** on `nextra-rollout-sa`
     (`cluster-objects/rbac.yaml`) — `kubectl set image` / `kubectl
     annotate` / `kubectl get deploy` denied. Diff the live Role against
     the manifest.
   - **OCI API outage/throttling** — transient; confirm via the OCI status
     page, no action needed beyond waiting if the next scheduled run
     recovers on its own.
   - **Missing `COMPARTMENT_OCID`/`PROD_REPO_OCID`/`REPO_OCID`** env vars
     after a Secret/ConfigMap edit — the script's `:?` guards fail fast
     with an explicit `not set` error naming the variable.
4. If the checker itself is healthy but a specific rollout is stuck (e.g.
   repeated `kubectl set image` with no corresponding pod update), see
   `runbooks/deploy-rollback.md` instead — this runbook is about the
   *checker* not running, not about a bad image once rolled out.

## Recovery

- Fix the underlying cause (secret rotation, RBAC, OCI-side issue) — the
  CronJob needs no manual retry; the next scheduled tick (within 1–2
  minutes) resumes normal operation once the blocker is cleared.
- If a production image needs to go out immediately and the checker can't
  be fixed in time, you can run the same `kubectl set image` step by hand
  using the digest from `oci artifacts container image list` — see the
  script body in `cluster-objects/job.yaml` for the exact command.
- Once the alert clears (next successful run updates
  `kube_cronjob_status_last_successful_time`), Prometheus resolves it
  automatically — no manual alert acknowledgment is needed.
