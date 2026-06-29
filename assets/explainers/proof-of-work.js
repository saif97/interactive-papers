/* Interactive explainer: proof-of-work.
 * Registers into window.EXPLAINERS (see _base.js). Built as interactive HTML
 * panels stepped with next/prev (see building-explainers skill).
 *
 * The reader picks a difficulty, sees that a single nonce is a lottery ticket,
 * then GRINDS a real block: the nonce is incremented and the block re-hashed,
 * for real, thousands of times, until the hash starts with the required number
 * of zeros. Finally they verify the winning block with a single hash.
 *
 * Hashing is real SHA-256. We use a small synchronous SHA-256 (below) rather
 * than window.crypto.subtle because mining means tens of thousands of hashes:
 * subtle.digest is async (one Promise per hash), far too slow to watch a grind.
 * The sync version is the same algorithm; it lets the attempt counter fly.
 * (Simplified vs Bitcoin: single SHA-256 over a text block, and difficulty is
 * counted in leading zero HEX digits, not raw bits. The asymmetry shown — hard
 * to find, instant to check — is exactly the real thing.)
 *
 * Thesis: a valid block is found only by brute-force guessing (about 16^N tries
 * for N leading zeros), but anyone checks it with ONE hash. That asymmetry is
 * what makes a buried block expensive to forge and cheap to trust.
 */
