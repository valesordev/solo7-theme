# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Valesor Development
#
# Makefile-driven everything. No hidden steps: every target here is exactly what CI
# runs, and every artifact is reproducible from `tokens/` + `src/`.

PORT ?= 8791

.PHONY: all build check serve release format lint contrast budget clean help
.DEFAULT_GOAL := help

node_modules: package.json package-lock.json
	npm ci
	@touch node_modules

## build: regenerate tokens, bundle + minify dist/, generate the demo
build: node_modules
	node tools/build.mjs
	node tools/build-demo.mjs

## contrast: WCAG AA gate over every intended foreground/background pairing
contrast: node_modules
	node tools/check-contrast.mjs

## budget: fail if minified dist/solo7.css exceeds the CSS budget
budget: build
	node tools/check-budget.mjs

## lint: stylelint the hand-written CSS
lint: node_modules
	npm run lint:css

## format: prettier --check (writes nothing; use `npm run format:write` to fix)
format: node_modules
	npm run format

## check: the full gate — contrast + lint + format + budget. This is what CI runs.
check: contrast lint format budget
	@echo "check: all gates passed."

## serve: build, then serve the repo so demo/ can reach ../dist over http
serve: build
	@echo "Serving http://localhost:$(PORT)/demo/index.html  (Ctrl-C to stop)"
	@python3 -m http.server $(PORT)

## release: run the full gate and build the artifacts CI publishes on a version tag
release: check
	@echo
	@echo "release: gate passed, dist/ built (v$$(cat dist/VERSION))."
	@echo "Next: bump version in package.json, commit, then tag:"
	@echo "  git tag -s v$$(cat dist/VERSION) -m 'solo7-theme v$$(cat dist/VERSION)'"
	@echo "  git push origin v$$(cat dist/VERSION)"
	@echo "CI (.github/workflows/release.yml) publishes to GitHub Pages + Releases (ADR-001)."

## clean: remove generated + installed files
clean:
	rm -rf dist node_modules src/css/_tokens.generated.css demo/index.html

## help: list targets
help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/^## /  /'
