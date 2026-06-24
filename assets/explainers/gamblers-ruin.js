/* Interactive explainer: gamblers-ruin (also aliased to binomial-random-walk
 * and poisson — all three keywords in §11 open this one panel).
 * Registers into window.EXPLAINERS (see _base.js). Built as interactive HTML
 * panels stepped with next/prev.
 *
 * Complements the inline §11 calculator (#calc), which plots the formula's
 * OUTPUT as you slide q and z. This explainer shows the intuition the
 * calculator skips: the honest-vs-attacker race is a random walk (+1 when an
 * honest block is found, -1 when the attacker finds one), the attacker "wins"
 * only if the walk ever returns to zero, and running many races by hand makes
 * the closed-form law (q/p)^z appear empirically. Math is run for real:
 * Monte-Carlo simulation in the browser, compared against the formula.
 *
 * Thesis: the chance an attacker ever catches up from z confirmations behind is
 * (q/p)^z whenever honest miners hold the majority (q < p). It falls off
 * exponentially with z, which is exactly why waiting for confirmations makes a
 * payment safe — and why the guarantee collapses as q approaches one half.
 */
(function () {
  window.EXPLAINERS = window.EXPLAINERS || {};

  function pct(x) {
    if (x >= 0.999999) return '100%';
    if (x <= 0) return '0%';
    if (x < 0.0001) return (x * 100).toExponential(2) + '%';
    return (x * 100).toFixed(x < 0.01 ? 4 : 2) + '%';
  }

  // One race. lead starts at z (honest chain is z ahead). Each block: honest
  // extends (+1) with prob p = 1-q, attacker extends (-1) with prob q. The
  // attacker catches up if lead ever reaches 0. Cap steps so a near-tie returns.
  function simulateRace(q, z, cap) {
    var lead = z, steps = 0;
    while (steps < cap) {
      if (lead <= 0) return true;
      lead += (Math.random() < (1 - q)) ? 1 : -1;
      steps++;
    }
    return lead <= 0;
  }

  function theoretical(q, z) {
    var p = 1 - q;
    return q >= p ? 1 : Math.pow(q / p, z);
  }

  window.EXPLAINERS["gamblers-ruin"] = {
    title: "Gambler's ruin: can the attacker catch up?",
    blurb: "The honest-vs-attacker race is a random walk; the chance of ever catching up from z behind is (q/p)^z.",

    mount: function (panel) {
      var state = { q: 0.3, z: 5 };

      panel.innerHTML =
        '<div class="exw">' +
          '<div class="exw-nav">' +
            '<button data-prev disabled>← Prev</button>' +
            '<button data-next>Next →</button>' +
            '<span class="exw-stepname"></span>' +
            '<span class="exw-dots"></span>' +
          '</div>' +

          // Step 1 — the race is a random walk
          '<div class="exw-step" data-step>' +
            '<h3>1 · The race is a random walk</h3>' +
            '<p>Two chains grow block by block: the honest one and the attacker\'s secret one. Track the honest chain\'s <b>lead</b>. Every time an honest miner finds the next block the lead goes <b>+1</b>; every time the attacker finds it the lead goes <b>−1</b>. The attacker only wins if the lead ever falls to <b>0</b> — he draws level and can swap in his chain. Step it by hand.</p>' +
            '<div class="exw-walk">' +
              '<div class="exw-leadbox">honest lead <span class="exw-lead" data-lead>3</span></div>' +
              '<div class="exw-track" data-track></div>' +
              '<div data-walkmsg class="exw-walkmsg"></div>' +
            '</div>' +
            '<div class="exw-row" style="gap:0.5rem;flex-wrap:wrap;margin-top:0.6rem">' +
              '<button class="exw-btn verify" data-up style="margin:0">Honest finds a block (+1)</button>' +
              '<button class="exw-btn danger" data-down style="margin:0">Attacker finds a block (−1)</button>' +
              '<button class="exw-btn ghost" data-walkreset style="margin:0">↻ Reset to +3</button>' +
            '</div>' +
          '</div>' +

          // Step 2 — drift: who is favored
          '<div class="exw-step" data-step>' +
            '<h3>2 · With honest majority, the walk drifts away from zero</h3>' +
            '<p>The walk is not a fair coin. <b>q</b> is the attacker\'s share of the hash power, so honest blocks come with probability <b>p = 1 − q</b>. While q is below one half, each step is more likely +1 than −1, so the lead tends to <b>grow</b> — the attacker has to fight an upstream current to reach zero. Run a single full race from z blocks behind and see how it usually ends.</p>' +
            '<div class="exw-controls2">' +
              '<label>attacker share q = <b data-qv>0.30</b><input type="range" data-q min="0.01" max="0.49" step="0.01" value="0.30"></label>' +
              '<label>start z = <b data-zv>5</b> behind<input type="range" data-z min="1" max="12" step="1" value="5"></label>' +
            '</div>' +
            '<button class="exw-btn" data-race style="margin-top:0.6rem">▶ Run one race</button>' +
            '<div class="exw-walk" style="margin-top:0.6rem">' +
              '<div class="exw-track" data-racetrack></div>' +
              '<div data-raceresult class="exw-walkmsg"></div>' +
            '</div>' +
          '</div>' +

          // Step 3 — Monte Carlo vs the formula
          '<div class="exw-step" data-step>' +
            '<h3>3 · Run thousands of races — the formula appears</h3>' +
            '<p>One race is luck. Run <b>10,000</b> of them at the same q and z, count how often the attacker <b>ever</b> catches up, and compare that measured fraction to the closed form the paper derives: <span class="exw-mono">(q/p)<sup>z</sup></span>. They land on top of each other — the formula is just the long-run odds of this walk.</p>' +
            '<div class="exw-controls2">' +
              '<label>attacker share q = <b data-qv>0.30</b><input type="range" data-q min="0.01" max="0.49" step="0.01" value="0.30"></label>' +
              '<label>confirmations z = <b data-zv>5</b><input type="range" data-z min="1" max="12" step="1" value="5"></label>' +
            '</div>' +
            '<button class="exw-btn" data-mc style="margin-top:0.6rem">▶ Run 10,000 races</button>' +
            '<div data-mcresult style="margin-top:0.8rem"></div>' +
          '</div>' +

          // Step 4 — thesis
          '<div class="exw-step" data-step>' +
            '<h3>4 · Why confirmations make a payment safe</h3>' +
            '<p class="exw-note">As long as honest miners hold the majority (q &lt; p), the chance an attacker ever catches up from z confirmations behind is <span class="exw-mono">(q/p)<sup>z</sup></span>, which shrinks <b>exponentially</b> as z grows — so waiting a few blocks drives the risk to near zero. The catch is the ratio: as q climbs toward one half, q/p approaches 1 and you need far more confirmations for the same safety, until at q = ½ the guarantee collapses entirely. The full <a href="#sec-11">calculation</a> refines this with a <a href="#sec-11">Poisson</a> term for the head start the attacker makes while you wait, but the exponential core is this random walk. It is also why the network follows the <a href="#sec-5">longest chain</a>: honest majority means the honest chain almost surely stays ahead.</p>' +
          '</div>' +
        '</div>';

      // ── navigation ──
      var steps = Array.prototype.slice.call(panel.querySelectorAll('[data-step]'));
      var names = ['Random walk', 'Drift', 'Simulate', 'Thesis'];
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

      // ── step 1: manual random walk ──
      var lead = 3, walkSteps = [];
      var leadEl = panel.querySelector('[data-lead]');
      var trackEl = panel.querySelector('[data-track]');
      var walkMsg = panel.querySelector('[data-walkmsg]');
      function renderWalk() {
        leadEl.textContent = lead;
        leadEl.className = 'exw-lead' + (lead <= 0 ? ' caught' : '');
        trackEl.innerHTML = walkSteps.map(function (s) {
          return '<span class="exw-chip ' + (s > 0 ? 'up' : 'down') + '">' + (s > 0 ? '+1' : '−1') + '</span>';
        }).join('');
        if (lead <= 0) {
          walkMsg.innerHTML = '<span class="bad">✗ Lead hit 0 — the attacker drew level and wins the race.</span>';
        } else {
          walkMsg.innerHTML = 'Honest chain is <b>' + lead + '</b> block' + (lead === 1 ? '' : 's') + ' ahead. The attacker needs ' + lead + ' more than the honest miners to reach 0.';
        }
      }
      panel.querySelector('[data-up]').addEventListener('click', function () { lead += 1; walkSteps.push(1); renderWalk(); });
      panel.querySelector('[data-down]').addEventListener('click', function () { lead -= 1; walkSteps.push(-1); renderWalk(); });
      panel.querySelector('[data-walkreset]').addEventListener('click', function () { lead = 3; walkSteps = []; renderWalk(); });
      renderWalk();

      // ── shared slider wiring for steps 2 & 3 (each step has its own pair) ──
      function wireSliders(stepEl) {
        var qIn = stepEl.querySelector('[data-q]');
        var zIn = stepEl.querySelector('[data-z]');
        var qOut = stepEl.querySelector('[data-qv]');
        var zOut = stepEl.querySelector('[data-zv]');
        function sync() {
          state.q = parseFloat(qIn.value);
          state.z = parseInt(zIn.value, 10);
          qOut.textContent = state.q.toFixed(2);
          zOut.textContent = state.z;
        }
        qIn.addEventListener('input', sync);
        zIn.addEventListener('input', sync);
        sync();
        return { qIn: qIn, zIn: zIn };
      }

      // ── step 2: one full race ──
      var step2 = steps[1];
      wireSliders(step2);
      var raceTrack = panel.querySelector('[data-racetrack]');
      var raceResult = panel.querySelector('[data-raceresult]');
      panel.querySelector('[data-race]').addEventListener('click', function () {
        var q = state.q, z = state.z, l = z, path = [], cap = 400;
        while (path.length < cap && l > 0) { var up = Math.random() < (1 - q); l += up ? 1 : -1; path.push(up ? 1 : -1); }
        var caught = l <= 0;
        // show at most the last ~60 steps so the track never overflows
        var shown = path.slice(-60);
        raceTrack.innerHTML = (path.length > shown.length ? '<span class="exw-chip more">…' + (path.length - shown.length) + ' earlier</span>' : '') +
          shown.map(function (s) { return '<span class="exw-chip ' + (s > 0 ? 'up' : 'down') + '">' + (s > 0 ? '+' : '−') + '</span>'; }).join('');
        raceResult.innerHTML = caught
          ? '<span class="bad">✗ Attacker caught up</span> after ' + path.length + ' blocks — a lucky run from ' + z + ' behind.'
          : '<span class="ok">✓ Attacker buried</span> — the honest lead ran away after ' + path.length + ' blocks. Re-run: with q=' + q.toFixed(2) + ', this is the usual outcome.';
      });

      // ── step 3: Monte Carlo vs formula ──
      var step3 = steps[2];
      wireSliders(step3);
      var mcResult = panel.querySelector('[data-mcresult]');
      panel.querySelector('[data-mc]').addEventListener('click', function () {
        var q = state.q, z = state.z, N = 10000, hits = 0;
        for (var i = 0; i < N; i++) { if (simulateRace(q, z, 5000)) hits++; }
        var emp = hits / N;
        var theo = theoretical(q, z);
        var scale = Math.max(emp, theo, 0.0001);
        function bar(label, val, color) {
          var w = Math.max(2, Math.round(val / scale * 100));
          return '<div class="exw-barrow"><span class="exw-barlab">' + label + '</span>' +
            '<span class="exw-bartrack"><span class="exw-bar" style="width:' + w + '%;background:' + color + '"></span></span>' +
            '<span class="exw-barval">' + pct(val) + '</span></div>';
        }
        mcResult.innerHTML =
          '<div class="exw-card">' +
            bar('Measured (' + hits + '/' + N + ')', emp, 'var(--ix)') +
            bar('Formula (q/p)^z', theo, 'var(--good)') +
            '<p class="small" style="margin:0.6rem 0 0">q/p = ' + (q / (1 - q)).toFixed(3) + ', raised to z = ' + z + '. The measured fraction tracks the formula; both fall off exponentially as you raise z.</p>' +
          '</div>';
      });

      show(0);
    },

    unmount: function (panel) { if (panel) panel.innerHTML = ''; }
  };

  // One explainer, three keywords: the random-walk framing and the Poisson
  // refinement both live here, so all three §11 terms open this panel.
  window.EXPLAINERS["binomial-random-walk"] = window.EXPLAINERS["gamblers-ruin"];
  window.EXPLAINERS["poisson"] = window.EXPLAINERS["gamblers-ruin"];
})();
