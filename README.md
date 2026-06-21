# The Bitcoin Whitepaper, Explorable

The full text of Satoshi Nakamoto's *Bitcoin: A Peer-to-Peer Electronic Cash
System* (2008), reproduced **word for word**, with interactive diagrams layered on
top to make the mechanics easier to understand.

**Live site:** _(GitHub Pages URL appears here once Pages is enabled)_

## What's inside

- **The paper, verbatim** — Abstract through §12, single page, with a sticky
  table of contents.
- **Hover glossary** — dotted terms reveal a plain-language definition.
- **Interactive figures**, built from a small reusable kit:
  - §2 transaction-signature chain (step-through)
  - §3 timestamp / hash chain
  - §4 **live SHA-256 miner** — pick a difficulty and watch real proof-of-work
  - §5 the six network steps
  - §7 Merkle-tree pruning (root hash stays fixed)
  - §8 simplified payment verification
  - §9 combining & splitting value
  - §10 traditional vs. new privacy model
  - §11 **live attacker-success calculator** running Nakamoto's exact C algorithm,
    with a log-scale probability chart

## Tech

Static HTML/CSS/JS. The only dependency is [GSAP](https://gsap.com) for animation,
vendored locally in `assets/` — no build step, no external requests, works offline.

```
index.html              the paper
assets/                 shared kit: stylesheet, stepper, glossary, gsap
lessons/                companion explainer
reference/glossary.html standalone glossary
```

## License & attribution

The whitepaper **text** is © Satoshi Nakamoto, reproduced verbatim under the
[MIT License](https://bitcoin.org/en/terms) (as published on bitcoin.org).

The **interactive diagrams, code, and styling** in this repository are released
under the MIT License — see [LICENSE](LICENSE).

This is an independent educational project and is not affiliated with bitcoin.org.
