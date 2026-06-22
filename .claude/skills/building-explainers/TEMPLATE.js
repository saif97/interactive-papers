/* Explainer module template. Copy to assets/explainers/<concept-key>.js and fill in.
 * Reached from step 5 of SKILL.md. Mirror the structure of an existing explainer
 * (assets/explainers/digital-signatures.js) — this is the same shape, annotated.
 *
 * ── The contract (window.EXPLAINERS[key]) ──
 *   title     (required) panel heading
 *   blurb     (optional) one-line framing under the heading
 *   mount(panel)   (required) build the widget into the panel element
 *   unmount(panel) (optional) cleanup — call the stepper's destroy()
 *
 * ── dg-* SVG palette (defined in assets/style.css; reuse, don't reinvent) ──
 *   .dg-card  white box (neutral)        .dg-key  accent-soft box, accent border (public key)
 *   .dg-priv  purple box (private key)   .dg-sig  orange box (signature)
 *   .dg-hash  green box (hash)           .dg-ghost red box (bad / attack)
 *   .dg-title 13px serif heading         .dg-label 12px mono label
 *   .dg-sub   10px muted caption         .dg-bad   red mono text
 *   .dg-arrow grey arrow  + modifiers .dg-arrow-sign (purple) / .dg-arrow-verify (green dashed)
 *   Distinct entity types: actors=.dg-card boxes, data=document shape (dog-eared path),
 *   keys=.dg-priv/.dg-key chips, results=green-bordered box. Make them LOOK different.
 *   Interactive chrome (panel, ⊕) is blue (--ix) and handled by the loader/CSS — not here.
 */
(function () {
  window.EXPLAINERS = window.EXPLAINERS || {};

  // viewBox aspect ≤ ~2:1 (favour taller); leave margin so nothing clips at the edges.
  var SVG =
    '<figure class="explorable" aria-label="Interactive: <one-line description>">' +
      '<div class="stage">' +
        '<svg viewBox="0 0 760 360" role="img">' +
          '<defs>' +
            // arrow markers — one per arrow color you use
            '<marker id="<KEY>-good" markerWidth="10" markerHeight="10" refX="7" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#2e7d4f"/></marker>' +
          '</defs>' +

          // Always-visible scaffolding (the cast / setup) goes here, e.g.:
          // '<g id="<KEY>-actorA">...</g>' +

          // One <g id> per beat that animates in; hidden at s0, revealed by the timeline.
          '<g id="<KEY>-beat1"> ... </g>' +
          '<g id="<KEY>-beat2"> ... </g>' +
        '</svg>' +
      '</div>' +
      '<figcaption class="caption"></figcaption>' +
      '<div class="controls"><button data-prev>&#8592; Prev</button><button data-next>Next &#8594;</button><button class="replay" data-replay>&#8634; Replay</button><div class="dots"></div></div>' +
    '</figure>';

  window.EXPLAINERS["<concept-key>"] = {
    title: "<Concept name>",
    blurb: "<one-line framing — the thesis, compressed>",

    mount: function (panel) {
      panel.innerHTML = SVG;
      this._ex = window.Explorable.stepper({
        root: panel.querySelector('.explorable'),
        // One step per beat. steps[i] corresponds to timeline label s<i>.
        // Caption = one sentence; the LAST caption lands the thesis and links onward.
        steps: [
          { label: '<beat 0 label>', text: '<setup — the cast, before anything happens>' },
          { label: '<beat 1 label>', text: '<one idea>' },
          { label: '<beat 2 label>', text: '<thesis lands. Link the next concept: <a href="#sec-N">term</a>.>' }
        ],
        // Build a paused timeline: addLabel('s0') at the initial state, then tween each
        // beat in and addLabel('s1'), 's2', … in order. gsap.set() hides beats at s0.
        build: function (gsap, svg) {
          gsap.set(['#<KEY>-beat1', '#<KEY>-beat2'], { opacity: 0 });
          var tl = gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.5 } });
          tl.addLabel('s0');
          tl.to('#<KEY>-beat1', { opacity: 1 }); tl.addLabel('s1');
          tl.to('#<KEY>-beat2', { opacity: 1 }); tl.addLabel('s2');
          return tl;
        }
      });
    },

    unmount: function () {
      if (this._ex && this._ex.destroy) this._ex.destroy();
      this._ex = null;
    }
  };
})();
