# Policy for .github/dependabot.yml: npm and github-actions must both be covered.
package dependabot

import rego.v1

required_ecosystems := {"npm", "github-actions"}

configured contains e if {
	some u in input.updates
	e := u["package-ecosystem"]
}

deny contains msg if {
	input.version != 2
	msg := "dependabot.yml must declare `version: 2`"
}

deny contains msg if {
	some e in required_ecosystems
	not e in configured
	msg := sprintf("dependabot.yml has no `updates` entry for package-ecosystem %q", [e])
}

deny contains msg if {
	some u in input.updates
	not u.schedule.interval
	msg := sprintf("dependabot.yml entry for %q has no schedule.interval", [u["package-ecosystem"]])
}
