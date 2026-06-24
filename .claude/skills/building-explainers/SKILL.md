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

5. **Verify it works (functional QA).** Register the component in the harness first: add it to the two-line list in `dev/explainer-preview.html` (one `<script>` tag, one entry in the `MODULES` array). The harness mounts your one explainer in isolation with the real panel chrome — no navigating the paper to reach it. Then run `/ui-qa` against `dev/explainer-preview.html?key=<key>` with a **functional checklist**: one item per panel covering each interaction's success *and* failure path (a verify that should pass, a tamper that should fail, a slider past its threshold). _Done when:_ ui-qa returns PASS on every panel; fix and re-run on anything that fails.

6. **Verify it teaches (clarity QA).** You wrote it, so you can't read it cold. Run `/ui-qa` against the same harness URL with a **clarity checklist**: tell it to act as a first-time learner, step every panel, trigger each interaction, and report any term used before it's explained or any label that doesn't match what's shown. Treat the confusions it returns as a punch list: fix the real ones, then re-run step 5 on what you changed. _Done when:_ clarity QA returns PASS, or you have fixed the confusions it found.

7. **Wire into the paper.** Add `<script src="assets/explainers/<key>.js"></script>` to `index.html` (before `explainer-panel.js`), then tag the keyword in the prose with `data-term="<key>"` (see **Wiring keywords** below for where). Open the real page once to check the chip appears and the panel opens below the paragraph. _Done when:_ clicking the keyword on the real page opens the verified panel.

## Wiring keywords

A keyword is "properly linked" when its `data-term` resolves to a glossary key (so the tooltip works) and, for keys with a module, opens the right panel. Check this by reading the source on the spot — don't build a linter, just look:

- **Tag the right occurrence, not every one.** The same word can carry different meanings in different sentences ("hash" the verb vs. a block's hash; "chain" of signatures vs. the longest chain). Tag the spot where the concept is *introduced or best explained* — usually the first substantive mention or the abstract — and leave the rest plain. A keyword tagged in five places clutters the page and the reader stops noticing the chips.
- **Match meaning, not just spelling.** Before tagging, read the sentence: only tag it if the word there means the concept the explainer teaches. A passing mention in a different sense should stay plain.
- **Every `data-term` needs a glossary entry.** If `assets/glossary-data.js` has no key, the tooltip silently breaks — add the definition (skill step 2) or fix the typo.
- **Every explainer module needs at least one tag that opens it.** A module no `data-term` references is dead — the reader can never reach it. After wiring, confirm `grep data-term=\"<key>\" index.html` finds your tag.
- **Hover-only is a valid choice.** A keyword can have a glossary definition and no explainer — it stays a dotted hover term. Only add a module when the concept is worth a full interactive panel.

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
- `dev/explainer-preview.html` is the isolated test harness — it loads `style.css` + the explainer modules and mounts any one by `?key=`. It is a dev tool, not part of the published site. Web Crypto needs a secure context, so serve over `http://localhost` (it counts as secure); `file://` will not work.
- After editing a module, hard-reload the harness (reload with cache ignored) before re-verifying — the browser caches the `.js` and a plain reload can show stale code.
