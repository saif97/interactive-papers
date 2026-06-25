/* Interactive explainer: timestamp-server (titled "Chain of blocks").
 * Registers into window.EXPLAINERS (see _base.js). Built as interactive HTML
 * panels stepped with next/prev (see building-explainers skill). Uses REAL
 * SHA-256 (window.crypto.subtle): each block's hash = SHA-256(previous hash +
 * its data), so every block commits to the one before it.
 *
 * The reader sees a single block point back, then a chain of them, then tampers
 * with any block and watches that block AND every block after it turn red —
 * because each later block's hash was built on the one that just changed.
 *
 * (Simplified vs Bitcoin: a block's payload is one text line, and we hash that
 * plus the previous hash directly. The chaining property shown — change one
 * block and the rest break — is exactly the real thing.)
 *
 * Thesis: each block carries the hash of the block before it, so the chain is
 * tamper-evident: altering any block changes its hash and breaks every block
 * built on top of it. The deeper a block is buried, the more must be rebuilt.
 */
(function () {
  window.EXPLAINERS = window.EXPLAINERS || {};

  var enc = new TextEncoder();
  function bufToHex(buf) { return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join(''); }
  function sha256Hex(text) { return crypto.subtle.digest('SHA-256', enc.encode(text)).then(bufToHex); }
  function short(h) { return h ? h.slice(0, 16) + '…' : ''; }

  var GENESIS = new Array(65).join('0');                 // 64 zeros: the chain's anchor
  var ORIGD = ['coinbase → miner', 'Alice → Bob: 5', 'Carol → Dan: 2', 'Eve → Frank: 1'];

  // Compute the whole chain from block payloads. hash_i = SHA-256(prev_i + '|' + data_i).
  function computeChain(datas) {
    var blocks = [], prev = GENESIS;
    return datas.reduce(function (p, data) {
      return p.then(function () {
        return sha256Hex(prev + '|' + data).then(function (h) {
          blocks.push({ prev: prev, data: data, hash: h });
          prev = h;
        });
      });
    }, Promise.resolve()).then(function () { return blocks; });
  }

  // Render a chain into a container. opts.editable wires inputs; opts.committed marks changes.
  function renderChain(container, blocks, opts) {
    opts = opts || {};
    var html = '<div class="exw-chain">';
    blocks.forEach(function (b, i) {
      var changed = opts.committed && opts.committed[i] && b.hash !== opts.committed[i].hash;
      if (i > 0) {
        html += '<div class="exw-blink' + (changed ? ' broken' : '') + '">↑ prev = hash of block ' + (i - 1) + '</div>';
      }
      var dataCell = opts.editable
        ? '<input class="exw-input" name="blk' + i + '" data-blk="' + i + '" value="' + b.data.replace(/"/g, '&quot;') + '">'
        : '<span class="bk-data">' + b.data + '</span>';
      html += '<div class="exw-block' + (changed ? ' changed' : '') + (i === 0 ? ' genesis' : '') + '">' +
        '<div class="bk-head">block ' + i + (i === 0 ? ' · genesis' : '') + (changed ? ' · changed' : '') + '</div>' +
        '<div class="bk-field"><span class="bk-lab">prev</span><span class="bk-prev">' + (i === 0 ? '0000…0000 (none)' : short(b.prev)) + '</span></div>' +
        '<div class="bk-field"><span class="bk-lab">data</span>' + dataCell + '</div>' +
        '<div class="bk-field"><span class="bk-lab">hash</span><span class="bk-hash">' + short(b.hash) + '</span></div>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  window.EXPLAINERS["timestamp-server"] = {
    title: "Chain of blocks",
    blurb: "Each block carries the hash of the one before it — so changing any block breaks every block after it.",

    mount: function (panel) {
      var state = { committed: null, tamper: ORIGD.slice() };

      panel.innerHTML =
        '<div class="exw">' +
          '<div class="exw-nav">' +
            '<button data-prev disabled>← Prev</button>' +
            '<button data-next>Next →</button>' +
            '<span class="exw-stepname"></span>' +
            '<span class="exw-dots"></span>' +
          '</div>' +

          // Step 1 — a block points back
          '<div class="exw-step" data-step>' +
            '<h3>1 · A block carries the hash before it</h3>' +
            '<p>Each block bundles some data, but it also stores one extra thing: the <b>hash of the previous block</b>. Its own hash is computed over both — <span class="exw-mono">hash( prev + data )</span> — so the block is sealed to the one before it. Here is the first real block, built on the genesis anchor.</p>' +
            '<div class="exw-card" data-one></div>' +
          '</div>' +

          // Step 2 — linked into a chain
          '<div class="exw-step" data-step>' +
            '<h3>2 · Each link is the previous hash</h3>' +
            '<p>Stack the blocks. The <b>prev</b> field of every block is exactly the <b>hash</b> of the block beneath it. That repeated link is the chain — a tamper-evident ordering of all the blocks.</p>' +
            '<div class="exw-card" data-chain2></div>' +
          '</div>' +

          // Step 3 — why "timestamp"
          '<div class="exw-step" data-step>' +
            '<h3>3 · Why it\'s called a timestamp</h3>' +
            '<p>The paper calls this a <b>timestamp server</b> — but it never reads a clock. It proves two things instead. <b>Existence:</b> publishing a block\'s hash proves every item under it already existed, because they had to exist to go into the hash. <b>Order:</b> each block embeds the hash of the one before it, so the blocks fall in a fixed sequence — each block stamps "everything before me happened earlier." Publish a block\'s hash and see what it proves.</p>' +
            '<div class="exw-card" data-tschain></div>' +
            '<div class="exw-row" style="justify-content:flex-start;gap:0.6rem;flex-wrap:wrap;margin-top:0.7rem">' +
              '<span class="exw-label" style="margin:0">Publish the hash of block</span>' +
              '<input type="range" class="exw-input" data-tspub min="0" max="3" value="3" style="width:160px;padding:0">' +
              '<span class="exw-mono" data-tspubv>3</span>' +
            '</div>' +
            '<div data-tsout></div>' +
          '</div>' +

          // Step 4 — tamper
          '<div class="exw-step" data-step>' +
            '<h3>4 · Change one block, break all above it</h3>' +
            '<p>Edit any block\'s data. Its hash changes, which is the next block\'s <b>prev</b>, which changes that block\'s hash too — so every block stacked above the one you touched turns red. Try editing the genesis block, then the top block, and compare the damage.</p>' +
            '<div class="exw-card" data-chain3></div>' +
            '<div data-tamperresult></div>' +
          '</div>' +

          // Step 5 — thesis
          '<div class="exw-step" data-step>' +
            '<h3>5 · Why depth means safety</h3>' +
            '<p class="exw-note">Because each block commits to the one before it, you cannot quietly change old history — every block built on top would have to be rebuilt to match. And rebuilding is not free: each block\'s hash must satisfy <a href="#sec-4">proof-of-work</a>, so an attacker rewriting a buried block must redo the work of that block and every block after it, while honest miners keep extending the <a href="#sec-5">longest chain</a>. The deeper a transaction sits, the more work a rewrite costs — which is why waiting for confirmations makes a payment safe.</p>' +
          '</div>' +
        '</div>';

      // ── navigation ──
      var steps = Array.prototype.slice.call(panel.querySelectorAll('[data-step]'));
      var names = ['One block', 'The chain', 'Why timestamp', 'Tamper', 'Why depth'];
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

      // ── compute the committed chain once, then wire each step ──
      var oneEl = panel.querySelector('[data-one]');
      var chain2El = panel.querySelector('[data-chain2]');
      var chain3El = panel.querySelector('[data-chain3]');
      var tamperResEl = panel.querySelector('[data-tamperresult]');

      computeChain(ORIGD).then(function (committed) {
        state.committed = committed;

        // Step 1 — just the genesis + first block (read-only)
        renderChain(oneEl, committed.slice(0, 2), {});

        // Step 2 — the full chain (read-only)
        renderChain(chain2El, committed, {});

        // Step 3 — "why timestamp": publish a block's hash, see what it proves
        renderChain(panel.querySelector('[data-tschain]'), committed, {});
        var pub = panel.querySelector('[data-tspub]');
        var pubV = panel.querySelector('[data-tspubv]');
        var tsOut = panel.querySelector('[data-tsout]');
        pub.max = committed.length - 1;
        function renderPublish() {
          var k = +pub.value;
          pubV.textContent = k;
          var existence = k === 0
            ? 'Anyone who saw this knows block 0 (the genesis anchor) already existed — it is inside this hash. It is the start of the order.'
            : 'Anyone who saw this knows blocks 0–' + k + ' already existed — they are inside this hash. And the order is fixed: block ' + k + ' sits after block ' + (k - 1) + ', because block ' + k + '\'s hash is built on block ' + (k - 1) + '\'s and cannot be reordered without breaking the chain.';
          tsOut.innerHTML = '<div class="exw-result ok"><div><b>✓ Published: hash of block ' + k + ' = ' + short(committed[k].hash) + '</b>' +
            '<span class="small">' + existence +
            ' That ordered proof-of-existence, with no clock involved, is the "timestamp".</span></div></div>';
        }
        pub.addEventListener('input', renderPublish);
        renderPublish();

        // Step 3 — editable. Re-render rebuilds the inputs, so we restore focus/caret
        // to the edited field and use a token so only the latest async result paints.
        var token = 0;
        function renderTamper(focusBlk, caret) {
          var mine = ++token;
          computeChain(state.tamper).then(function (chain) {
            if (mine !== token) return;                 // a newer keystroke superseded this render
            renderChain(chain3El, chain, { editable: true, committed: committed });
            Array.prototype.forEach.call(chain3El.querySelectorAll('[data-blk]'), function (inp) {
              inp.addEventListener('input', function () {
                state.tamper[+inp.getAttribute('data-blk')] = inp.value;
                renderTamper(+inp.getAttribute('data-blk'), inp.selectionStart);
              });
            });
            if (focusBlk != null) {
              var again = chain3El.querySelector('[data-blk="' + focusBlk + '"]');
              if (again) { again.focus(); try { again.setSelectionRange(caret, caret); } catch (e) {} }
            }
            var changed = chain.filter(function (b, i) { return b.hash !== committed[i].hash; }).length;
            var ok = changed === 0;
            tamperResEl.innerHTML = '<div class="exw-result ' + (ok ? 'ok' : 'bad') + '"><div><b>' +
              (ok ? '✓ Chain intact' : '✗ ' + changed + ' of ' + chain.length + ' blocks broke') + '</b><span class="small">' +
              (ok
                ? 'No block has been edited, so every prev still matches the hash below it.'
                : 'The edited block and every block above it no longer match the committed chain — each one would have to be rebuilt to hide the change.') +
              '</span></div></div>';
          });
        }
        renderTamper();
      });
    },

    unmount: function (panel) { if (panel) panel.innerHTML = ''; }
  };
})();
