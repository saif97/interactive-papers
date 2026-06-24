/* Interactive explainer: incentive (also keyed to transaction-fee — both §6
 * keywords open this panel).
 * Registers into window.EXPLAINERS (see _base.js). Built as interactive HTML
 * panels stepped with next/prev. The supply math is run for real.
 *
 * §6 has no inline figure, so this is the first interactive for the economics.
 * The reader steps through the halving schedule and watches the coin supply
 * approach its fixed cap, then sets a transaction's fee and sees the miner's
 * income shift from the block reward to fees as the reward decays to zero.
 *
 * Thesis: miners are paid by the block reward — newly minted coins in the
 * block's first transaction — which both rewards the work and distributes coins
 * with no central issuer. The reward halves on a fixed schedule toward a hard
 * cap of 21 million, after which transaction fees alone pay miners, so the
 * currency becomes inflation-free while miners still have a reason to secure it.
 */
(function () {
  window.EXPLAINERS = window.EXPLAINERS || {};

  var BLOCKS_PER_ERA = 210000;   // ~4 years at one block / 10 min
  var BASE_REWARD = 50;
  var CAP = 21000000;

  function reward(era) { return BASE_REWARD / Math.pow(2, era); }
  // Coins minted through the END of a given era, if every era is fully mined.
  function mintedThrough(era) { return CAP - (BLOCKS_PER_ERA * BASE_REWARD) / Math.pow(2, era); }
  function fmt(n) { return n.toLocaleString('en-US', { maximumFractionDigits: n < 1 ? 8 : 2 }); }

  window.EXPLAINERS["incentive"] = {
    title: "Incentive: who pays the miners",
    blurb: "Miners earn newly minted coins that halve toward a fixed cap; after that, transaction fees take over.",

    mount: function (panel) {
      var state = { era: 0, fee: 0.02 };

      panel.innerHTML =
        '<div class="exw">' +
          '<div class="exw-nav">' +
            '<button data-prev disabled>← Prev</button>' +
            '<button data-next>Next →</button>' +
            '<span class="exw-stepname"></span>' +
            '<span class="exw-dots"></span>' +
          '</div>' +

          // Step 1 — the coinbase
          '<div class="exw-step" data-step>' +
            '<h3>1 · The first transaction mints new coins for the miner</h3>' +
            '<p>Every block starts with one special transaction — the <b>coinbase</b> — that creates brand-new coins out of nothing and pays them to whoever mined the block. This is how coins enter circulation with no bank to issue them, and it is the reward that makes spending electricity on <a href="#sec-4">proof-of-work</a> worthwhile.</p>' +
            '<div class="exw-card">' +
              '<div class="bk-head">block · first transaction</div>' +
              '<div class="exw-cb"><span class="exw-cb-from">— no input (new coins)</span><span class="exw-lcarrow">→</span><span class="exw-cb-to">+50 BTC to the miner</span></div>' +
              '<p class="small" style="margin:0.5rem 0 0">Like gold miners spending effort to add gold to circulation — here the effort is CPU time and electricity.</p>' +
            '</div>' +
          '</div>' +

          // Step 2 — halving toward the cap
          '<div class="exw-step" data-step>' +
            '<h3>2 · The reward halves on a schedule, toward a hard cap</h3>' +
            '<p>The reward is not constant. Every <b>210,000 blocks</b> — roughly four years — it <b>halves</b>: 50, then 25, then 12.5, and so on. Advance the schedule and watch the new coins per block shrink while the total in circulation closes in on its fixed ceiling of <b>21 million</b> and never passes it.</p>' +
            '<div class="exw-row" style="gap:0.5rem;flex-wrap:wrap">' +
              '<button class="exw-btn" data-halve style="margin:0">Next halving →</button>' +
              '<button class="exw-btn ghost" data-erareset style="margin:0">↻ Back to the start</button>' +
            '</div>' +
            '<div class="exw-card" style="margin-top:0.8rem" data-erastat></div>' +
          '</div>' +

          // Step 3 — fees take over
          '<div class="exw-step" data-step>' +
            '<h3>3 · As the reward fades, fees pay the miners</h3>' +
            '<p>A transaction may hand the miner less than it spends: if its <b>outputs are worth less than its inputs</b>, the leftover is a <b>transaction fee</b> the miner keeps, on top of the block reward. Move the fee, and use the halving control to jump far into the future — once the reward rounds to zero, fees are the <i>entire</i> incentive, and the system runs inflation-free.</p>' +
            '<div class="exw-controls2">' +
              '<label>transaction fee = <b data-feev>0.02</b> BTC<input type="range" data-fee min="0" max="0.2" step="0.005" value="0.02"></label>' +
              '<label>era<span class="small" data-erabadge style="font-family:var(--serif)">0 · reward 50</span><button class="exw-btn ghost" data-halve2 style="margin-top:0.2rem;padding:0.2rem 0.5rem">halve →</button></label>' +
            '</div>' +
            '<div class="exw-card" style="margin-top:0.8rem" data-feestat></div>' +
          '</div>' +

          // Step 4 — thesis
          '<div class="exw-step" data-step>' +
            '<h3>4 · Why this keeps the network honest and sound</h3>' +
            '<p class="exw-note">The incentive does two jobs. It <b>distributes</b> coins fairly — work, don\'t print — and it <b>aligns</b> miners with the network: an attacker with the majority of hash power earns more by mining honestly than by defrauding people and destroying confidence in the coins he holds. The reward\'s decay to a fixed 21-million cap makes the money supply predictable, and <a href="#sec-9">transaction fees</a> keep miners paid afterward. Fees come from the gap between a transaction\'s inputs and outputs — the same <a href="#sec-2">coin</a> mechanics, now funding security instead of inflation.</p>' +
          '</div>' +
        '</div>';

      // ── navigation ──
      var steps = Array.prototype.slice.call(panel.querySelectorAll('[data-step]'));
      var names = ['The coinbase', 'Halving', 'Fees take over', 'Why it works'];
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

      // ── rendering ──
      var eraStat = panel.querySelector('[data-erastat]');
      var feeStat = panel.querySelector('[data-feestat]');
      var feeVal = panel.querySelector('[data-feev]');
      var eraBadge = panel.querySelector('[data-erabadge]');

      function bar(label, val, max, color) {
        var w = Math.max(1, Math.round(val / max * 100));
        return '<div class="exw-barrow"><span class="exw-barlab">' + label + '</span>' +
          '<span class="exw-bartrack"><span class="exw-bar" style="width:' + w + '%;background:' + color + '"></span></span>' +
          '<span class="exw-barval">' + Math.round(val / max * 100) + '%</span></div>';
      }

      function renderEra() {
        var r = reward(state.era);
        var minted = mintedThrough(state.era);
        var years = state.era * 4;
        eraStat.innerHTML =
          '<div class="exw-statgrid">' +
            '<div><span class="exw-label">halving era</span><b class="exw-big">' + state.era + '</b><span class="small">~year ' + years + '</span></div>' +
            '<div><span class="exw-label">reward / block</span><b class="exw-big">' + fmt(r) + '</b><span class="small">BTC</span></div>' +
            '<div><span class="exw-label">coins in circulation</span><b class="exw-big">' + fmt(minted) + '</b><span class="small">of 21,000,000</span></div>' +
          '</div>' +
          bar('toward the 21M cap', minted, CAP, 'var(--ix)') +
          '<p class="small" style="margin:0.5rem 0 0">' +
            (r < 0.01
              ? 'The reward has effectively reached zero — no meaningful new coins are minted. Supply is fixed.'
              : 'Each halving cuts new issuance in half, so the supply curve flattens as it approaches the cap.') +
          '</p>';
      }

      function renderFee() {
        var r = reward(state.era);
        var total = r + state.fee;
        var feePctOfPay = total > 0 ? (state.fee / total * 100) : 0;
        feeVal.textContent = state.fee.toFixed(3);
        eraBadge.textContent = state.era + ' · reward ' + fmt(r);
        feeStat.innerHTML =
          '<div class="exw-statgrid">' +
            '<div><span class="exw-label">block reward</span><b class="exw-big">' + fmt(r) + '</b><span class="small">BTC (era ' + state.era + ')</span></div>' +
            '<div><span class="exw-label">+ transaction fee</span><b class="exw-big">' + state.fee.toFixed(3) + '</b><span class="small">BTC</span></div>' +
            '<div><span class="exw-label">= miner earns</span><b class="exw-big" style="color:var(--good)">' + fmt(total) + '</b><span class="small">BTC this block</span></div>' +
          '</div>' +
          '<p class="small" style="margin:0.5rem 0 0">' +
            (r < 0.01
              ? '<b class="ok">Reward is zero — the fee is the miner\'s entire income.</b> This is the inflation-free end state: no new coins, miners paid purely by fees.'
              : 'The fee is ' + feePctOfPay.toFixed(1) + '% of the miner\'s income right now; keep halving and it becomes everything.') +
          '</p>';
      }

      panel.querySelector('[data-halve]').addEventListener('click', function () { state.era++; renderEra(); renderFee(); });
      panel.querySelector('[data-erareset]').addEventListener('click', function () { state.era = 0; renderEra(); renderFee(); });
      panel.querySelector('[data-halve2]').addEventListener('click', function () { state.era++; renderEra(); renderFee(); });
      panel.querySelector('[data-fee]').addEventListener('input', function (e) { state.fee = parseFloat(e.target.value); renderFee(); });

      renderEra();
      renderFee();
      show(0);
    },

    unmount: function (panel) { if (panel) panel.innerHTML = ''; }
  };

  // Both §6 keywords open this one panel.
  window.EXPLAINERS["transaction-fee"] = window.EXPLAINERS["incentive"];
})();
