/* Interactive explainer: double-spending.
 * Registers into window.EXPLAINERS (see _base.js). Reuses the stepper kit
 * (Explorable.stepper) and the paper's dg-* SVG styling so it looks native.
 *
 * Thesis (matches Lesson 1): signing the same coin twice produces two equally
 * valid signatures — so double-spending is an ORDERING problem, not a crypto one.
 */
(function () {
  window.EXPLAINERS = window.EXPLAINERS || {};

  var SVG =
    '<figure class="explorable" aria-label="Interactive: why double-spending is an ordering problem">' +
      '<div class="stage">' +
        '<svg viewBox="0 0 600 300" role="img">' +
          '<defs>' +
            '<marker id="ds-good" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#2e7d4f"/></marker>' +
            '<marker id="ds-bad" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#b3261e"/></marker>' +
          '</defs>' +

          // Alice (always visible)
          '<g id="ds-alice">' +
            '<rect class="dg-card" x="40" y="105" width="170" height="95" rx="10"/>' +
            '<text class="dg-title" x="125" y="132" text-anchor="middle">Alice</text>' +
            '<circle cx="80" cy="165" r="15" fill="#f6e6d4" stroke="#b5651d" stroke-width="1.4"/>' +
            '<text class="dg-label" x="80" y="170" text-anchor="middle" font-weight="600">1</text>' +
            '<text class="dg-sub" x="150" y="169" text-anchor="middle">holds one coin</text>' +
          '</g>' +

          // Pay Bob (s1)
          '<g id="ds-arrowBob">' +
            '<path class="dg-arrow" d="M215,140 C300,118 330,90 405,72" marker-end="url(#ds-good)"/>' +
            '<text class="dg-arrow-label" x="305" y="98" text-anchor="middle" fill="#2e7d4f">signs Coin #1 → Bob</text>' +
          '</g>' +
          '<g id="ds-bob">' +
            '<rect class="dg-card" x="410" y="38" width="150" height="68" rx="10"/>' +
            '<text class="dg-title" x="485" y="68" text-anchor="middle">Bob</text>' +
            '<text class="dg-sub" x="485" y="88" text-anchor="middle" fill="#2e7d4f">✓ signature valid</text>' +
          '</g>' +

          // Pay Carol with the SAME coin (s2)
          '<g id="ds-arrowCarol">' +
            '<path class="dg-arrow" stroke="#b3261e" d="M215,168 C300,190 330,222 405,232" marker-end="url(#ds-bad)"/>' +
            '<text class="dg-arrow-label" x="305" y="222" text-anchor="middle" fill="#b3261e">signs the SAME coin → Carol</text>' +
          '</g>' +
          '<g id="ds-carol">' +
            '<rect class="dg-ghost" x="410" y="196" width="150" height="68" rx="10"/>' +
            '<text class="dg-title" x="485" y="226" text-anchor="middle">Carol</text>' +
            '<text class="dg-sub" x="485" y="246" text-anchor="middle" fill="#b3261e">✓ signature valid</text>' +
          '</g>' +

          '<g id="ds-verdict">' +
            '<text class="dg-bad" x="300" y="293" text-anchor="middle">Both verify — cryptography can’t say which came first.</text>' +
          '</g>' +
        '</svg>' +
      '</div>' +
      '<figcaption class="caption"></figcaption>' +
      '<div class="controls"><button data-prev>← Prev</button><button data-next>Next →</button><button class="replay" data-replay>↺ Replay</button><div class="dots"></div></div>' +
    '</figure>';

  window.EXPLAINERS["double-spending"] = {
    title: "Double-spending",
    blurb: "Why signing the same coin twice is an ordering problem, not a cryptography one.",

    mount: function (panel) {
      panel.innerHTML = SVG;
      this._ex = window.Explorable.stepper({
        root: panel.querySelector('.explorable'),
        steps: [
          { label: 'One coin', text: 'Alice owns a single <b>electronic coin</b> — a chain of signatures she can transfer by signing it over to someone else. So far, nothing is wrong.' },
          { label: 'A real payment', text: 'Alice pays <b>Bob</b>: she signs Coin&nbsp;#1 over to his public key. Bob verifies the signature against Alice’s key — it checks out. A perfectly valid transfer.' },
          { label: 'Signed again', text: 'But nothing stops Alice from signing the <b>same coin</b> over to <b>Carol</b> too. Carol’s copy verifies exactly as well as Bob’s. <b>Both signatures are cryptographically valid</b>, so crypto alone cannot say which transfer is the <i>real</i> one. The only thing that could decide is <b>which came first</b> — that’s why double-spending is an <i>ordering</i> problem, and why the paper needs a way to agree on order: <a href="#sec-4">proof-of-work</a>.' }
        ],
        build: function (gsap, svg) {
          var hidden = ['#ds-bob', '#ds-arrowBob', '#ds-carol', '#ds-arrowCarol', '#ds-verdict'];
          gsap.set(hidden, { opacity: 0 });
          var tl = gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.5 } });
          tl.addLabel('s0');
          tl.to(['#ds-bob', '#ds-arrowBob'], { opacity: 1 });                       tl.addLabel('s1');
          tl.to(['#ds-carol', '#ds-arrowCarol', '#ds-verdict'], { opacity: 1 });    tl.addLabel('s2');
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
