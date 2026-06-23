/* Interactive explainer: digital-signatures.
 * Registers into window.EXPLAINERS (see _base.js). Built as interactive HTML
 * panels stepped with next/prev — NOT animated SVG. Where the concept can be
 * run for real, it is: this uses the Web Crypto API for genuine ECDSA P-256
 * keys, real SHA-256, and real sign/verify. Nothing is faked.
 *
 * Thesis: a signature proves WHO authorized a message and that it is unchanged
 * (authorization), but never WHEN it was signed (ordering) — and that missing
 * order is the double-spending problem.
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
  function sha256Hex(text) { return crypto.subtle.digest('SHA-256', enc.encode(text)).then(bufToHex); }
  function genKeyPair() { return crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']); }

  function trunc(s, n) { n = n || 18; return s && s.length > n * 2 ? s.slice(0, n) + '…' + s.slice(-n) : s; }

  window.EXPLAINERS["digital-signatures"] = {
    title: "Digital signature",
    blurb: "A private key signs, the matching public key verifies — proving authorization, not ordering.",

    mount: function (panel) {
      var state = { keyPair: null, sigHex: null, signedMsg: null };

      panel.innerHTML =
        '<div class="exw">' +
          '<div class="exw-nav">' +
            '<button data-prev disabled>← Prev</button>' +
            '<button data-next>Next →</button>' +
            '<span class="exw-stepname"></span>' +
            '<span class="exw-dots"></span>' +
          '</div>' +

          // Step 1 — the problem
          '<div class="exw-step" data-step>' +
            '<h3>1 · The problem: a message can be changed in transit</h3>' +
            '<p>Anyone relaying a payment — a node, a router — could quietly alter it. Without proof of <em>who</em> wrote it and that it is <em>unchanged</em>, the receiver has no reason to trust it.</p>' +
            '<div class="exw-grid cols3" style="align-items:center">' +
              '<div class="exw-card"><span class="exw-label">Sender writes</span><input class="exw-input" data-msg value="Pay Alice 5 BTC"></div>' +
              '<div class="exw-arrow" data-arrow>→</div>' +
              '<div class="exw-card"><span class="exw-label">Receiver sees</span><div class="exw-hex" data-seen></div></div>' +
            '</div>' +
            '<button class="exw-btn danger" data-tamper>Tamper with it in transit</button>' +
            '<p class="exw-note" style="margin-top:0.8rem"><b>Why not just encrypt it?</b> Encryption hides the contents. It does nothing to prove who sent a message or that it arrived unchanged. That is what a signature is for.</p>' +
          '</div>' +

          // Step 2 — the key pair (real keys)
          '<div class="exw-step" data-step>' +
            '<h3>2 · The key pair</h3>' +
            '<p>A signature scheme uses two mathematically linked keys. You cannot derive one from the other. The split is the whole point.</p>' +
            '<div class="exw-grid cols2">' +
              '<div class="exw-key priv"><h4>Private key · secret</h4><p>Only it can <b>sign</b>. Never leaves the owner.</p></div>' +
              '<div class="exw-key pub"><h4>Public key · shared</h4><p>Only <b>verifies</b>, never signs. Anyone may hold it.</p></div>' +
            '</div>' +
            '<div class="exw-card">' +
              '<div class="exw-row"><span class="exw-label" style="margin:0">Your live ECDSA P-256 key pair</span><button class="exw-btn ghost" data-regen style="margin:0">↻ Regenerate</button></div>' +
              '<div data-keys style="margin-top:0.6rem"><span class="exw-label">Generating…</span></div>' +
            '</div>' +
          '</div>' +

          // Step 3 — sign & verify (real)
          '<div class="exw-step" data-step>' +
            '<h3>3 · Sign, then verify</h3>' +
            '<p>Sign a message with the <span style="color:#6b4fa0">private key</span>, then verify with the <span style="color:var(--good)">public key</span>. After signing, edit the received message — verification will fail, because the bytes no longer match.</p>' +
            '<div class="exw-card">' +
              '<span class="exw-label">1 · Message to sign</span>' +
              '<textarea class="exw-textarea" rows="2" data-signmsg>I authorize this transfer.</textarea>' +
              '<button class="exw-btn sign" data-sign>✎ Sign with private key</button>' +
            '</div>' +
            '<div data-sigwrap style="display:none">' +
              '<div class="exw-card" style="margin-top:0.8rem"><span class="exw-label">Signature produced (real ECDSA, r ‖ s)</span><div class="exw-hex" data-sig></div></div>' +
              '<div class="exw-card" style="margin-top:0.8rem">' +
                '<span class="exw-label"><span class="exw-row"><span>2 · Message the verifier receives</span><span class="exw-tag" data-dirty style="display:none">⚠ edited after signing</span></span></span>' +
                '<textarea class="exw-textarea" rows="2" data-recvmsg></textarea>' +
                '<button class="exw-btn verify" data-verify>✓ Verify with public key</button>' +
              '</div>' +
              '<div data-result></div>' +
            '</div>' +
          '</div>' +

          // Step 4 — what it proves (thesis)
          '<div class="exw-step" data-step>' +
            '<h3>4 · What it proves — and what it doesn\'t</h3>' +
            '<div class="exw-grid cols3">' +
              '<div class="exw-card"><b style="color:var(--good)">Integrity</b><p style="margin:0.2rem 0 0;font-size:0.84rem;color:var(--muted)">One changed bit → verification fails.</p></div>' +
              '<div class="exw-card"><b style="color:var(--good)">Authenticity</b><p style="margin:0.2rem 0 0;font-size:0.84rem;color:var(--muted)">Only the private-key holder could have signed.</p></div>' +
              '<div class="exw-card"><b style="color:var(--good)">Non-repudiation</b><p style="margin:0.2rem 0 0;font-size:0.84rem;color:var(--muted)">The signer can\'t later deny it.</p></div>' +
            '</div>' +
            '<p class="exw-note">A signature proves <b>who</b> authorized a message and that it is <b>unchanged</b> — but never <b>when</b> it was signed, nor whether the same coin was already signed to someone else. Authorization is not ordering, and that missing order is exactly the <a href="#sec-2">double-spending</a> problem.</p>' +
          '</div>' +
        '</div>';

      // ── navigation ──
      var steps = Array.prototype.slice.call(panel.querySelectorAll('[data-step]'));
      var names = ['The problem', 'The key pair', 'Sign & verify', 'What it proves'];
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

      // ── step 1: tamper ──
      var msgIn = panel.querySelector('[data-msg]');
      var seenEl = panel.querySelector('[data-seen]');
      var arrowEl = panel.querySelector('[data-arrow]');
      var tamperBtn = panel.querySelector('[data-tamper]');
      var tampered = false;
      function renderSeen() {
        var t = msgIn.value;
        if (tampered) t = t.replace(/Alice/gi, 'Mallory').replace(/\b\d+(\.\d+)?\b/, function (n) { return n + '00'; });
        seenEl.textContent = t;
        seenEl.style.color = tampered ? 'var(--bad)' : 'var(--ink)';
        arrowEl.textContent = tampered ? '→ ⚠' : '→';
        arrowEl.style.color = tampered ? 'var(--bad)' : 'var(--muted)';
      }
      msgIn.addEventListener('input', renderSeen);
      tamperBtn.addEventListener('click', function () {
        tampered = !tampered;
        tamperBtn.textContent = tampered ? 'Reset message' : 'Tamper with it in transit';
        tamperBtn.classList.toggle('ghost', tampered);
        tamperBtn.classList.toggle('danger', !tampered);
        renderSeen();
      });
      renderSeen();

      // ── step 2: live keys ──
      var keysEl = panel.querySelector('[data-keys]');
      var privShown = false;
      function renderKeys(pub, priv) {
        keysEl.innerHTML =
          '<span class="exw-label" style="color:var(--accent)">Public key (curve point x, y)</span>' +
          '<div class="exw-hex">x: ' + trunc(pub.x) + '<br>y: ' + trunc(pub.y) + '</div>' +
          '<div class="exw-row" style="margin-top:0.5rem"><span class="exw-label" style="margin:0;color:#6b4fa0">Private key (secret scalar d)</span>' +
          '<button class="exw-btn ghost" data-reveal style="margin:0;padding:0.25rem 0.5rem">' + (privShown ? 'Hide' : 'Reveal') + '</button></div>' +
          '<div class="exw-hex" style="margin-top:0.3rem">d: ' + (privShown ? trunc(priv.d) : '•'.repeat(40)) + '</div>';
        keysEl.querySelector('[data-reveal]').addEventListener('click', function () { privShown = !privShown; renderKeys(pub, priv); });
      }
      function loadKeys() {
        keysEl.innerHTML = '<span class="exw-label">Generating…</span>';
        return genKeyPair().then(function (kp) {
          state.keyPair = kp;
          return Promise.all([crypto.subtle.exportKey('jwk', kp.publicKey), crypto.subtle.exportKey('jwk', kp.privateKey)]);
        }).then(function (jwks) { renderKeys(jwks[0], jwks[1]); });
      }
      panel.querySelector('[data-regen]').addEventListener('click', loadKeys);
      loadKeys();

      // ── step 3: sign & verify ──
      var signMsg = panel.querySelector('[data-signmsg]');
      var recvMsg = panel.querySelector('[data-recvmsg]');
      var sigWrap = panel.querySelector('[data-sigwrap]');
      var sigEl = panel.querySelector('[data-sig]');
      var dirtyEl = panel.querySelector('[data-dirty]');
      var resultEl = panel.querySelector('[data-result]');
      function clearResult() { resultEl.innerHTML = ''; }
      function markDirty() { dirtyEl.style.display = (state.signedMsg !== null && recvMsg.value !== state.signedMsg) ? '' : 'none'; }
      panel.querySelector('[data-sign]').addEventListener('click', function () {
        if (!state.keyPair) return;
        crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, state.keyPair.privateKey, enc.encode(signMsg.value)).then(function (sig) {
          state.sigHex = bufToHex(sig);
          state.signedMsg = signMsg.value;
          sigEl.innerHTML = hexBlocks(state.sigHex);
          recvMsg.value = signMsg.value;
          sigWrap.style.display = '';
          clearResult(); markDirty();
        });
      });
      recvMsg.addEventListener('input', function () { clearResult(); markDirty(); });
      panel.querySelector('[data-verify]').addEventListener('click', function () {
        if (!state.sigHex) return;
        var bytes = Uint8Array.from(state.sigHex.match(/.{2}/g).map(function (h) { return parseInt(h, 16); }));
        crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, state.keyPair.publicKey, bytes, enc.encode(recvMsg.value)).then(function (ok) {
          resultEl.innerHTML = ok
            ? '<div class="exw-result ok"><div><b>✓ Signature valid</b><span class="small">The received bytes match what was signed, by the matching private key. Integrity and authenticity confirmed.</span></div></div>'
            : '<div class="exw-result bad"><div><b>✗ Signature invalid</b><span class="small">The message no longer matches the signed bytes. The verifier rejects it — exactly the tamper protection we wanted.</span></div></div>';
        });
      });
    },

    unmount: function (panel) { if (panel) panel.innerHTML = ''; }
  };
})();
