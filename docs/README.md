---
title: Docs Index & Conventions
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-16
audience: internal
---

# Docs Index & Conventions

> The index of pindom's documentation, and the single source of truth for how to write it. Read this before starting a new document.

## Folder structure (Diátaxis)

Documents are filed under the four [Diátaxis](https://diataxis.fr/) categories plus three
internal ones. **The category follows the reader's need, not the subject matter.**

| Folder | Need | Contents |
| --- | --- | --- |
| `tutorials/` | Learning | A guided lesson for someone with no context |
| `how-to/` | Doing | A runbook for one goal |
| `reference/` | Looking up | Authoritative facts: component index, tokens, screen inventory |
| `explanation/` | Understanding | Why something is shaped this way |
| `decisions/` | — | ADRs (Architecture Decision Records), `NNNN-kebab-title.md` |
| `internal/` | — | Postmortems and debugging records, `YYYY-MM-topic.md` |
| `plans/` | — | Work plans, open or done. Mutable and draft by nature |

A document serves one need. When a procedure and its background start sharing a page, split
them and link the halves.

`tutorials/`, `how-to/` and `internal/` are empty for now. pindom has no build or deploy
pipeline yet, so a runbook would document a process that does not exist.

## Index

### reference

| Document | Summary |
| --- | --- |
| [design-system.md](reference/design-system.md) | Every component the design system exports, its props, and when to use which. **Check this before creating any primitive.** |
| [design-tokens.md](reference/design-tokens.md) | The token contract: brand ramp, typography, spacing, radius, shadow, and the rules for reading them |
| [screens.md](reference/screens.md) | Every Figma frame mapped to node id, theme, route and status, plus the flow slices to build in |
| [figma-workflow.md](reference/figma-workflow.md) | How to drive the Figma MCP against this particular file, and the traps it sets |

### explanation

| Document | Summary |
| --- | --- |
| [architecture.md](explanation/architecture.md) | What PINDOM is, how the repo is laid out, the provider stack, the navigation graph, and where the trust boundary sits |
| [design-language.md](explanation/design-language.md) | Why some screens are dark and most are light, and what that means for how theming is built |

### decisions (ADR)

Each ADR's own frontmatter carries its status. It is not repeated here, because a value
copied to a second place is a value that will disagree with the first.

| Document | Summary |
| --- | --- |
| [0001-adopt-diataxis-docs-structure.md](decisions/0001-adopt-diataxis-docs-structure.md) | Filing documents by reader need, and why pindom is not under skkuverse's contract system |
| [0002-vendor-sds-instead-of-dependency.md](decisions/0002-vendor-sds-instead-of-dependency.md) | Copying the design system in rather than depending on it |
| [0003-single-seed-theming.md](decisions/0003-single-seed-theming.md) | Threading every accent component through one theme seed |
| [0004-per-screen-theme-not-global-dark-mode.md](decisions/0004-per-screen-theme-not-global-dark-mode.md) | Theme as a property of the route, not of the user's system preference |

### plans

| Document | Summary |
| --- | --- |
| [screen-implementation.md](plans/screen-implementation.md) | The order to build the designed screens in: shell, then one golden screen, then flow slices |

## Writing rules

### 1. Frontmatter (required)

Every document opens with YAML frontmatter:

```yaml
---
title: <Title Case>
type: how-to | reference | explanation | tutorial | adr | plan | postmortem
status: draft | accepted | superseded | deprecated
owner: zoyoong124@gmail.com
last-updated: YYYY-MM-DD
audience: internal | public
---
```

When `status` is `superseded` or `deprecated`, open the body with a link to the current
SSOT. Update `last-updated` whenever you change what the document says.

### 2. Skeleton

Immediately after the frontmatter:

1. `# H1`, exactly one per document
2. `> one-line summary` saying what the document is and who should read it

Then `##` sections, with no skipped levels. Start a new document by copying
[`_template.md`](_template.md).

### 3. Point at the source, do not copy the value

**Never hardcode a version, measurement, or count into a document.** When the code changes,
a copied value starts lying silently.

- Wrong: `the design system has 35 components`
- Right: `the components exported from src/design-system/components/index.ts`
- Wrong: `Expo SDK 54`
- Right: `the Expo version pinned in package.json`

Sampled design values are the one exception, and they must say so: a colour lifted from a
Figma frame is evidence, not a duplicated constant, so record it **with the node it came
from**.

### 4. File names

- **kebab-case, lowercase, `.md`**, as in `design-system.md`
- ADRs: `NNNN-kebab-title.md`, zero-padded, preferably starting with a verb
- Postmortems: `YYYY-MM-topic.md`
- ALL-CAPS names are reserved for the files GitHub treats specially: `README`,
  `CONTRIBUTING`, `LICENSE`. This is why the component index is
  `reference/design-system.md` and not `DESIGN_SYSTEM.md`.

### 5. Formatting

- Every code fence declares a language: `bash`, `ts`, `tsx`, `json`, `yaml`. Use `ts`, not
  `typescript`.
- Tables use spaced pipes — `| --- | --- |`, not `|---|---|`. `MD060` enforces this.
- Structured facts, such as props, paths and node ids, go in tables.
- Warnings use GitHub admonitions: `> [!NOTE]` and `> [!WARNING]`.
- Lint with `yarn lint:md`. `yarn lint` runs it alongside ESLint, so a malformed document
  fails the same gate as malformed code.

### 6. Language

**Write prose in English.** Korean stays Korean wherever it *is* the product: Figma frame
names, UI copy, and design labels are identifiers and content, not prose to be translated.

- Right: `` The 시작화면 frame (`33:2801`) is the entry point. ``
- Wrong: `The "start screen" frame is the entry point.` — now nobody can find it in Figma.

> [!NOTE]
> skkuverse-app enforces English through an umbrella linter (`lint_conventions.py`) that
> pindom does not run. This rule is ours, and it is deliberately looser about Korean.

### 7. Lifecycle

- When a plan in `plans/` ships, move what settled into `reference/` or `explanation/`, and
  mark the plan `status: superseded`. Do not delete it; the history has value.
- After a structural decision, write one ADR in `decisions/` covering Context, Decision and
  Consequences.
- When you find a document that disagrees with the code, fix it where you stand, or at
  minimum leave a `> [!WARNING]` saying it is stale.

## Related

- [../README.md](../README.md) — repo setup and commands
- [../CLAUDE.md](../CLAUDE.md) — the build rules these documents back
