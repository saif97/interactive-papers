/* Interactive explainer: digital-signatures.
 * Registers into window.EXPLAINERS (see _base.js). Reuses the stepper kit and
 * the paper's dg-* SVG styling so it looks native.
 *
 * Layout: a left->right journey of one transfer. Alice (left) holds the message
 * and her PRIVATE key; she signs, attaching a signature. The signed message
 * travels across to Bob (right), who holds Alice's PUBLIC key and verifies it.
 * A signature proves WHO authorized the transfer (and what), never WHEN — and
 * that missing ordering is the double-spending gap.
 */
(function () {
  window.EXPLAINERS = window.EXPLAINERS || {};

  var SVG =
    '<figure class="explorable" aria-label="Interactive: a signed transfer travels from Alice to Bob">' +
      '<div class="stage">' +
        '<svg viewBox="0 0 800 360" role="img">' +
          '<defs>' +
            '<marker id="sig-send" markerWidth="11" markerHeight="11" refX="7" refY="5.5" orient="auto"><path d="M0,0 L11,5.5 L0,11 Z" fill="#6b6356"/></marker>' +
          '</defs>' +

          // ALICE zone (sender) — message + private key, always visible
          '<g id="sig-alice">' +
            '<rect x="24" y="40" width="300" height="280" rx="14" fill="#f6f2e8" stroke="#ddd5c4" stroke-width="1.5"/>' +
            '<text class="dg-title" x="174" y="70" text-anchor="middle">ALICE &#183; sender</text>' +
            '<rect class="dg-card" x="50" y="92" width="248" height="48" rx="6"/>' +
            '<text class="dg-title" x="174" y="121" text-anchor="middle">Pay coin &#8594; Bob</text>' +
            '<rect class="dg-priv" x="50" y="156" width="248" height="48" rx="6"/>' +
            '<text class="dg-label" x="174" y="185" text-anchor="middle">Private Key &#183; secret</text>' +
          '</g>' +

          // BOB zone (payee) — Alice's public key, always visible
          '<g id="sig-bob">' +
            '<rect x="476" y="40" width="300" height="280" rx="14" fill="#f6f2e8" stroke="#ddd5c4" stroke-width="1.5"/>' +
            '<text class="dg-title" x="626" y="70" text-anchor="middle">BOB &#183; payee</text>' +
            '<rect class="dg-key" x="502" y="92" width="248" height="48" rx="6"/>' +
            '<text class="dg-label" x="626" y="121" text-anchor="middle">Alice&#8217;s Public Key</text>' +
          '</g>' +

          // (1) Alice signs — signature attached inside her zone (s1)
          '<g id="sig-sign">' +
            '<text class="dg-arrow-label" x="174" y="238" text-anchor="middle" fill="#6b4fa0">&#9312; signs with private key</text>' +
            '<rect class="dg-sig" x="50" y="248" width="248" height="46" rx="6"/>' +
            '<text class="dg-label" x="174" y="276" text-anchor="middle">+ Signature</text>' +
          '</g>' +

          // The signed message travels across to Bob (s2)
          '<g id="sig-send">' +
            '<path class="dg-arrow" stroke-width="2.5" d="M326,180 L470,180" marker-end="url(#sig-send)"/>' +
            '<text class="dg-sub" x="398" y="168" text-anchor="middle">sends signed message</text>' +
          '</g>' +

          // (2) Bob verifies with the public key (s2)
          '<g id="sig-verify">' +
            '<text class="dg-arrow-label" x="626" y="214" text-anchor="middle" fill="#2e7d4f">&#9313; checks the signature</text>' +
            '<rect x="502" y="224" width="248" height="48" rx="6" fill="#e8f0ec" stroke="#2e7d4f" stroke-width="1.4"/>' +
            '<text class="dg-label" x="626" y="253" text-anchor="middle" fill="#2e7d4f">&#10003; genuinely from Alice</text>' +
          '</g>' +

          '<g id="sig-verdict">' +
            '<text class="dg-bad" x="400" y="346" text-anchor="middle">Proves authorization (who &amp; what) &#8212; never order (when).</text>' +
          '</g>' +
        '</svg>' +
      '</div>' +
      '<figcaption class="caption"></figcaption>' +
      '<div class="controls"><button data-prev>&#8592; Prev</button><button data-next>Next &#8594;</button><button class="replay" data-replay>&#8634; Replay</button><div class="dots"></div></div>' +
    '</figure>';

  window.EXPLAINERS["digital-signatures"] = {
    title: "Digital signature",
    blurb: "A private key signs, the matching public key verifies — proving authorization, not ordering.",

    mount: function (panel) {
      panel.innerHTML = SVG;
      this._ex = window.Explorable.stepper({
        root: panel.querySelector('.explorable'),
        steps: [
          { label: 'The cast', text: 'Alice (the sender) holds the message <i>“pay coin → Bob”</i> and her secret <b>private key</b>. Bob (the payee) holds <b>Alice’s public key</b> — it’s public, so anyone can have it. The pair is matched: what the private key signs, only the public key can check.' },
          { label: 'Alice signs', text: 'Alice signs the message with her <b>private key</b>, attaching a <b>signature</b>. Only the holder of that secret key could have produced it, so the signature can’t be forged.' },
          { label: 'Bob verifies', text: 'Alice sends the signed message to Bob. Bob checks the signature against <b>Alice’s public key</b> — it matches, proving the message is <b>genuinely from Alice</b>. The keys do opposite jobs: <span style="color:#6b4fa0">private signs</span>, <span style="color:#2e7d4f">public verifies</span>. But this proves only <i>who</i> and <i>what</i>, never <i>when</i> — and that missing order is exactly the <a href="#sec-2">double-spending</a> problem.' }
        ],
        build: function (gsap, svg) {
          var hidden = ['#sig-sign', '#sig-send', '#sig-verify', '#sig-verdict'];
          gsap.set(hidden, { opacity: 0 });
          var tl = gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.5 } });
          tl.addLabel('s0');
          tl.to('#sig-sign', { opacity: 1 });                                    tl.addLabel('s1');
          tl.to(['#sig-send', '#sig-verify', '#sig-verdict'], { opacity: 1 });   tl.addLabel('s2');
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
