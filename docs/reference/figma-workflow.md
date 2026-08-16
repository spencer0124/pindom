---
title: Figma MCP Workflow
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-16
audience: internal
---

# Figma MCP Workflow

> How to pull a screen out of this particular Figma file, the four traps it sets, and the prompt shape that survives them.

## Summary

The Figma MCP server is remote (`mcp.figma.com`), so no desktop app is needed. Access is
per-account OAuth; if the tools vanish or 401, re-authenticate.

**This file is a layout and copy reference, not a source of structure.** The design system
in `src/design-system/` is the structural SSOT. Every trap below follows from that one
fact.

## The traps

### 1. There are no Variables, components, or auto layout

Verified: `get_variable_defs` returns `{}`, there are zero component instances, and layers
are named `Rectangle 13`, `Rectangle 14`. The frames are raw shapes with absolute
coordinates.

Consequence: `get_design_context` returns **absolutely-positioned markup with meaningless
class names**. Never paste it. Read it for layout intent, spacing relationships and copy,
then rebuild with flexbox using design-system components.

### 2. `Ready for dev` is on the wrong section

The tag sits on Section 1, the abandoned wireframes. Anything that selects frames by that
tag pulls six rough frames, three of them empty. Select by node id from
[screens.md](screens.md) instead.

### 3. `node-id=0-1` is the page, not a screen

The default URL from Figma's share button often carries `node-id=0-1`, which is the page
root. `get_metadata` on it returns the entire canvas and **exceeds the response token
limit**. Always target a frame node.

To get a frame's id: select it in Figma → right-click → **Copy link to selection**.

### 4. Context budget is not the constraint

A single frame costs roughly a few hundred tokens to describe. There is no reason to batch
screens to save context — and every reason not to, because the real constraint is
**consistency across the whole screen set**. Build one flow slice at a time, per
[screens.md](screens.md).

## Per-screen prompt

```text
Implement 장소/상세 from Figma:
https://www.figma.com/design/OZ8H9E7WDdruFIhQ7UBgcy/PINDOM?node-id=33-2381&m=dev

Rules:
- Figma output is layout intent and copy only. This file has no auto layout, so
  ignore absolute positioning entirely and rebuild with flexbox.
- Use components from docs/reference/design-system.md. No new primitives without asking.
- No hardcoded colors, spacing or fonts. Tokens only, per docs/reference/design-tokens.md.
- Read accent colour from useTheme().token.accent, never SdsColors.brand* directly.
- Match the structure and conventions of the golden screen, app/(tabs)/index.tsx.
- Korean UI copy is final. Do not translate or paraphrase it.
- Bind to the typed fixtures in mocks/. Do not invent data shapes.
- When done: list every deviation from the Figma frame and why.
```

The last line is the one people drop, and it is the most valuable. It surfaces the places
where the design is ambiguous or physically impossible in React Native, instead of leaving
a silent guess in the code.

## Visual diff loop

After a screen lands, compare rather than eyeball:

1. `get_screenshot` the frame at a useful `maxDimension`.
2. Screenshot the running build at the same screen.
3. Hand over both and ask for a difference list, not an opinion.

This catches spacing and weight drift that reads as "close enough" by eye.

## Checking a frame's theme

Screens are individually light or dark ([design-language.md](../explanation/design-language.md)).
To classify a new frame, render it and take the mean luminance — but confirm by eye when a
photograph fills the frame, because a bright photo pulls the average up even though the
chrome is dark. 카메라 and 편집 are both such cases.

## Code Connect

Once the design-system components are stable, mapping them to Figma nodes would let the
MCP answer "this is your `<Button type="primary">`" rather than re-describing a rectangle.
That is the largest available quality gain for the back half of the screens — but it needs
stable components first, so it is deliberately deferred.

## Related

- [screens.md](screens.md) — node ids, routes, themes and flow slices
- [design-system.md](design-system.md) — what to build with
- [../plans/screen-implementation.md](../plans/screen-implementation.md) — the order
