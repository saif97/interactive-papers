/* Interactive explainer: longest-chain.
 * Registers into window.EXPLAINERS (see _base.js). Built as interactive HTML
 * panels stepped with next/prev.
 *
 * Complements the inline §5 animation (#fig-net), which shows a block being
 * broadcast across the network. This explainer is about the CONFLICT case the
 * animation skips: when two valid blocks appear at the same height the chain
 * forks, and the rule "follow the longest chain" is what resolves it. The
 * reader extends one branch or the other and watches every node switch to
 * whichever becomes longer, orphaning the loser.
 *
 * Thesis: nodes always treat the longest valid chain as the truth, because the
 * longest chain is the one with the most proof-of-work behind it. A fork is
 * temporary: the next block breaks the tie, everyone adopts the longer branch,
 * and the orphaned block's transactions go back to waiting. With honest miners
 * holding the majority of hash power, the honest chain grows fastest and wins.
 */
(function () {
  window.EXPLAINERS = window.EXPLAINERS || {};

  var FORK = 3;   // height at which the chain forks (blocks 0..2 are shared)

  window.EXPLAINERS["longest-chain"] = {
    title: "The longest chain wins",
    blurb: "Nodes follow the longest valid chain; a fork is broken by the next block, and everyone switches to the longer branch.",

    mount: function (panel) {
      // a / b are the blocks each branch has BEYOND the shared prefix.
      var a = ['A'], b = ['B'];

      panel.innerHTML =
        '<div class="exw">' +
          '<div class="exw-nav">' +
            '<button data-prev disabled>← Prev</button>' +
            '<button data-next>Next →</button>' +
            '<span class="exw-stepname"></span>' +
            '<span class="exw-dots"></span>' +
          '</div>' +

          // Step 1 — the rule
          '<div class="exw-step" data-step>' +
            '<h3>1 · One chain is the truth: the longest one</h3>' +
            '<p>Every node keeps the same rule: the <b>longest valid chain</b> is the real history, and you always build on its tip. Each block points back to the one before it, so the chain has a single agreed order. Normally there is just one chain and nothing to decide.</p>' +
            '<div class="exw-lc" data-lc1></div>' +
          '</div>' +

          // Step 2 — a fork
          '<div class="exw-step" data-step>' +
            '<h3>2 · Two blocks at once: the chain forks</h3>' +
            '<p>Mining is a race, so sometimes two nodes find a valid block at the <b>same height</b> and broadcast them at nearly the same time. Now there are two branches of <b>equal length</b>. Nodes that heard block A first build on A; nodes that heard B first build on B. The network is split — for now.</p>' +
            '<div class="exw-lc" data-lc2></div>' +
          '</div>' +

          // Step 3 — break the tie
          '<div class="exw-step" data-step>' +
            '<h3>3 · The next block breaks the tie</h3>' +
            '<p>The split lasts only until the next block is found. Add a block to either branch: the moment one branch is longer, <b>every node switches to it</b> — even the nodes that were building the other one. The orphaned block is discarded and its transactions go back to waiting to be mined again.</p>' +
            '<div class="exw-row" style="gap:0.5rem;flex-wrap:wrap">' +
              '<button class="exw-btn" data-exta style="margin:0">Next block extends A</button>' +
              '<button class="exw-btn" data-extb style="margin:0">Next block extends B</button>' +
              '<button class="exw-btn ghost" data-lcreset style="margin:0">↻ Reset to the fork</button>' +
            '</div>' +
            '<div class="exw-lc" data-lc3 style="margin-top:0.8rem"></div>' +
            '<div data-lcresult style="margin-top:0.4rem"></div>' +
          '</div>' +

          // Step 4 — thesis
          '<div class="exw-step" data-step>' +
            '<h3>4 · Longest means most work — which means honest majority</h3>' +
            '<p class="exw-note">"Longest" really means <b>most <a href="#sec-4">proof-of-work</a></b>: each block is expensive, so the longer branch is the one more total work was spent on. That is why following it is safe — to overturn it an attacker would have to outpace all the honest miners and redo every block\'s work. As long as honest nodes hold the majority of hash power, the honest chain grows fastest and stays longest, so forks always resolve in its favor. The odds of a minority attacker ever catching up shrink exponentially with depth — the <a href="#sec-11">calculation</a> behind waiting for confirmations.</p>' +
          '</div>' +
        '</div>';

      // ── navigation ──
      var steps = Array.prototype.slice.call(panel.querySelectorAll('[data-step]'));
      var names = ['The rule', 'A fork', 'Break the tie', 'Why it works'];
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

      // ── renderers ──
      function blocks(count, opts) {
        opts = opts || {};
        var h = '';
        for (var i = 0; i < count; i++) {
          h += '<span class="exw-lcblk' + (opts.cls ? ' ' + opts.cls : '') + '">#' + (opts.from + i) + '</span>';
          if (i < count - 1 || opts.trailLink) h += '<span class="exw-lcarrow">←</span>';
        }
        return h;
      }

      // A single straight chain (step 1).
      function renderSingle(el) {
        el.innerHTML = '<div class="exw-lcrow active">' + blocks(5, { from: 0, cls: 'active' }) +
          '<span class="exw-lctag">longest · everyone builds here</span></div>';
      }

      // The fork view (steps 2 & 3). state = {a, b}. Drawn as a real fork: a
      // shared trunk (#0 ← #1 ← #2) and a bracket at #2 splitting into branch A
      // (top) and branch B (bottom), so the two branches visibly diverge from
      // the same block.
      function renderFork(el, withResult) {
        var lenA = FORK + a.length, lenB = FORK + b.length;
        var winner = lenA > lenB ? 'A' : (lenB > lenA ? 'B' : null);
        var aCls = winner === 'A' ? 'active' : (winner === 'B' ? 'stale' : 'tie');
        var bCls = winner === 'B' ? 'active' : (winner === 'A' ? 'stale' : 'tie');
        function branch(label, extra, cls) {
          var tag = cls === 'active' ? 'longest — adopted' : (cls === 'stale' ? 'orphaned' : 'tied');
          var blks = '';
          extra.forEach(function (_, i) {
            if (i > 0) blks += '<span class="exw-lcarrow">←</span>';
            blks += '<span class="exw-lcblk ' + cls + '">#' + (FORK + i) + label + '</span>';
          });
          return '<div class="exw-lcbranch ' + cls + '"><span class="exw-lcarrow">←</span>' + blks +
            '<span class="exw-lctag ' + cls + '">len ' + (FORK + extra.length) + ' · ' + tag + '</span></div>';
        }
        el.innerHTML =
          '<div class="exw-lctree">' +
            '<div class="exw-lctrunk">' +
              '<div class="exw-lctrunkrow">' + blocks(FORK, { from: 0, cls: 'shared' }) + '</div>' +
              '<span class="exw-lctag">shared history · forks at #2</span>' +
            '</div>' +
            '<div class="exw-lcbranches">' +
              branch('A', a, aCls) +
              branch('B', b, bCls) +
            '</div>' +
          '</div>';
        if (withResult) {
          var resEl = panel.querySelector('[data-lcresult]');
          if (!winner) {
            resEl.innerHTML = '<div class="exw-result"><div><b>Tie — both branches length ' + lenA + '</b><span class="small">Nodes are split until the next block lands. Add one to either branch.</span></div></div>';
          } else {
            resEl.innerHTML = '<div class="exw-result ok"><div><b>✓ Branch ' + winner + ' wins (length ' + Math.max(lenA, lenB) + ')</b><span class="small">Every node, including those that had built branch ' + (winner === 'A' ? 'B' : 'A') + ', switches to the longer chain. The orphaned block\'s transactions return to the pool.</span></div></div>';
          }
        }
      }

      // step 1 & 2 are static
      renderSingle(panel.querySelector('[data-lc1]'));
      renderFork(panel.querySelector('[data-lc2]'), false);

      // step 3 interactions
      var lc3 = panel.querySelector('[data-lc3]');
      function refresh3() { renderFork(lc3, true); }
      panel.querySelector('[data-exta]').addEventListener('click', function () { a.push('A'); refresh3(); });
      panel.querySelector('[data-extb]').addEventListener('click', function () { b.push('B'); refresh3(); });
      panel.querySelector('[data-lcreset]').addEventListener('click', function () { a = ['A']; b = ['B']; refresh3(); });
      refresh3();

      show(0);
    },

    unmount: function (panel) { if (panel) panel.innerHTML = ''; }
  };
})();
