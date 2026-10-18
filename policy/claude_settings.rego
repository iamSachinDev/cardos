# Policy for .claude/settings.json (AGENTS.md §5, §7).
# permissions.deny must keep Read(...) rules covering Burnrate data, env files and statement/database extensions.
package claude_settings

import rego.v1

# Each required pattern is a substring that at least one deny rule must contain.
required := {
	"burnrate": "Burnrate data directory (a Read rule mentioning 'burnrate', case-insensitive)",
	".env": "env files (.env)",
	".pdf": "statement PDFs (.pdf)",
	".csv": "statement CSVs (.csv)",
	".sqlite": "SQLite databases (.sqlite)",
	".db": "database files (.db)",
}

lowered_rules := [lower(r) | some r in input.permissions.deny]

# Only Read(...) rules count: Bash(...) deny rules are complementary but do not stop the Read tool.
covered(pattern) if {
	some r in lowered_rules
	startswith(r, "read(")
	contains(r, pattern)
}

deny contains msg if {
	not input.permissions.deny
	msg := "permissions.deny is missing; deny rules for Burnrate data, .env and statement files are required"
}

deny contains msg if {
	input.permissions.deny
	some pattern, what in required
	not covered(pattern)
	msg := sprintf("permissions.deny has no rule covering %s", [what])
}
