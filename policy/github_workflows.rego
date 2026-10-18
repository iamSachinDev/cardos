# Policy for .github/workflows/*.yml (AGENTS.md §7: CI/workflow files are HIGH risk).
package github_workflows

import rego.v1

# Top-level permissions must be set (least privilege; per-job overrides are fine).
deny contains msg if {
	not input.permissions
	msg := "workflow must set top-level `permissions` (use `contents: read` as the default)"
}

# Every third-party `uses:` must be pinned to a full 40-character commit SHA. Local actions (./) are exempt.
deny contains msg if {
	some job_name, job in input.jobs
	some i, step in job.steps
	step.uses
	not startswith(step.uses, "./")
	not pinned(step.uses)
	msg := sprintf("job %q step %d: `uses: %s` must be pinned to a 40-character commit SHA", [job_name, i + 1, step.uses])
}

# Reusable workflows called at job level are `uses` too.
deny contains msg if {
	some job_name, job in input.jobs
	job.uses
	not startswith(job.uses, "./")
	not pinned(job.uses)
	msg := sprintf("job %q: `uses: %s` must be pinned to a 40-character commit SHA", [job_name, job.uses])
}

pinned(ref) if regex.match(`@[0-9a-f]{40}$`, ref)

# actions/checkout must not persist credentials into the workspace.
deny contains msg if {
	some job_name, job in input.jobs
	some i, step in job.steps
	startswith(step.uses, "actions/checkout@")
	not persist_false(step)
	msg := sprintf("job %q step %d: actions/checkout must set `with.persist-credentials: false`", [job_name, i + 1])
}

persist_false(step) if step.with["persist-credentials"] == false

persist_false(step) if step.with["persist-credentials"] == "false"
