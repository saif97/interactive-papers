/* Interactive explainer: one-cpu-one-vote (also keyed to cpu-power — both §4
 * keywords open this panel).
 * Registers into window.EXPLAINERS (see _base.js). Built as interactive HTML
 * panels stepped with next/prev. The vote-share math runs for real.
 *
 * §4's inline widget (#miner) is about mining one block. This explainer is
 * about the other half of that paragraph: why the majority is measured in CPU
 * power, not identities. The reader spins up fake identities and watches them
 * dominate an identity vote for free — then switches to a work-weighted vote
 * and watches the fakes count for nothing.
 *
 * Thesis: counting votes by identity is hopeless, because anyone can forge
 * unlimited identities at no cost (a Sybil attack). Bitcoin instead weights
 * votes by hash power — one-CPU-one-vote — and hash power cannot be faked, only
 * bought and run. So the majority decision (the longest chain) is secure as
 * long as honest participants control most of the actual hash power.
 */
(function () {
  window.EXPLAINERS = window.EXPLAINERS || {};

  var HONEST = 100;   // honest participants, each with one identity and one CPU

  window.EXPLAINERS["one-cpu-one-vote"] = {
    title: "One-CPU-one-vote",
    blurb: "Votes are weighted by hash power, not identities — because identities are free to fake and hash power is not.",

    mount: function (panel) {
      var state = { fakes: 0, attackerCPU: 30 };

      panel.innerHTML =
        '<div class="exw">' +
          '<div class="exw-nav">' +
            '<button data-prev disabled>← Prev</button>' +
            '<button data-next>Next →</button>' +
            '<span class="exw-stepname"></span>' +
            '<span class="exw-dots"></span>' +
          '</div>' +

          // Step 1 — identity voting is forgeable
          '<div class="exw-step" data-step>' +
            '<h3>1 · Voting by identity is hopeless</h3>' +
            '<p>Suppose the network decided things by <b>one vote per identity</b> — one per node, or per IP address. There are ' + HONEST + ' honest participants. But an attacker can spawn fake identities for almost nothing. Drag to create fakes and watch one attacker take the majority for free.</p>' +
            '<div class="exw-controls2">' +
              '<label>fake identities the attacker creates = <b data-fakev>0</b><input type="range" data-fakes min="0" max="5000" step="50" value="0"></label>' +
            '</div>' +
            '<div class="exw-card" style="margin-top:0.6rem" data-idstat></div>' +
          '</div>' +

          // Step 2 — work voting ignores fakes
          '<div class="exw-step" data-step>' +
            '<h3>2 · Voting by work ignores the fakes</h3>' +
            '<p>Now weight each vote by <b>hash power</b> instead — one-CPU-one-vote. A fake identity has no CPU behind it, so it casts no vote. The attacker here runs ' + 'real hardware worth <b data-cpulabel>30</b> CPUs against the honest ' + HONEST + '. Drag the same fakes slider: the identity vote balloons, but the work vote does not move.</p>' +
            '<div class="exw-controls2">' +
              '<label>fake identities = <b data-fakev2>0</b><input type="range" data-fakes2 min="0" max="5000" step="50" value="0"></label>' +
              '<label>attacker\'s real CPUs = <b data-cpuv>30</b><input type="range" data-cpu min="0" max="100" step="1" value="30"></label>' +
            '</div>' +
            '<div class="exw-card" style="margin-top:0.6rem" data-cmpstat></div>' +
          '</div>' +

          // Step 3 — majority hash power decides
          '<div class="exw-step" data-step>' +
            '<h3>3 · So the real contest is hash power</h3>' +
            '<p>Because fakes are worthless, the only way to swing the vote is to actually own more hash power. Each found block is one vote, cast by spending work, and the majority\'s chain grows fastest. Set the attacker\'s share of total hash power and see who controls the chain.</p>' +
            '<div class="exw-controls2">' +
              '<label>attacker\'s share of all hash power = <b data-qv>30</b>%<input type="range" data-q min="0" max="70" step="1" value="30"></label>' +
            '</div>' +
            '<div class="exw-card" style="margin-top:0.6rem" data-qstat></div>' +
          '</div>' +

          // Step 4 — thesis
          '<div class="exw-step" data-step>' +
            '<h3>4 · Unforgeable votes make the majority real</h3>' +
            '<p class="exw-note">Identities are free, so any vote you can fake is worthless for deciding a shared history. <a href="#sec-4">Proof-of-work</a> ties each vote to something that <b>can\'t</b> be faked — spent energy — so the majority decision, expressed as the <a href="#sec-5">longest chain</a>, reflects real hash power. As long as honest participants hold most of it, the honest chain wins, and a minority attacker\'s odds of overtaking it <a href="#sec-11">shrink exponentially</a> with each block. That is the whole point of one-CPU-one-vote.</p>' +
          '</div>' +
        '</div>';

      // ── navigation ──
      var steps = Array.prototype.slice.call(panel.querySelectorAll('[data-step]'));
      var names = ['Identity vote', 'Work vote', 'Hash power', 'Why it works'];
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

      function bar(label, val, color) {
        var w = Math.max(1, Math.min(100, Math.round(val)));
        return '<div class="exw-barrow"><span class="exw-barlab">' + label + '</span>' +
          '<span class="exw-bartrack"><span class="exw-bar" style="width:' + w + '%;background:' + color + '"></span></span>' +
          '<span class="exw-barval">' + Math.round(val) + '%</span></div>';
      }

      // ── elements ──
      var idStat = panel.querySelector('[data-idstat]');
      var cmpStat = panel.querySelector('[data-cmpstat]');
      var qStat = panel.querySelector('[data-qstat]');
      var fakeV = panel.querySelector('[data-fakev]');
      var fakeV2 = panel.querySelector('[data-fakev2]');
      var cpuV = panel.querySelector('[data-cpuv]');
      var cpuLabel = panel.querySelector('[data-cpulabel]');
      var qV = panel.querySelector('[data-qv]');

      function renderId() {
        fakeV.textContent = state.fakes;
        var atk = (1 + state.fakes) / (1 + state.fakes + HONEST) * 100;
        idStat.innerHTML =
          bar('attacker (1 real + ' + state.fakes + ' fake)', atk, atk >= 50 ? 'var(--bad)' : 'var(--ix)') +
          bar('honest (' + HONEST + ')', 100 - atk, 'var(--good)') +
          '<p class="small" style="margin:0.5rem 0 0">Cost to the attacker: about <b>$0</b> — identities are free to create. ' +
          (atk >= 50 ? '<b class="bad">The attacker now controls the majority and the vote is meaningless.</b>' : 'Keep dragging.') + '</p>';
      }

      function renderCmp() {
        fakeV2.textContent = state.fakes;
        cpuV.textContent = state.attackerCPU;
        if (cpuLabel) cpuLabel.textContent = state.attackerCPU;
        var idAtk = (1 + state.fakes) / (1 + state.fakes + HONEST) * 100;
        var workAtk = state.attackerCPU / (state.attackerCPU + HONEST) * 100;
        cmpStat.innerHTML =
          bar('attacker share · identity vote', idAtk, 'var(--bad)') +
          bar('attacker share · work vote', workAtk, workAtk >= 50 ? 'var(--bad)' : 'var(--good)') +
          '<p class="small" style="margin:0.5rem 0 0">The fakes inflate the identity vote to ' + Math.round(idAtk) + '% but leave the work vote at ' +
          Math.round(workAtk) + '% — work counts only real CPUs. To move the work vote the attacker must buy and run actual hardware.</p>';
      }

      function renderQ() {
        var q = parseInt(qV.textContent, 10);
        var honest = 100 - q;
        var safe = q < 50;
        qStat.innerHTML =
          bar('attacker hash power', q, safe ? 'var(--ix)' : 'var(--bad)') +
          bar('honest hash power', honest, 'var(--good)') +
          '<div class="exw-result ' + (safe ? 'ok' : 'bad') + '" style="margin-top:0.6rem"><div><b>' +
          (safe
            ? '✓ Honest majority — the honest chain grows fastest'
            : '✗ Attacker majority — the chain can be rewritten') + '</b><span class="small">' +
          (safe
            ? 'With ' + honest + '% of the work, honest miners win the block race on average, so the longest chain stays honest. A minority attacker\'s catch-up odds fall exponentially with depth.'
            : 'At ' + q + '% the attacker produces blocks faster than everyone else and can outpace and replace the honest chain. This is the 50% threshold the whole design depends on.') +
          '</span></div></div>';
      }

      panel.querySelector('[data-fakes]').addEventListener('input', function (e) { state.fakes = +e.target.value; renderId(); renderCmp(); });
      panel.querySelector('[data-fakes2]').addEventListener('input', function (e) { state.fakes = +e.target.value; renderId(); renderCmp(); });
      panel.querySelector('[data-cpu]').addEventListener('input', function (e) { state.attackerCPU = +e.target.value; renderCmp(); });
      panel.querySelector('[data-q]').addEventListener('input', function (e) { qV.textContent = e.target.value; renderQ(); });

      renderId();
      renderCmp();
      renderQ();
      show(0);
    },

    unmount: function (panel) { if (panel) panel.innerHTML = ''; }
  };

  // Both §4 keywords open this one panel.
  window.EXPLAINERS["cpu-power"] = window.EXPLAINERS["one-cpu-one-vote"];
})();
