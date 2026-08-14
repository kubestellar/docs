# Backup and Disaster Recovery

Hive has two backup paths with different scopes: nightly encrypted hub disaster-recovery archives, and on-demand per-spoke backups an owner can download from the dashboard. Canonical operator docs live in the hive repo: [`v2/docs/backup-restore.md`](https://github.com/kubestellar/hive/blob/v4/v2/docs/backup-restore.md) and [`docs/HUB_DISASTER_RECOVERY.md`](https://github.com/kubestellar/hive/blob/v4/docs/HUB_DISASTER_RECOVERY.md).

## Hub disaster recovery: `hive-backup`

The `hive-backup` tool builds an encrypted archive of everything needed to rebuild a hub:

- hub SaaS state under `/data/saas/**` (users, hive records, keys) and the fleet registry;
- four named hub Kubernetes Secrets — a missing `hive-hub-secrets`, `oci-api-key`, or `hive-hub-kubeconfigs` fails the backup, while a missing `hive-hub-tls` only warns (cert-manager can reissue it);
- each spoke's authoritative config files and GitHub App keys, read via `kubectl exec`; spokes that could not be read are recorded honestly in `MANIFEST.json` under `spoke_errors` rather than silently dropped.

Regenerable bulk state (knowledge caches, home dirs, bead ledgers, logs) is deliberately excluded so a nightly fleet backup stays small and restorable.

The archive is sealed with AES-256-GCM. Every run re-downloads and verifies the upload before pruning old archives — a run that cannot self-verify fails rather than reporting a good backup.

## The `HIVE_BACKUP_KEY` escrow gate

`HIVE_BACKUP_KEY` (a 64-character hex or base64 AES-256 key) has **no default** — an unset key aborts the run rather than writing plaintext. It is deliberately independent of the hub's own key material, because those keys are themselves backup *payload*: deriving the backup key from them would make the archive undecryptable in exactly the disaster it exists for.

> **Escrow the key outside the cluster.** A backup encrypted by a key that only exists in the lost cluster is not recoverable.

## The backup CronJob is opt-in

`v2/deploy/k8s/backup-cronjob.yaml` runs the hub DR path nightly — but it is **not deployed by default**: it is deliberately excluded from the kustomization, and deploying it is an explicit `kubectl apply -f` gated on the operator first creating the `hive-hub-backup-key` Secret with the escrowed key. What the manifest creates:

- a ServiceAccount with **minimal RBAC**: a namespaced Role granting `get` (only) on exactly the four named Secrets above, plus a ClusterRole limited to `pods [get,list]` and `pods/exec [create]` ([hive#3719](https://github.com/kubestellar/hive/pull/3719), [hive#3810](https://github.com/kubestellar/hive/pull/3810));
- a daily CronJob running `ghcr.io/kubestellar/hive:stable` — the backup image tracks the stable [release channel](release-channels.md);
- a ConfigMap with the object-storage bucket and retention (default: keep 30 archives).

Archives upload to OCI Object Storage; remember to allow egress to `objectstorage.<region>.oraclecloud.com` from the hub.

## Restore

`hive-backup verify -file <archive>` checks integrity (the GCM auth tag rejects wrong keys and bit-flips); `hive-backup extract -file <archive> -dest ./restore` decrypts into a directory and verifies hashes — it never mutates a live cluster. A restore operator inspects the extracted `MANIFEST.json`, re-applies the captured Secret JSON, copies hub files back to the hub PVC, and recreates or patches spokes from the per-spoke directories.

## Owner-triggered spoke backup

Complementary to hub DR: a hive owner can download an encrypted backup of one spoke from the dashboard (config, identity, GitHub App keys, state, and the bead ledger — sized for browser download, not fleet DR). It uses the same `HIVE_BACKUP_KEY` mechanism and is owner-only (`only the owner can back up this hive`).
