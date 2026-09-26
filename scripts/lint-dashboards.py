#!/usr/bin/env python3
"""Bounded structural lint for the repo's Grafana dashboard JSON and
Prometheus alert-rule YAML files under cluster-objects/.

This does not talk to any Grafana/Prometheus API and does not require an
observability backend — it only checks that committed dashboard/alert
files are well-formed and free of unbounded label usage, so a malformed
file can't silently ship. Intended to run in CI (see
.github/workflows/dashboard-lint.yml).
"""
import json
import sys
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
CLUSTER_OBJECTS = REPO_ROOT / "cluster-objects"

# Label names that would make a metric's cardinality effectively
# unbounded if driven from user input. These must never appear as a
# PromQL "by (...)" grouping label or Grafana template variable sourced
# from free text in the files this script lints.
UNBOUNDED_LABEL_HINTS = ("path", "url", "query", "user", "ip", "email")


def lint_dashboard_json(path: Path) -> list[str]:
    errors = []
    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError as exc:
        return [f"{path}: invalid JSON ({exc})"]

    for required in ("title", "panels"):
        if required not in data:
            errors.append(f"{path}: missing required top-level key '{required}'")

    panels = data.get("panels", [])
    if not isinstance(panels, list) or len(panels) == 0:
        errors.append(f"{path}: 'panels' must be a non-empty list")

    for panel in panels if isinstance(panels, list) else []:
        for target in panel.get("targets", []):
            expr = target.get("expr", "")
            for hint in UNBOUNDED_LABEL_HINTS:
                if f"by ({hint}" in expr or f", {hint}" in expr:
                    errors.append(
                        f"{path}: panel '{panel.get('title')}' query groups by "
                        f"potentially unbounded label '{hint}': {expr}"
                    )
    return errors


def lint_alert_yaml(path: Path) -> list[str]:
    errors = []
    try:
        docs = list(yaml.safe_load_all(path.read_text()))
    except yaml.YAMLError as exc:
        return [f"{path}: invalid YAML ({exc})"]

    for doc in docs:
        if not doc:
            continue
        if doc.get("kind") != "PrometheusRule":
            continue
        groups = doc.get("spec", {}).get("groups", [])
        if not groups:
            errors.append(f"{path}: PrometheusRule has no rule groups")
        for group in groups:
            for rule in group.get("rules", []):
                if "alert" not in rule:
                    continue
                if "expr" not in rule:
                    errors.append(
                        f"{path}: alert '{rule.get('alert')}' missing 'expr'"
                    )
                if "for" not in rule:
                    errors.append(
                        f"{path}: alert '{rule.get('alert')}' missing 'for' "
                        "(alerts without a for-duration are noisy/flappy)"
                    )
                if not rule.get("annotations", {}).get("summary"):
                    errors.append(
                        f"{path}: alert '{rule.get('alert')}' missing "
                        "annotations.summary"
                    )
    return errors


def main() -> int:
    if not CLUSTER_OBJECTS.is_dir():
        print(f"no cluster-objects/ directory at {CLUSTER_OBJECTS}, nothing to lint")
        return 0

    all_errors: list[str] = []
    for path in sorted(CLUSTER_OBJECTS.glob("dashboard-*.json")):
        all_errors.extend(lint_dashboard_json(path))
    for path in sorted(CLUSTER_OBJECTS.glob("*.yaml")):
        if path.name.startswith(("dashboard-",)):
            continue
        text = path.read_text()
        if "PrometheusRule" in text:
            all_errors.extend(lint_alert_yaml(path))

    if all_errors:
        print("dashboard-lint found problems:")
        for err in all_errors:
            print(f"  - {err}")
        return 1

    print("dashboard-lint: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
