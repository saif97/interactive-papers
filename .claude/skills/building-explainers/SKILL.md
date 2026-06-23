---
name: building-explainers
description: Build an interactive explainer component for the explorable-papers project. Use when the user wants to add or create an educational component, concept widget, interactive diagram, or click-to-expand explainer, or mentions assets/explainers.
---

Build one **explainer**: a click-to-expand component that teaches a single concept on top of a verbatim paper. Build it as **interactive HTML panels stepped with next/prev** — let the reader do things (type, tamper, generate, sign), not just watch. Follow these steps in order; the process is fixed so any agent produces the same quality.

An explainer lives at `assets/explainers/<concept-key>.js`, registers into `window.EXPLAINERS`, and uses the same id as `window.GLOSSARY`. The loader (`assets/explainer-panel.js`) then shows the ⊕ marker on every keyword tagged `data-term="<concept-key>"` automatically. Read the reference explainer (`assets/explainers/digital-signatures.js`) before you write a new one, and copy its structure.

## Core principles

- **Layout is HTML/CSS, never hand-placed SVG coordinates.** Use `<div>`s, fl/grid, and the `.exw-*` classes in `style.css`. The browser positions things, so nothing clips, overlaps, or crams — that is the failure mode hand-coded SVG kept producing. Use SVG only for a single static summary picture at the end, if one helps at all.
- **Make it real when the concept can be run.** If the concept is something a browser can actually compute, run it for real (e.g. `window.crypto.subtle` for keys/hashes/signatures). Real beats faked: the reader tampers with a message and watches verification fail. Concepts with nothing to compute (ordering, incentives) get a small interactive widget or a diagram instead — but always prefer direct manipulation over animation.
- **One idea per step, stepped with next/prev.** Each step is one panel the reader advances through.

## Steps

1. **Pin the thesis.** In one sentence, write the single idea you want the reader to walk away understanding. Not a summary — the one point. Example: "a signature proves who authorized something, but not when." _Done when:_ you have that one sentence, and every later step supports it.

2. **Pick the concept key.** Choose the kebab-case id. It must exist in `window.GLOSSARY` (`assets/glossary-data.js`) — add the hover definition there if missing. The visible word on the page does not have to match this key: any phrasing tagged `data-term="<key>"` opens this explainer. _Done when:_ the key exists in GLOSSARY.

3. **Decide what the reader does at each step.** Split the thesis into ordered steps, each showing one idea. Use as many steps as the subject needs — let its complexity decide; don't pad a simple idea or cram a complex one. For each step, name the concrete thing the reader does (type and tamper, generate a key, sign, verify, drag, toggle). If a step has nothing to do, make it a short card, not a wall of text. The last step states the thesis and links the next related concept with `<a href="#sec-N">`. _Done when:_ every step has a one-line title and a named interaction (or a clear reason it is static), and the last step states the thesis and links onward.

4. **Build the panels.** Copy [TEMPLATE.js](TEMPLATE.js) to `assets/explainers/<key>.js`. Fill in the `{title, blurb, mount, unmount}` contract. In `mount`, render the steps as `.exw-step` panels, wire the next/prev nav, and wire each step's interactions. Run real computation where the concept allows. _Done when:_ `node --check assets/explainers/<key>.js` passes.

5. **Wire and verify live.** Add `<script src="assets/explainers/<key>.js"></script>` to the page (before `explainer-panel.js`). Open the page in a browser, click a keyword with that `data-term`, and **step through every panel, running each interaction** — the rendered result, not the source. If you cannot open a browser, ask the user for a screenshot; never declare it done from source alone. _Done when:_ the panel opens and closes, next/prev works, every interaction does what its step claims, and the clarity checklist passes live.

## Clarity checklist

The reader's experience is the product. These are mistakes that have actually reached users. Every item must pass live, on screen.

- **Layout never clips, overlaps, or crams.** Because layout is HTML/CSS, this should be automatic — if it isn't, you are hand-placing things you shouldn't.
- **Every interaction works and matches its caption.** A button that says "verify" must run a real verify and show a real result.
- **One idea per step**, and the step's title says which idea.
- **Distinct things look distinct.** A secret (private key) and a shared value (public key) read differently at a glance — reuse `.exw-key.priv` / `.exw-key.pub` and the semantic colors.
- **Color means the same thing everywhere.** Interactive UI is blue (`--ix`); green = good/verify, purple = sign, red = bad/danger. Never give one color two meanings.
- **The last step states the thesis** and links the related concept.

## Notes

- One file per concept, à la carte — a page loads only the explainers it cites. A keyword whose module isn't loaded stays a plain hover term.
- The contract requires only `title` + `mount`. `unmount` should clear the panel (`panel.innerHTML = ''`) and stop anything still running.
- No build step, no new dependencies. Vanilla JS, the browser's APIs, and `style.css`. Add new widget styles as `.exw-*` classes there.
