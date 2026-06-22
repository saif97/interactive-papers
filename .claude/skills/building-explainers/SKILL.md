---
name: building-explainers
description: Build an interactive explainer component for the explorable-papers project. Use when the user wants to add or create an educational component, concept widget, interactive diagram, or click-to-expand explainer, or mentions assets/explainers.
---

Build one **explainer**: a modular, click-to-expand interactive component that teaches a single concept on top of a verbatim paper. Follow these steps in order — the process is fixed so any agent produces the same quality.

An explainer lives at `assets/explainers/<concept-key>.js`, registers into `window.EXPLAINERS`, and is keyed by the same id as `window.GLOSSARY`. The loader (`assets/explainer-panel.js`) then lights up every keyword tagged `data-term="<concept-key>"` automatically. Study an existing explainer (`assets/explainers/digital-signatures.js`) before writing a new one — match its shape.

## Steps

1. **Pin the thesis.** Write the one sentence the explainer exists to land — the single insight, not a summary (e.g. "a signature proves authorization, not ordering"). _Done when:_ you have one sentence, and every later step traces back to it.

2. **Pick the concept key.** Choose the kebab-case id. It must exist in `window.GLOSSARY` (`assets/glossary-data.js`) — add the hover definition there if missing. The visible word on the page is decoupled from this key: any phrasing tagged `data-term="<key>"` opens this explainer. _Done when:_ the key resolves in GLOSSARY.

3. **Storyboard the beats.** Break the thesis into **2–4 ordered beats**, each one a single idea. Beat 0 is the setup (the cast, before anything happens); the final beat lands the thesis and links the next related concept via `<a href="#sec-N">`. Each beat gets a `label` and a one-sentence caption. _Done when:_ every beat has a label + caption, count ≤ 4, and the last beat states the thesis and links onward.

4. **Lay out the diagram.** Reuse the `dg-*` SVG classes (see [TEMPLATE.js](TEMPLATE.js)). Then run the **clarity checklist** below against your layout. _Done when:_ every checklist item passes.

5. **Author the module.** Copy [TEMPLATE.js](TEMPLATE.js) to `assets/explainers/<key>.js` and fill in the `{title, blurb, mount, unmount}` contract and the stepper. Build a paused GSAP timeline adding label `s0` (initial state) through `sN`, one per beat, in order. _Done when:_ `node --check assets/explainers/<key>.js` passes.

6. **Wire and verify live.** Add `<script src="assets/explainers/<key>.js"></script>` to the page (before `explainer-panel.js`). Open the page in a browser, click a keyword with that `data-term`, and **re-run the clarity checklist against the rendered result** — the diagram on screen, not the source. _Done when:_ the panel opens and closes, nothing is clipped, and every checklist item passes live.

## Clarity checklist

The diagram is the product; these are the failures that have actually shipped. Every item must pass — in the source AND on screen.

- **Distinct entity types look distinct.** People/actors, data (documents), keys, and results each get their own shape or tint — never all generic cards. A reader must tell a person from a piece of data at a glance.
- **One action per arrow.** Each arrow shows one thing happening. Two arrows must never converge on one node such that two different actions (e.g. signing vs verifying) look identical.
- **One reading direction.** The eye flows left→right or top→down. No backtracking to follow the story.
- **Aspect ratio ≤ ~2:1.** The viewBox must not be so wide it renders short and cramped — favour taller. Leave margin inside the viewBox so nothing clips at the edges.
- **Color carries consistent meaning.** Interactive chrome is blue (`--ix`); reuse the semantic `dg-*` colors (green = good/verify, purple = sign, red = bad). Don't overload a color with two meanings.
- **Captions are one beat each**, tied to the thesis; the final caption links the related concept.

## Notes

- One file per concept, à la carte — a page loads only the explainers it cites. A keyword whose module isn't loaded silently stays a plain hover term.
- Keep the diagram inside the stepper kit (`Explorable.stepper`) unless static HTML genuinely fits better; the contract requires only `title` + `mount`.
