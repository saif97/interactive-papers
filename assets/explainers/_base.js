/* Explainer registry base. Declares the global table that per-concept modules
 * register into. Load this once, before any concept module.
 *
 * Each entry is keyed by the SAME concept id as window.GLOSSARY (e.g.
 * "double-spending"), so a keyword's hover tooltip and its click-to-expand
 * interactive explainer share one id. An entry's shape is deliberately open —
 * only `title` and `mount(panel)` are required:
 *
 *   window.EXPLAINERS["concept-id"] = {
 *     title: "Human-readable name",      // required — panel heading
 *     blurb: "One-line framing.",        // optional — sub-heading
 *     mount:   function (panel) { ... },  // required — build the widget into panel
 *     unmount: function (panel) { ... }   // optional — cleanup (kill timelines, etc.)
 *   };
 *
 * Modular by design: a page includes only the concept files it cites, and any
 * paper that tags a word with the matching data-term lights the explainer up
 * automatically — see explainer-panel.js for the wiring.
 */
window.EXPLAINERS = window.EXPLAINERS || {};
