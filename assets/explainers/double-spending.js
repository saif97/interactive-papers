/* Interactive explainer: double-spending.
 * Registers into window.EXPLAINERS (see _base.js). Built as interactive HTML
 * panels stepped with next/prev (see building-explainers skill). Steps 1-2 run
 * real Web Crypto: Alice signs the SAME coin to two payees and BOTH signatures
 * verify — proving cryptography cannot pick a winner. Steps 3-4 are interactive
 * widgets (Sybil voting, a work-share slider).
 *
 * Thesis: double-spending isn't a cryptography problem — both signed transfers
 * are valid; the real problem is agreeing which one came first (ordering),
 * which Bitcoin solves with proof-of-work / the longest chain.
 */
(function () {
  window.EXPLAINERS = window.EXPLAINERS || {};

  var enc = new TextEncoder();
  function bufToHex(buf) { return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join(''); }
  function hexBlocks(hex) {
    return hex.split('').map(function (c) {
      var hue = Math.round(parseInt(c, 16) / 15 * 280);
      return '<span style="color:hsl(' + hue + ' 60% 42%)">' + c + '</span>';
    }).join('');
  }
  function genKeyPair() { return crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']); }
  function sign(kp, msg) { return crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, kp.privateKey, enc.encode(msg)); }
  function verify(kp, sigHex, msg) {
    var bytes = Uint8Array.from(sigHex.match(/.{2}/g).map(function (h) { return parseInt(h, 16); }));
    return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, kp.publicKey, bytes, enc.encode(msg));
  }

  var TO_BOB = 'Coin #1 → Bob';
  var TO_CAROL = 'Coin #1 → Carol';

  window.EXPLAINERS["double-spending"] = {
    title: "Double-spending",
    blurb: "The same coin signed to two people is valid to both — the real problem is agreeing which came first.",

    mount: function (panel) {
      var state = { kp: null, bobSig: null, carolSig: null };
      function keys() { return state.kp ? Promise.resolve(state.kp) : genKeyPair().then(function (kp) { state.kp = kp; return kp; }); }

      panel.innerHTML =
        '<div class="exw">' +
          '<div class="exw-nav">' +
            '<button data-prev disabled>← Prev</button>' +
            '<button data-next>Next →</button>' +
            '<span class="exw-stepname"></span>' +
            '<span class="exw-dots"></span>' +
          '</div>' +

          // Step 1 — a coin is a chain of signatures
          '<div class="exw-step" data-step>' +
            '<h3>1 · A coin is a chain of signatures</h3>' +
            '<p>An electronic coin is a chain of signatures: to pay someone, the owner signs the coin over to them. Alice owns Coin #1 — have her pay Bob (a real ECDSA signature).</p>' +
            '<div class="exw-card">' +
              '<button class="exw-btn sign" data-paybob>✎ Alice signs Coin #1 → Bob</button>' +
              '<div data-bobwrap style="display:none;margin-top:0.7rem">' +
                '<span class="exw-label">Alice\'s signature over “' + TO_BOB + '”</span><div class="exw-hex" data-bobsig></div>' +
                '<div class="exw-result ok"><div><b>✓ Valid</b><span class="small">Bob verifies it with Alice\'s public key — a genuine transfer.</span></div></div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // Step 2 — the double-spend (both real, both valid)
          '<div class="exw-step" data-step>' +
            '<h3>2 · The same coin, signed again</h3>' +
            '<p>Nothing stops Alice from signing the <b>very same coin</b> over to Carol as well. Sign it, then verify both signatures.</p>' +
            '<div class="exw-card">' +
              '<button class="exw-btn danger" data-paycarol>✎ Alice signs the SAME coin → Carol</button>' +
              '<div data-carolwrap style="display:none;margin-top:0.7rem">' +
                '<span class="exw-label">Second signature over “' + TO_CAROL + '”</span><div class="exw-hex" data-carolsig></div>' +
                '<button class="exw-btn verify" data-verifyboth>✓ Verify both signatures</button>' +
                '<div data-bothresult></div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // Step 3 — Sybil: vote-by-headcount fails
          '<div class="exw-step" data-step>' +
            '<h3>3 · Why “ask the network” fails</h3>' +
            '<p>Naive fix: announce both transfers and let the majority vote on which they saw first. But in an open network, identities are free to create — so counting heads is meaningless. Add attacker identities and watch the vote flip.</p>' +
            '<div class="exw-card">' +
              '<div class="exw-row"><span>Honest nodes — saw <b>Bob first</b></span><span class="exw-tag" style="color:var(--good)" data-honest></span></div>' +
              '<div class="exw-row" style="margin-top:0.4rem"><span>Attacker identities — vote <b>Carol first</b></span><span class="exw-tag" data-fake></span></div>' +
              '<button class="exw-btn danger" data-addfake>+ Spin up 10 fake identities (free)</button> ' +
              '<button class="exw-btn ghost" data-resetfake>Reset</button>' +
              '<div data-tally></div>' +
            '</div>' +
          '</div>' +

          // Step 4 — the fix: order by work
          '<div class="exw-step" data-step>' +
            '<h3>4 · Order by work, not by identities</h3>' +
            '<p>The fix: make each vote cost real computational work, so votes can\'t be conjured for free. The accepted order is the chain with the most cumulative work — the longest chain. Drag the attacker\'s share of the network\'s work:</p>' +
            '<div class="exw-card">' +
              '<div class="exw-row"><span class="exw-label" style="margin:0">Attacker\'s share of total work</span><span class="exw-tag" data-shareval>30%</span></div>' +
              '<input class="exw-input" type="range" min="0" max="100" value="30" data-share style="margin-top:0.5rem;padding:0">' +
              '<div data-attack></div>' +
            '</div>' +
            '<p class="exw-note">Double-spending was never a cryptography problem — it is the problem of agreeing which transfer came first. Bitcoin solves it by ordering history with <a href="#sec-4">proof-of-work</a>: the longest chain, backed by the most work, is the accepted order.</p>' +
          '</div>' +
        '</div>';

      // ── navigation ──
      var steps = Array.prototype.slice.call(panel.querySelectorAll('[data-step]'));
      var names = ['The coin', 'Double-spend', 'Sybil', 'The fix'];
      var prevBtn = panel.querySelector('[data-prev]');
      var nextBtn = panel.querySelector('[data-next]');
      var nameEl = panel.querySelector('.exw-stepname');
      var dotsWrap = panel.querySelector('.exw-dots');
      steps.forEach(function (_, i) { var d = document.createElement('i'); d.addEventListener('click', function () { show(i); }); dotsWrap.appendChild(d); });
      var dots = Array.prototype.slice.call(dotsWrap.children);
      var cur = 0;
      function show(i) {
        cur = Math.max(0, Math.min(steps.length - 1, i));
        steps.forEach(function (s, j) { s.classList.toggle('on', j === cur); });
        dots.forEach(function (d, j) { d.classList.toggle('on', j === cur); });
        nameEl.textContent = 'Step ' + (cur + 1) + ' / ' + steps.length + ' · ' + names[cur];
        prevBtn.disabled = cur === 0;
        nextBtn.disabled = cur === steps.length - 1;
      }
      prevBtn.addEventListener('click', function () { show(cur - 1); });
      nextBtn.addEventListener('click', function () { show(cur + 1); });
      show(0);

      // ── step 1: sign to Bob ──
      var bobWrap = panel.querySelector('[data-bobwrap]');
      var bobSigEl = panel.querySelector('[data-bobsig]');
      function payBob() {
        return keys().then(function (kp) { return sign(kp, TO_BOB); }).then(function (sig) {
          state.bobSig = bufToHex(sig);
          bobSigEl.innerHTML = hexBlocks(state.bobSig);
          bobWrap.style.display = '';
        });
      }
      panel.querySelector('[data-paybob]').addEventListener('click', payBob);

      // ── step 2: sign the same coin to Carol, verify both ──
      var carolWrap = panel.querySelector('[data-carolwrap]');
      var carolSigEl = panel.querySelector('[data-carolsig]');
      var bothResult = panel.querySelector('[data-bothresult]');
      panel.querySelector('[data-paycarol]').addEventListener('click', function () {
        (state.bobSig ? Promise.resolve() : payBob()).then(keys).then(function (kp) { return sign(kp, TO_CAROL); }).then(function (sig) {
          state.carolSig = bufToHex(sig);
          carolSigEl.innerHTML = hexBlocks(state.carolSig);
          carolWrap.style.display = '';
          bothResult.innerHTML = '';
        });
      });
      panel.querySelector('[data-verifyboth]').addEventListener('click', function () {
        Promise.all([verify(state.kp, state.bobSig, TO_BOB), verify(state.kp, state.carolSig, TO_CAROL)]).then(function (r) {
          bothResult.innerHTML =
            '<div class="exw-result ' + (r[0] ? 'ok' : 'bad') + '"><div><b>' + (r[0] ? '✓' : '✗') + ' Coin #1 → Bob</b><span class="small">verifies against Alice\'s public key</span></div></div>' +
            '<div class="exw-result ' + (r[1] ? 'ok' : 'bad') + '"><div><b>' + (r[1] ? '✓' : '✗') + ' Coin #1 → Carol</b><span class="small">verifies against Alice\'s public key</span></div></div>' +
            '<p class="exw-note" style="margin-top:0.7rem"><b>Both are cryptographically valid.</b> The signatures prove Alice authorized each transfer — but say nothing about <b>which she made first</b>. The conflict is about <i>order</i>, not signatures.</p>';
        });
      });

      // ── step 3: Sybil voting ──
      var HONEST = 5;
      var fake = 0;
      var honestEl = panel.querySelector('[data-honest]');
      var fakeEl = panel.querySelector('[data-fake]');
      var tallyEl = panel.querySelector('[data-tally]');
      function renderTally() {
        honestEl.textContent = HONEST + ' votes';
        fakeEl.textContent = fake + ' votes';
        var attackerWins = fake > HONEST;
        tallyEl.innerHTML = '<div class="exw-result ' + (attackerWins ? 'bad' : 'ok') + '" style="margin-top:0.7rem"><div><b>' +
          (attackerWins ? '✗ “Carol first” wins' : '✓ “Bob first” wins') + '</b><span class="small">' +
          (attackerWins
            ? 'The attacker out-voted everyone — for free. Counting identities is meaningless when anyone can mint unlimited ones (a Sybil attack).'
            : 'Honest majority holds — for now. But the attacker can keep adding identities at no cost.') +
          '</span></div></div>';
      }
      panel.querySelector('[data-addfake]').addEventListener('click', function () { fake += 10; renderTally(); });
      panel.querySelector('[data-resetfake]').addEventListener('click', function () { fake = 0; renderTally(); });
      renderTally();

      // ── step 4: work-share slider ──
      var share = panel.querySelector('[data-share]');
      var shareVal = panel.querySelector('[data-shareval]');
      var attackEl = panel.querySelector('[data-attack]');
      function renderAttack() {
        var s = +share.value;
        shareVal.textContent = s + '%';
        var wins = s > 50;
        attackEl.innerHTML = '<div class="exw-result ' + (wins ? 'bad' : 'ok') + '" style="margin-top:0.7rem"><div><b>' +
          (wins ? '✗ Attacker can rewrite the order' : '✓ Honest order holds') + '</b><span class="small">' +
          (wins
            ? 'With a majority of the work the attacker can out-build the honest chain (a 51% attack) — but it costs real, continuous hashing, not free identities.'
            : 'The honest chain accumulates work faster, so its order wins. Reversing it would require more than half the network\'s work.') +
          '</span></div></div>';
      }
      share.addEventListener('input', renderAttack);
      renderAttack();
    },

    unmount: function (panel) { if (panel) panel.innerHTML = ''; }
  };
})();
