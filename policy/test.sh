#!/usr/bin/env bash
# Runs every policy against its synthetic fixtures: *-pass.* must pass, *-fail-* must fail.
# Usage: policy/test.sh            (from the repo root)
# Real files:  conftest test --policy policy --namespace claude_settings .claude/settings.json
#              conftest test --policy policy --namespace github_workflows .github/workflows/*.yml
#              conftest test --policy policy --namespace dependabot .github/dependabot.yml
#              conftest test --policy policy --data policy/data --namespace model_policy model-policy.yaml
set -u
cd "$(dirname "$0")"
status=0
check() { # namespace prefix (model_policy also needs --data data: the allowed model and effort lists)
  for f in testdata/$2-*; do
    conftest test --policy . --data data --namespace "$1" --no-color "$f" >/dev/null 2>&1; rc=$?
    case "$f" in
      *-pass*) want=0 ;;
      *) want=1 ;;
    esac
    if [ "$rc" -eq "$want" ]; then echo "ok   $f"; else echo "FAIL $f (exit $rc, wanted $want)"; status=1; fi
  done
}
check claude_settings claude
check github_workflows workflow
check dependabot dependabot
check model_policy model
exit $status
