# Bundled fonts

## Wanted Sans

- Files: `WantedSans-Regular.otf`, `WantedSans-Medium.otf`, `WantedSans-Bold.otf`
- Foundry: Wanted Lab
- License: SIL Open Font License 1.1
- Source and full license text: <https://github.com/wanteddev/wanted-sans>

Copied from the sibling `skkuverse-app` repository, which bundles the same release.

> [!NOTE]
> The full OFL text is **not** vendored here. Retrieve it from the upstream repository
> above if it is needed for a store submission or an attribution screen. The `OFL.txt`
> sitting in skkuverse-app's font directory covers IBM Plex, a different family, and does
> not apply to these files.

## Family naming

The embedded family names are not what a reader would guess from the filenames, which is
why `src/design-system/foundation/typography.ts` maps weight to family rather than using
one constant:

| File | Family name | Subfamily | PostScript name |
| --- | --- | --- | --- |
| `WantedSans-Regular.otf` | `Wanted Sans` | Regular | `WantedSans-Regular` |
| `WantedSans-Medium.otf` | `Wanted Sans Medium` | Regular | `WantedSans-Medium` |
| `WantedSans-Bold.otf` | `Wanted Sans` | Bold | `WantedSans-Bold` |

Medium ships as its **own family**, not as a weight inside `Wanted Sans`. See
[docs/reference/design-tokens.md](../../docs/reference/design-tokens.md).
