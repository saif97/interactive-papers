/* Interactive explainer: merkle-tree.
 * Registers into window.EXPLAINERS (see _base.js). Built as interactive HTML
 * panels stepped with next/prev (see building-explainers skill). Uses REAL
 * SHA-256 (window.crypto.subtle) throughout: leaves are hashes of transactions,
 * parents are hashes of their two children's hashes, up to a single root.
 *
 * (Simplified vs Bitcoin: single SHA-256 over the hex of concatenated children,
 * not double-SHA-256 over raw bytes. The structure and every property shown are
 * the real thing.)
 *
 * Thesis: one root hash fingerprints every transaction in a block — so any
 * tamper changes the root, and a single transaction's membership can be proven
 * with just a short branch of sibling hashes, without the rest of the block.
 */
(function () {
  window.EXPLAINERS = window.EXPLAINERS || {};

  var enc = new TextEncoder();
  function bufToHex(buf) { return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join(''); }
  function sha256Hex(text) { return crypto.subtle.digest('SHA-256', enc.encode(text)).then(bufToHex); }
  function short(h) { return h ? h.slice(0, 12) + '…' : ''; }

  // A fixed 4-transaction block (a balanced tree: 4 leaves → 2 inner → 1 root).
  var ORIG = ['Alice → Bob: 5', 'Carol → Dan: 2', 'Eve → Frank: 1', 'Grace → Heidi: 8'];

  // Compute the whole tree from 4 transaction strings. All hashing is real.
  function computeTree(txs) {
    return Promise.all(txs.map(sha256Hex)).then(function (leaves) {
      return Promise.all([sha256Hex(leaves[0] + leaves[1]), sha256Hex(leaves[2] + leaves[3])]).then(function (inner) {
        return sha256Hex(inner[0] + inner[1]).then(function (root) {
          return { leaves: leaves, inner: inner, root: root };
        });
      });
    });
  }

  // Render the tree into a container. opts.mark(kind, i) -> css class suffix or ''.
  function renderTree(container, tree, opts) {
    opts = opts || {};
    function cls(kind, i) { var m = opts.mark ? opts.mark(kind, i) : ''; return m ? ' ' + m : ''; }
    function node(kind, i, lab, hash) {
      return '<div class="exw-mnode' + (kind === 'root' ? ' root' : '') + cls(kind, i) + '">' +
        '<span class="lab">' + lab + '</span>' + short(hash) + '</div>';
    }
    container.innerHTML =
      '<div class="exw-mtree">' +
        '<div class="exw-mrow">' + node('root', 0, 'Merkle root', tree.root) + '</div>' +
        '<div class="exw-mcap">each parent = hash( left child ‖ right child )</div>' +
        '<div class="exw-mrow">' +
          node('inner', 0, 'hash(0,1)', tree.inner[0]) +
          node('inner', 1, 'hash(2,3)', tree.inner[1]) +
        '</div>' +
        '<div class="exw-mrow">' +
          tree.leaves.map(function (h, i) { return node('leaf', i, 'tx ' + i, h); }).join('') +
        '</div>' +
      '</div>';
  }

  window.EXPLAINERS["merkle-tree"] = {
    title: "Merkle tree",
    blurb: "One root hash fingerprints every transaction in a block — tamper-evident, and provable with a short branch.",

    mount: function (panel) {
      var state = { committed: null, tamper: ORIG.slice() };

      panel.innerHTML =
        '<div class="exw">' +
          '<div class="exw-nav">' +
            '<button data-prev disabled>← Prev</button>' +
            '<button data-next>Next →</button>' +
            '<span class="exw-stepname"></span>' +
            '<span class="exw-dots"></span>' +
          '</div>' +

          // Step 1 — leaves
          '<div class="exw-step" data-step>' +
            '<h3>1 · Every transaction becomes a hash</h3>' +
            '<p>A block bundles many transactions. First, each one is hashed into a fixed-size <b>leaf</b> — its digest. These four make up our example block.</p>' +
            '<div data-leaves><span class="exw-label">Hashing…</span></div>' +
          '</div>' +

          // Step 2 — build the root
          '<div class="exw-step" data-step>' +
            '<h3>2 · Pair and hash, up to one root</h3>' +
            '<p>Hash each pair of leaves together to get a parent, then hash the parents together. Repeat until a single hash remains: the <b>Merkle root</b>. That one hash commits to all four transactions at once, and it is the only part that goes in the block header.</p>' +
            '<div class="exw-card" data-tree2></div>' +
          '</div>' +

          // Step 3 — tamper
          '<div class="exw-step" data-step>' +
            '<h3>3 · Change one transaction, break the root</h3>' +
            '<p>Edit any transaction below. Its leaf changes, which changes its parent, which changes the root — the red path. The new root no longer matches the one already committed in the header, so the tamper is caught.</p>' +
            '<div class="exw-card"><div data-tamperin></div></div>' +
            '<div class="exw-card" style="margin-top:0.8rem" data-tree3></div>' +
            '<div data-tamperresult></div>' +
          '</div>' +

          // Step 4 — prove inclusion (SPV)
          '<div class="exw-step" data-step>' +
            '<h3>4 · Prove one transaction is in the block</h3>' +
            '<p>To prove a single transaction belongs, you don\'t need the whole block — only the <b>branch</b>: the sibling hashes along its path to the root. Click a transaction to see its branch, then watch the root rebuilt from just that transaction plus those few hashes.</p>' +
            '<div class="exw-row" style="flex-wrap:wrap;gap:0.4rem" data-pick></div>' +
            '<div class="exw-card" style="margin-top:0.8rem" data-tree4></div>' +
            '<p class="exw-note" style="margin-top:0.6rem"><b style="color:var(--good)">Green</b> = the path rebuilt from your transaction. <b style="color:var(--accent)">Amber</b> = the branch hashes you are handed to do it.</p>' +
            '<div data-spvresult></div>' +
          '</div>' +

          // Step 5 — thesis
          '<div class="exw-step" data-step>' +
            '<h3>5 · What the root buys you</h3>' +
            '<p class="exw-note">One Merkle root fingerprints every transaction in a block at once. Any change to any transaction changes the root, so a block\'s contents are <b>tamper-evident</b> from the header alone. And because membership needs only a short branch — about log₂(n) hashes, two for these four transactions and around twenty for a block of a million — a lightweight client can verify a payment with just block headers plus a branch (<a href="#sec-8">simplified payment verification</a>), and spent transactions can be pruned to <a href="#sec-7">reclaim disk space</a> without changing the block\'s hash.</p>' +
          '</div>' +
        '</div>';

      // ── navigation ──
      var steps = Array.prototype.slice.call(panel.querySelectorAll('[data-step]'));
      var names = ['Leaves', 'The root', 'Tamper', 'Prove inclusion', 'What it buys'];
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

      // ── compute the committed tree once, then wire every step off it ──
      var leavesEl = panel.querySelector('[data-leaves]');
      var tree2El = panel.querySelector('[data-tree2]');
      var tamperInEl = panel.querySelector('[data-tamperin]');
      var tree3El = panel.querySelector('[data-tree3]');
      var tamperResEl = panel.querySelector('[data-tamperresult]');
      var pickEl = panel.querySelector('[data-pick]');
      var tree4El = panel.querySelector('[data-tree4]');
      var spvResEl = panel.querySelector('[data-spvresult]');

      computeTree(ORIG).then(function (committed) {
        state.committed = committed;

        // Step 1 — leaves list
        leavesEl.innerHTML = ORIG.map(function (tx, i) {
          return '<div class="exw-card" style="margin-bottom:0.5rem">' +
            '<div class="exw-row"><span class="exw-label" style="margin:0">tx ' + i + '</span>' +
            '<span style="font-size:0.85rem">' + tx + '</span></div>' +
            '<div class="exw-hex" style="margin-top:0.4rem">' + committed.leaves[i] + '</div></div>';
        }).join('');

        // Step 2 — the committed tree
        renderTree(tree2El, committed, {});

        // Step 3 — tamper
        tamperInEl.innerHTML = ORIG.map(function (tx, i) {
          return '<div style="margin-bottom:0.5rem"><span class="exw-label">tx ' + i + '</span>' +
            '<input class="exw-input" name="tx' + i + '" data-tx="' + i + '" value="' + tx + '"></div>';
        }).join('');
        function renderTamper() {
          computeTree(state.tamper).then(function (t) {
            renderTree(tree3El, t, { mark: function (kind, i) {
              if (kind === 'root') return t.root !== committed.root ? 'changed' : '';
              if (kind === 'inner') return t.inner[i] !== committed.inner[i] ? 'changed' : '';
              if (kind === 'leaf') return t.leaves[i] !== committed.leaves[i] ? 'changed' : '';
              return '';
            } });
            var broken = t.root !== committed.root;
            tamperResEl.innerHTML = '<div class="exw-result ' + (broken ? 'bad' : 'ok') + '"><div><b>' +
              (broken ? '✗ Root no longer matches the header' : '✓ Root matches the committed header') + '</b><span class="small">' +
              (broken
                ? 'committed ' + short(committed.root) + ' · now ' + short(t.root) + ' — any verifier rejects this block.'
                : 'No transaction has been changed, so the root is identical.') +
              '</span></div></div>';
          });
        }
        Array.prototype.forEach.call(tamperInEl.querySelectorAll('[data-tx]'), function (inp) {
          inp.addEventListener('input', function () { state.tamper[+inp.getAttribute('data-tx')] = inp.value; renderTamper(); });
        });
        renderTamper();

        // Step 4 — prove inclusion via a branch
        var picked = 0;
        function renderSpv() {
          var k = picked;
          var sibLeaf = k ^ 1;            // sibling leaf index
          var ii = k >> 1;                // index of the parent (inner) node
          var sibInner = ii ^ 1;          // sibling inner index
          renderTree(tree4El, committed, { mark: function (kind, i) {
            if (kind === 'leaf') return i === k ? 'proven' : (i === sibLeaf ? 'branch' : '');
            if (kind === 'inner') return i === sibInner ? 'branch' : (i === ii ? 'proven' : '');
            if (kind === 'root') return 'proven';
            return '';
          } });
          // Rebuild the root from tx k + the two branch hashes, preserving order.
          var leafPair = (k & 1) ? committed.leaves[sibLeaf] + committed.leaves[k] : committed.leaves[k] + committed.leaves[sibLeaf];
          sha256Hex(leafPair).then(function (parent) {
            var innerPair = (ii & 1) ? committed.inner[sibInner] + parent : parent + committed.inner[sibInner];
            return sha256Hex(innerPair);
          }).then(function (rebuilt) {
            var ok = rebuilt === committed.root;
            spvResEl.innerHTML = '<div class="exw-result ' + (ok ? 'ok' : 'bad') + '"><div><b>' +
              (ok ? '✓ Recomputed root matches' : '✗ Mismatch') + '</b><span class="small">' +
              'From tx ' + k + ' plus the branch [' + short(committed.leaves[sibLeaf]) + ', ' + short(committed.inner[sibInner]) + '] ' +
              'we rebuilt ' + short(rebuilt) + '. Just 2 hashes proved tx ' + k + ' is in the block — no other transaction needed.' +
              '</span></div></div>';
          });
        }
        pickEl.innerHTML = ORIG.map(function (_, i) {
          return '<button class="exw-btn ghost" data-pickbtn="' + i + '">Prove tx ' + i + '</button>';
        }).join('');
        Array.prototype.forEach.call(pickEl.querySelectorAll('[data-pickbtn]'), function (btn) {
          btn.addEventListener('click', function () {
            picked = +btn.getAttribute('data-pickbtn');
            Array.prototype.forEach.call(pickEl.querySelectorAll('[data-pickbtn]'), function (b) {
              b.classList.toggle('verify', b === btn); b.classList.toggle('ghost', b !== btn);
            });
            renderSpv();
          });
        });
        // default selection
        pickEl.querySelector('[data-pickbtn="0"]').classList.add('verify');
        pickEl.querySelector('[data-pickbtn="0"]').classList.remove('ghost');
        renderSpv();
      });
    },

    unmount: function (panel) { if (panel) panel.innerHTML = ''; }
  };
})();