(function () {
  window.EXPLAINERS = window.EXPLAINERS || {};

  // ── compact synchronous SHA-256 over a UTF-8 string → 64-char hex ──
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  var enc = new TextEncoder();
  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
  function sha256hex(str) {
    var bytes = enc.encode(str);
    var l = bytes.length;
    var bitLen = l * 8;
    var withOne = l + 1;
    var pad = (56 - (withOne % 64) + 64) % 64;
    var total = withOne + pad + 8;
    var m = new Uint8Array(total);
    m.set(bytes);
    m[l] = 0x80;
    var hi = Math.floor(bitLen / 0x100000000), lo = bitLen >>> 0;
    m[total - 8] = (hi >>> 24) & 0xff; m[total - 7] = (hi >>> 16) & 0xff; m[total - 6] = (hi >>> 8) & 0xff; m[total - 5] = hi & 0xff;
    m[total - 4] = (lo >>> 24) & 0xff; m[total - 3] = (lo >>> 16) & 0xff; m[total - 2] = (lo >>> 8) & 0xff; m[total - 1] = lo & 0xff;

    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var w = new Array(64);
    for (var off = 0; off < total; off += 64) {
      for (var i = 0; i < 16; i++) {
        w[i] = (m[off + i * 4] << 24) | (m[off + i * 4 + 1] << 16) | (m[off + i * 4 + 2] << 8) | (m[off + i * 4 + 3]);
      }
      for (i = 16; i < 64; i++) {
        var s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        var s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ ((~e) & g);
        var t1 = (h + S1 + ch + K[i] + w[i]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var hex = '';
    for (i = 0; i < 8; i++) { hex += (H[i] >>> 0).toString(16).padStart(8, '0'); }
    return hex;
  }

  // Leading zero hex digits in a hash.
  function lz(hex) { var n = 0; for (var i = 0; i < hex.length; i++) { if (hex[i] === '0') n++; else break; } return n; }

  // The block being mined: a fixed payload; the nonce is the only knob.
  var PREV = sha256hex('genesis block');
  var DATA = 'Alice → Bob: 5 · Carol → Dan: 2';
  function blockStr(nonce) { return PREV + '|' + DATA + '|nonce=' + nonce; }

  // Difficulty options for the dropdown, in leading zero hex digits.
  // ~16^D tries on average — each extra zero is 16x more work.
  var DIFFS = [1, 2, 3, 4, 5];

  // Render a hash with its leading zero run colored: green if it meets D, amber if not.
  function hashHtml(hex, D) {
    var z = lz(hex);
    if (z === 0) return '<span class="rest">' + hex + '</span>';
    var cls = z >= D ? 'z' : 'zno';
    return '<span class="' + cls + '">' + hex.slice(0, z) + '</span><span class="rest">' + hex.slice(z) + '</span>';
  }

  window.EXPLAINERS["proof-of-work"] = {
    title: "Proof-of-work",
    blurb: "A valid block is found only by brute-force guessing, but checked with a single hash — that asymmetry secures the chain.",

    mount: function (panel) {
      var state = { D: 3, mined: null };

      panel.innerHTML =
        '<div class="exw">' +
          '<div class="exw-nav">' +
            '<button data-prev disabled>← Prev</button>' +
            '<button data-next>Next →</button>' +
            '<span class="exw-stepname"></span>' +
            '<span class="exw-dots"></span>' +
          '</div>' +

          // Step 1 — the target
          '<div class="exw-step" data-step>' +
            '<h3>1 · The rule: the hash must start with zeros</h3>' +
            '<p>A block counts as valid only if its hash begins with a set number of <b>0</b>s. More required zeros means a smaller share of hashes qualify, so it takes more guessing to land one. That required count is the <b>difficulty</b>. Set it here:</p>' +
            '<div class="exw-row" style="gap:0.5rem;align-items:center;justify-content:flex-start">' +
              '<label style="font-size:0.85rem;display:inline-flex;align-items:center;gap:0.5rem">Leading zeros required:' +
                '<select class="exw-input" data-diff style="margin:0;max-width:6rem"></select></label>' +
            '</div>' +
            '<div class="exw-note" style="margin-top:0.8rem" data-target></div>' +
          '</div>' +

          // Step 2 — one guess is a lottery
          '<div class="exw-step" data-step>' +
            '<h3>2 · One nonce is one lottery ticket</h3>' +
            '<p>The block holds fixed data plus a <b>nonce</b> — a number you are free to change. Each nonce gives a completely different hash, and you cannot steer it: you just try one and look. Step the nonce and watch the leading zeros jump around, almost never reaching the target.</p>' +
            '<div class="exw-card">' +
              '<span class="exw-label">block + nonce</span>' +
              '<div class="exw-row" style="gap:0.5rem"><span style="font-size:0.85rem">nonce =</span>' +
              '<input class="exw-input" type="number" name="nonce" data-nonce value="0" style="max-width:130px">' +
              '<button class="exw-btn ghost" data-bump>Try next nonce →</button></div>' +
              '<span class="exw-label" style="margin-top:0.7rem">SHA-256( block )</span>' +
              '<div class="exw-hashbig" data-h2></div>' +
            '</div>' +
            '<div data-r2></div>' +
          '</div>' +

          // Step 3 — mine it
          '<div class="exw-step" data-step>' +
            '<h3>3 · Mining is just guessing, fast</h3>' +
            '<p>Stop guessing by hand. <b>Mine</b> increments the nonce and re-hashes the block over and over, for real, until a hash finally clears the target. Watch the attempt counter — that count is the work.</p>' +
            '<div class="exw-card">' +
              '<div class="exw-row"><span class="exw-label" style="margin:0">attempts</span>' +
              '<span class="exw-counter" data-count>0</span></div>' +
              '<div class="exw-row" style="margin-top:0.5rem">' +
                '<button class="exw-btn verify" data-mine>⛏ Mine this block</button>' +
                '<button class="exw-btn danger" data-stop disabled>Stop</button>' +
              '</div>' +
            '</div>' +
            '<div data-r3></div>' +
          '</div>' +

          // Step 4 — verify, and the thesis
          '<div class="exw-step" data-step>' +
            '<h3>4 · Hard to find, instant to check</h3>' +
            '<p>Anyone handed the winning nonce confirms the block with a <b>single</b> hash — no searching. Mine a block in step 3, then check it here.</p>' +
            '<div class="exw-card">' +
              '<button class="exw-btn verify" data-verify>Verify the mined block (1 hash)</button>' +
              '<div data-rv style="margin-top:0.6rem"></div>' +
            '</div>' +
            '<p class="exw-note" style="margin-top:0.8rem">Finding the proof took roughly <b>16^N</b> hashes; checking it takes <b>one</b>. That asymmetry is the whole point of <a href="#sec-4">proof-of-work</a>: a block is costly to produce but cheap to trust. To rewrite a block buried in the chain, an attacker must redo its work <i>and</i> the work of every block <a href="#sec-3">chained</a> after it, then out-race the honest miners building the <a href="#sec-5">longest chain</a> — which is why depth means safety.</p>' +
          '</div>' +
        '</div>';

      // ── navigation ──
      var steps = Array.prototype.slice.call(panel.querySelectorAll('[data-step]'));
      var names = ['The target', 'One guess', 'Mine it', 'Verify'];
      var prevBtn = panel.querySelector('[data-prev]');
      var nextBtn = panel.querySelector('[data-next]');
      var nameEl = panel.querySelector('.exw-stepname');
      var dotsWrap = panel.querySelector('.exw-dots');
      steps.forEach(function (_, i) { var dt = document.createElement('i'); dt.addEventListener('click', function () { show(i); }); dotsWrap.appendChild(dt); });
      var dots = Array.prototype.slice.call(dotsWrap.children);
      var cur = 0;
      function show(i) {
        cur = Math.max(0, Math.min(steps.length - 1, i));
        steps.forEach(function (s, j) { s.classList.toggle('on', j === cur); });
        dots.forEach(function (dt, j) { dt.classList.toggle('on', j === cur); });
        nameEl.textContent = 'Step ' + (cur + 1) + ' / ' + steps.length + ' · ' + names[cur];
        prevBtn.disabled = cur === 0;
        nextBtn.disabled = cur === steps.length - 1;
      }
      prevBtn.addEventListener('click', function () { show(cur - 1); });
      nextBtn.addEventListener('click', function () { show(cur + 1); });
      show(0);

      // ── step 1: difficulty dropdown ──
      var diffEl = panel.querySelector('[data-diff]');
      var targetEl = panel.querySelector('[data-target]');
      diffEl.innerHTML = DIFFS.map(function (d) {
        return '<option value="' + d + '"' + (d === state.D ? ' selected' : '') + '>' + d + ' zero' + (d > 1 ? 's' : '') + '</option>';
      }).join('');
      function renderTarget() {
        var expected = Math.pow(16, state.D);
        targetEl.innerHTML = 'Target: the hash must start with <b>' + state.D + '</b> zero' + (state.D > 1 ? 's' : '') +
          ' (<span class="exw-mono">' + new Array(state.D + 1).join('0') + '…</span>). ' +
          'Only about 1 in <b>' + expected.toLocaleString() + '</b> hashes qualifies, so expect roughly that many tries before one lands.';
      }
      diffEl.addEventListener('change', function () {
        state.D = +diffEl.value;
        state.mined = null;            // a new target invalidates the old proof
        renderTarget(); renderGuess(); resetMine(); renderVerify();
      });

      // ── step 2: manual nonce ──
      var nonceEl = panel.querySelector('[data-nonce]');
      var h2El = panel.querySelector('[data-h2]');
      var r2El = panel.querySelector('[data-r2]');
      function renderGuess() {
        var n = parseInt(nonceEl.value, 10); if (isNaN(n)) n = 0;
        var h = sha256hex(blockStr(n));
        var z = lz(h), ok = z >= state.D;
        h2El.innerHTML = hashHtml(h, state.D);
        r2El.innerHTML = '<div class="exw-result ' + (ok ? 'ok' : 'bad') + '"><div><b>' +
          (ok ? '✓ Below target — this nonce wins' : '✗ Not enough leading zeros') + '</b>' +
          '<span class="small">This hash has ' + z + ' leading zero' + (z === 1 ? '' : 's') + '; the target needs ' + state.D + '.</span></div></div>';
      }
      nonceEl.addEventListener('input', renderGuess);
      panel.querySelector('[data-bump]').addEventListener('click', function () {
        nonceEl.value = (parseInt(nonceEl.value, 10) || 0) + 1; renderGuess();
      });

      // ── step 3: the grind ──
      var countEl = panel.querySelector('[data-count]');
      var r3El = panel.querySelector('[data-r3]');
      var mineBtn = panel.querySelector('[data-mine]');
      var stopBtn = panel.querySelector('[data-stop]');
      var running = false, stopReq = false;
      function resetMine() { running = false; stopReq = false; countEl.textContent = '0'; r3El.innerHTML = ''; mineBtn.disabled = false; stopBtn.disabled = true; }
      function grind(nonce, attempts, t0) {
        if (stopReq) {
          running = false; mineBtn.disabled = false; stopBtn.disabled = true;
          r3El.innerHTML = '<div class="exw-result bad"><div><b>Stopped</b><span class="small">Gave up after ' + attempts.toLocaleString() + ' attempts.</span></div></div>';
          return;
        }
        // Hash a batch per tick, then yield with a short delay, so the attempt
        // counter visibly climbs instead of jumping to the answer — the grind
        // reads as real work. Hashing is still real SHA-256. The batch scales
        // with difficulty (~16^D expected tries) so every setting stays
        // watchable (~1-10s) rather than crawling for minutes at 5 zeros.
        var budget = Math.max(10, Math.round(Math.pow(16, state.D) / 1170));
        while (budget-- > 0) {
          var h = sha256hex(blockStr(nonce));
          attempts++;
          if (lz(h) >= state.D) {
            running = false; mineBtn.disabled = false; stopBtn.disabled = true;
            countEl.textContent = attempts.toLocaleString();
            state.mined = { nonce: nonce, hash: h, attempts: attempts, D: state.D };
            var ms = Date.now() - t0;
            r3El.innerHTML = '<div class="exw-result ok"><div><b>✓ Block mined</b>' +
              '<span class="small">Winning nonce <b>' + nonce + '</b> after <b>' + attempts.toLocaleString() + '</b> hashes (' + ms + ' ms).</span>' +
              '<div class="exw-hashbig" style="margin-top:0.4rem">' + hashHtml(h, state.D) + '</div></div></div>';
            return;
          }
          nonce++;
        }
        countEl.textContent = attempts.toLocaleString();
        setTimeout(function () { grind(nonce, attempts, t0); }, 16);
      }
      mineBtn.addEventListener('click', function () {
        if (running) return;
        running = true; stopReq = false; mineBtn.disabled = true; stopBtn.disabled = false; r3El.innerHTML = '';
        grind(0, 0, Date.now());
      });
      stopBtn.addEventListener('click', function () { stopReq = true; });

      // ── step 4: verify ──
      var rvEl = panel.querySelector('[data-rv]');
      function renderVerify() { rvEl.innerHTML = ''; }
      panel.querySelector('[data-verify]').addEventListener('click', function () {
        if (!state.mined) {
          rvEl.innerHTML = '<div class="exw-result bad"><div><b>Nothing mined yet</b><span class="small">Go to step 3 and mine a block first.</span></div></div>';
          return;
        }
        var m = state.mined;
        var h = sha256hex(blockStr(m.nonce));     // exactly one hash
        var ok = h === m.hash && lz(h) >= m.D;
        rvEl.innerHTML = '<div class="exw-result ' + (ok ? 'ok' : 'bad') + '"><div><b>' +
          (ok ? '✓ Valid in one hash' : '✗ Invalid') + '</b>' +
          '<span class="small">Hashed nonce ' + m.nonce + ' once → ' + lz(h) + ' leading zeros ≥ ' + m.D + ' required. ' +
          'Producing it took ' + m.attempts.toLocaleString() + ' hashes; this check took 1.</span></div></div>';
      });

      // initial paint
      renderTarget(); renderGuess(); resetMine();
    },

    unmount: function (panel) { if (panel) panel.innerHTML = ''; }
  };
})();
