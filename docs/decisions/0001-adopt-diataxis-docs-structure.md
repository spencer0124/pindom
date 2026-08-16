---
title: Adopt Diátaxis Docs Structure
type: adr
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-16
audience: internal
---

# 0001 — Adopt Diátaxis Docs Structure

> Filing documents by reader need, mirroring skkuverse-app, and why pindom stays outside that repo's contract system.

## Status

Accepted.

## Context

pindom needed documentation for three different readers at once: someone building a screen
(needs lookup), someone new to the product (needs understanding), and an agent following
build rules (needs a fixed address to point at).

Dumping these into flat files produces documents that serve nobody: a component index that
drifts into architectural prose, an architecture note that accretes a props table.

skkuverse-app already solved this with [Diátaxis](https://diataxis.fr/) — four categories
by reader need, plus ADRs, postmortems and plans. It is proven in a sibling repo by the same
author, which makes it cheap to adopt and familiar to navigate.

A competing convention was on the table: flat `docs/DESIGN_SYSTEM.md` and `docs/SCREENS.md`
at the docs root, on the grounds that ALL-CAPS names are more obvious to a coding agent.

## Decision

Adopt Diátaxis with kebab-case filenames, mirroring skkuverse-app's folder scheme and
writing rules.

Reject the ALL-CAPS variant. Discoverability for an agent is solved by `CLAUDE.md` naming
the exact paths, which works regardless of filename casing — so the casing may as well stay
consistent with the convention, where ALL-CAPS is reserved for the files GitHub itself
treats specially.

Adopt these rules from skkuverse verbatim: required frontmatter, one need per document,
**point at the source rather than copying a value**, and one H1 per file.

Diverge on two points:

1. **No umbrella contract system.** skkuverse's `docs/_template.md` and
   `.markdownlint.jsonc` are hash-locked artifacts vendored from an umbrella repository via
   `sync_contracts.py` and tracked in `.contracts.lock.json`. pindom is not part of that
   umbrella. Both files are adopted as **plain local copies** with the contract language
   stripped, and pindom gets no lock file.
2. **Language policy is looser.** skkuverse enforces English everywhere via the umbrella's
   `lint_conventions.py`. pindom does not run it, so the rule is prose in English with
   Korean kept verbatim wherever it is the product — frame names and UI copy are
   identifiers, and translating them makes them unfindable.

## Consequences

- New documents start by copying `docs/_template.md` and picking a folder by reader need.
- `yarn lint` now fails on a malformed document, the same gate as malformed code.
- `tutorials/`, `how-to/` and `internal/` start empty. That is intended: pindom has no build
  or deploy pipeline, so a runbook would document a process that does not exist.
- Copying a doc back to or from skkuverse needs a manual check, since neither repo's copies
  are contract-synced with the other.
- The "point at the source" rule means documents deliberately omit version numbers and
  counts. Anyone wanting an exact number reads the code, which is the point.
