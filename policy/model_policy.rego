# Policy for model-policy.yaml (Phase 7). Dry-run check, no agent is run.
# Needs the allowed lists: conftest test --policy policy --data policy/data --namespace model_policy model-policy.yaml
# Checks: structure, every model and effort is one the CLI offers (data.cli_capabilities), HIGH and CRITICAL map to
# premium, effort never drops from a lower tier to a higher one, and the recorded sources match the verified versions.
package model_policy

import rego.v1

caps := data.cli_capabilities

effort_rank := {"low": 1, "medium": 2, "high": 3, "xhigh": 4, "max": 5, "ultra": 6}

required_tiers := {"fast", "balanced", "premium"}

required_classes := {"LOW", "MEDIUM", "HIGH", "CRITICAL"}

clis := {"claude", "codex"}

# Tier strength is part of the policy, not just the spelling of model IDs. A listed fast model
# must not become the premium route for HIGH or CRITICAL work.
approved_tier_models := {
	"fast": {"claude": "haiku", "codex": "gpt-6-luna"},
	"balanced": {"claude": "sonnet", "codex": "gpt-6.1-sol"},
	"premium": {"claude": "opus", "codex": "gpt-6-astra"},
}

deny contains "model-policy.yaml must declare `version: 1`" if object.get(input, "version", null) != 1

# tier_order: exactly the three tiers, low to high.
deny contains "tier_order must be [fast, balanced, premium]" if object.get(input, "tier_order", null) != ["fast", "balanced", "premium"]

deny contains sprintf("tiers.%s is missing", [t]) if {
	some t in required_tiers
	not input.tiers[t]
}

deny contains sprintf("tiers.%s is not a required tier (fast, balanced, premium)", [t]) if {
	some t, _ in input.tiers
	not t in required_tiers
}

deny contains sprintf("tiers.%s.use_for must be a non-empty list", [t]) if {
	some t in required_tiers
	input.tiers[t]
	not non_empty_list(input.tiers[t].use_for)
}

non_empty_list(x) if {
	is_array(x)
	count(x) > 0
}

# Every tier names a model and an effort for each CLI.
deny contains sprintf("tiers.%s.%s needs a model and an effort", [t, c]) if {
	some t in required_tiers
	some c in clis
	input.tiers[t]
	not has_model_and_effort(t, c)
}

has_model_and_effort(t, c) if {
	is_string(input.tiers[t][c].model)
	is_string(input.tiers[t][c].effort)
}

deny contains sprintf("tiers.%s.%s.model %q is not the approved %s-tier model (%q)", [t, c, m, t, approved_tier_models[t][c]]) if {
	some t in required_tiers
	some c in clis
	m := input.tiers[t][c].model
	m != approved_tier_models[t][c]
}

# Claude: model is an offered alias, effort an offered level.
deny contains sprintf("tiers.%s.claude.model %q is not offered by Claude Code (allowed: %s)", [t, m, concat(", ", caps.claude.models)]) if {
	some t in required_tiers
	m := input.tiers[t].claude.model
	not m in caps.claude.models
}

deny contains sprintf("tiers.%s.claude.effort %q is not a Claude Code effort level (allowed: %s)", [t, e, concat(", ", caps.claude.effort)]) if {
	some t in required_tiers
	e := input.tiers[t].claude.effort
	not e in caps.claude.effort
}

# Codex: model is in the catalog, and effort is supported by that model.
deny contains sprintf("tiers.%s.codex.model %q is not offered by Codex (allowed: %s)", [t, m, concat(", ", sort([k | some k, _ in caps.codex.models]))]) if {
	some t in required_tiers
	m := input.tiers[t].codex.model
	not caps.codex.models[m]
}

deny contains sprintf("tiers.%s.codex.effort %q is not supported by model %q (supported: %s)", [t, e, m, concat(", ", caps.codex.models[m])]) if {
	some t in required_tiers
	m := input.tiers[t].codex.model
	e := input.tiers[t].codex.effort
	caps.codex.models[m]
	not e in caps.codex.models[m]
}

# Effort never goes down when the tier goes up.
deny contains sprintf("%s effort drops from tier %s (%s) to %s (%s): effort must not decrease as the tier rises", [c, lo, e_lo, hi, e_hi]) if {
	some c in clis
	some i, lo in input.tier_order
	hi := input.tier_order[i + 1]
	e_lo := input.tiers[lo][c].effort
	e_hi := input.tiers[hi][c].effort
	effort_rank[e_lo] > effort_rank[e_hi]
}

# Balanced and premium start at medium effort at least (evidence P3-C6b: low effort read part of a long file).
deny contains sprintf("tiers.%s.%s.effort is low: balanced and premium need at least medium", [t, c]) if {
	some t in {"balanced", "premium"}
	some c in clis
	input.tiers[t][c].effort == "low"
}

deny contains sprintf("tiers.premium.%s.effort %q is below high", [c, e]) if {
	some c in clis
	e := input.tiers.premium[c].effort
	effort_rank[e] < effort_rank.high
}

# Risk classes: all four present, each pointing at a tier; HIGH and CRITICAL are premium; MEDIUM is not fast.
deny contains sprintf("minimum_tier.%s is missing or not a tier", [k]) if {
	some k in required_classes
	not tier_of(k) in required_tiers
}

# A missing key must read as "not a tier" (a bare lookup would be undefined and silently skip the rule).
tier_of(k) := object.get(object.get(input, "minimum_tier", {}), k, "")

deny contains sprintf("minimum_tier.%s must be premium (AGENTS.md section 7: HIGH and CRITICAL always premium)", [k]) if {
	some k in {"HIGH", "CRITICAL"}
	tier_of(k) != "premium"
}

deny contains "minimum_tier.MEDIUM must not be fast" if tier_of("MEDIUM") == "fast"

# Escalation rules.
deny contains "escalation.on_failed_check must be one_tier_up" if esc("on_failed_check") != "one_tier_up"

deny contains "escalation.high_and_critical must be always_premium" if esc("high_and_critical") != "always_premium"

deny contains "escalation.on_premium_failure must be stop_and_ask_maintainer" if esc("on_premium_failure") != "stop_and_ask_maintainer"

deny contains "escalation.floors.reading_comprehension_long_files must be balanced or premium" if {
	not object.get(object.get(object.get(input, "escalation", {}), "floors", {}), "reading_comprehension_long_files", "") in {"balanced", "premium"}
}

esc(k) := object.get(object.get(input, "escalation", {}), k, "")

# Sources: version and verification date recorded per CLI, and equal to the allowed-list file.
deny contains sprintf("sources.%s needs version, verified and note", [c]) if {
	some c in clis
	not source_complete(c)
}

source_complete(c) if {
	input.sources[c].version
	input.sources[c].verified
	input.sources[c].note
}

deny contains sprintf("sources.%s.version %v does not match policy/data/cli-capabilities.json (%v)", [c, v, caps[c].version]) if {
	some c in clis
	v := input.sources[c].version
	sprintf("%v", [v]) != caps[c].version
}

deny contains sprintf("sources.%s.verified %v does not match policy/data/cli-capabilities.json (%v)", [c, v, caps[c].verified]) if {
	some c in clis
	v := input.sources[c].verified
	sprintf("%v", [v]) != caps[c].verified
}
