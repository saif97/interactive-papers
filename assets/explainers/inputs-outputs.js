/* Interactive explainer: inputs-outputs.
 * Registers into window.EXPLAINERS (see _base.js). Built as interactive HTML
 * panels stepped with next/prev. The transaction arithmetic runs for real.
 *
 * Complements the inline §9 figure (#fig-io), a static diagram of one
 * transaction's inputs and outputs. Here the reader BUILDS a transaction:
 * pick which coins to spend, set the payment, and watch the change and the
 * miner's fee compute live — including the failure case where the chosen
 * inputs don't cover the payment.
 *
 * Thesis: a transaction does not edit account balances. It consumes whole
 * earlier outputs as its inputs and creates new outputs — usually a payment
 * and the change back to the sender. Inputs must cover the outputs, and
 * whatever is left over (inputs minus outputs) is the fee the miner collects.
 */
(function () {
  window.EXPLAINERS = window.EXPLAINERS || {};

  function fmt(n) { return (Math.round(n * 1e8) / 1e8).toString(); }

  window.EXPLAINERS["inputs-outputs"] = {
    title: "Inputs and outputs",
    blurb: "A transaction spends whole earlier coins as inputs and creates new outputs — a payment, the change, and a fee.",

    mount: function (panel) {
      // Coins you already own (each is an output of some earlier transaction).
      var state = {
        chunks: [{ amt: 5, sel: true }, { amt: 2, sel: false }, { amt: 0.5, sel: false }],
        payment: 1.5,
        fee: 0.01
      };

      panel.innerHTML =
        '<div class="exw">' +
          '<div class="exw-nav">' +
            '<button data-prev disabled>← Prev</button>' +
            '<button data-next>Next →</button>' +
            '<span class="exw-stepname"></span>' +
            '<span class="exw-dots"></span>' +
          '</div>' +

          // Step 1 — coins are chunks
          '<div class="exw-step" data-step>' +
            '<h3>1 · You hold coins as chunks, not a balance</h3>' +
            '<p>There is no account with a running balance. You own specific <b>outputs</b> from earlier transactions — discrete chunks of value. You cannot spend half a chunk: to pay, you hand over whole chunks as <b>inputs</b> and take any difference back as change. Here is your wallet.</p>' +
            '<div class="exw-chunks" data-wallet></div>' +
          '</div>' +

          // Step 2 — build the transaction
          '<div class="exw-step" data-step>' +
            '<h3>2 · A transaction turns inputs into outputs</h3>' +
            '<p>To pay someone, pick which coins to spend as <b>inputs</b> and set the amount. The transaction creates at most two <b>outputs</b>: the payment to the payee, and the <b>change</b> returned to you. Pick coins that cover the payment — if they don\'t, you\'ll see it fail.</p>' +
            '<div class="exw-row" style="gap:0.4rem;flex-wrap:wrap;align-items:center">' +
              '<span class="exw-label" style="margin:0">spend coins:</span><span data-pick></span>' +
              '<span class="exw-label" style="margin:0 0 0 0.6rem">pay</span>' +
              '<input class="exw-input" data-pay type="number" min="0" step="0.1" value="1.5" style="width:6rem;margin:0"> BTC' +
            '</div>' +
            '<div data-tx2 style="margin-top:0.8rem"></div>' +
          '</div>' +

          // Step 3 — the leftover is the fee
          '<div class="exw-step" data-step>' +
            '<h3>3 · Whatever is left over is the fee</h3>' +
            '<p>The outputs do not have to add up to the inputs. If you make the outputs worth a little <b>less</b> than the inputs, the gap — <span class="exw-mono">inputs − outputs</span> — is the <b>transaction fee</b>, which the miner who includes your transaction collects. Raise the fee and watch it come out of your change.</p>' +
            '<div class="exw-controls2">' +
              '<label>fee = <b data-feev>0.01</b> BTC<input type="range" data-fee min="0" max="1" step="0.01" value="0.01"></label>' +
            '</div>' +
            '<div data-tx3 style="margin-top:0.8rem"></div>' +
          '</div>' +

          // Step 4 — thesis
          '<div class="exw-step" data-step>' +
            '<h3>4 · Value flows by reference, never by editing balances</h3>' +
            '<p class="exw-note">A transaction consumes whole earlier outputs and produces new ones — a payment and the change — so value is split and combined by <b>referencing</b> prior coins, not by editing any balance. The inputs must cover the outputs, and the leftover is the fee. That fee is exactly what funds the <a href="#sec-6">incentive</a> once the block reward fades, and each output becomes a link in the next owner\'s <a href="#sec-2">chain of signatures</a>.</p>' +
          '</div>' +
        '</div>';

      // ── navigation ──
      var steps = Array.prototype.slice.call(panel.querySelectorAll('[data-step]'));
      var names = ['Coins are chunks', 'Build a tx', 'The fee', 'Thesis'];
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

      // ── elements ──
      var walletEl = panel.querySelector('[data-wallet]');
      var pickEl = panel.querySelector('[data-pick]');
      var payIn = panel.querySelector('[data-pay]');
      var feeIn = panel.querySelector('[data-fee]');
      var feeVal = panel.querySelector('[data-feev]');
      var tx2El = panel.querySelector('[data-tx2]');
      var tx3El = panel.querySelector('[data-tx3]');

      // Step 1 wallet — read-only chunk chips.
      walletEl.innerHTML = state.chunks.map(function (c) {
        return '<span class="exw-chunk">' + fmt(c.amt) + ' BTC</span>';
      }).join('') + '<span class="small" style="margin-left:0.5rem">three separate coins · total ' +
        fmt(state.chunks.reduce(function (s, c) { return s + c.amt; }, 0)) + ' BTC</span>';

      // Step 2 input pickers — toggle which chunks are spent.
      function renderPick() {
        pickEl.innerHTML = state.chunks.map(function (c, i) {
          return '<button class="exw-chunk pick' + (c.sel ? ' sel' : '') + '" data-chunk="' + i + '">' +
            (c.sel ? '✓ ' : '') + fmt(c.amt) + '</button>';
        }).join('');
        Array.prototype.forEach.call(pickEl.querySelectorAll('[data-chunk]'), function (b) {
          b.addEventListener('click', function () {
            var i = +b.getAttribute('data-chunk');
            state.chunks[i].sel = !state.chunks[i].sel;
            renderPick(); renderTx();
          });
        });
      }

      // The transaction card: inputs → outputs, with change + fee + validity.
      function txHtml() {
        var ins = state.chunks.filter(function (c) { return c.sel; });
        var inTotal = ins.reduce(function (s, c) { return s + c.amt; }, 0);
        var pay = state.payment, fee = state.fee;
        var change = inTotal - pay - fee;
        var valid = ins.length > 0 && pay > 0 && change >= -1e-9;
        var inHtml = ins.length
          ? ins.map(function (c) { return '<div class="io-item in">' + fmt(c.amt) + ' BTC</div>'; }).join('')
          : '<div class="io-item empty">no coins selected</div>';
        var outHtml = '';
        if (valid) {
          outHtml += '<div class="io-item pay">' + fmt(pay) + ' BTC → payee</div>';
          if (change > 1e-9) outHtml += '<div class="io-item change">' + fmt(change) + ' BTC → change (you)</div>';
          outHtml += '<div class="io-fee">+ fee to miner: <b>' + fmt(fee) + ' BTC</b></div>';
        } else {
          outHtml = '<div class="io-item empty">—</div>';
        }
        var card =
          '<div class="exw-txio">' +
            '<div class="io-side"><div class="io-cap">INPUTS · ' + fmt(inTotal) + ' BTC</div>' + inHtml + '</div>' +
            '<div class="io-eq">→</div>' +
            '<div class="io-side"><div class="io-cap">OUTPUTS</div>' + outHtml + '</div>' +
          '</div>';
        var note;
        if (!ins.length) note = '<div class="exw-result"><div><b>Select at least one coin to spend</b></div></div>';
        else if (pay <= 0) note = '<div class="exw-result"><div><b>Enter a payment amount</b></div></div>';
        else if (change < -1e-9) note = '<div class="exw-result bad"><div><b>✗ Inputs don\'t cover it</b><span class="small">' +
          fmt(inTotal) + ' BTC selected, but payment + fee = ' + fmt(pay + fee) + ' BTC. Select another coin.</span></div></div>';
        else note = '<div class="exw-result ok"><div><b>✓ Valid: ' + fmt(inTotal) + ' = ' + fmt(pay) + ' (pay) + ' +
          fmt(change) + ' (change) + ' + fmt(fee) + ' (fee)</b><span class="small">Inputs are spent whole; the change returns to you as a new output.</span></div></div>';
        return card + note;
      }

      function renderTx() {
        var h = txHtml();
        if (tx2El) tx2El.innerHTML = h;
        if (tx3El) tx3El.innerHTML = h;
      }

      payIn.addEventListener('input', function () { state.payment = parseFloat(payIn.value) || 0; renderTx(); });
      feeIn.addEventListener('input', function () { state.fee = parseFloat(feeIn.value) || 0; feeVal.textContent = state.fee.toFixed(2); renderTx(); });

      renderPick();
      renderTx();
      show(0);
    },

    unmount: function (panel) { if (panel) panel.innerHTML = ''; }
  };
})();
