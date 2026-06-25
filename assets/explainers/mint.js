/* Interactive explainer: mint.
 * Registers into window.EXPLAINERS (see _base.js). Built as interactive HTML
 * panels stepped with next/prev (see building-explainers skill).
 *
 * The §2 paragraph names the mint as the "common solution" to double-spending
 * and then rejects it. This explainer is that foil: the reader runs a central
 * mint and sees both halves — it genuinely stops a double-spend (step 2), but
 * only by funnelling every coin through one company that then becomes a single
 * point of failure and control (step 3).
 *
 * Thesis: a central mint prevents double-spending by voiding each coin and
 * reissuing it from one trusted authority that is aware of every transaction —
 * which works, but rebuilds the trusted third party Bitcoin sets out to remove.
 * Bitcoin keeps the mint's job (deciding which transaction came first) and
 * discards the mint, letting every node agree on the order via proof-of-work.
 *
 * Nothing here needs cryptography: double-spend prevention by a mint is about
 * ordering and trust, so the steps are interactive widgets, not Web Crypto.
 */
(function () {
  window.EXPLAINERS = window.EXPLAINERS || {};

  var OWNERS = ['Alice', 'Bob', 'Carol', 'Dave'];

  window.EXPLAINERS["mint"] = {
    title: "The mint: a central fix for double-spending",
    blurb: "One trusted issuer voids and reissues every coin so it can't be spent twice — which works, but is exactly the trusted third party Bitcoin removes.",

    mount: function (panel) {
      panel.innerHTML =
        '<div class="exw">' +
          '<div class="exw-nav">' +
            '<button data-prev disabled>← Prev</button>' +
            '<button data-next>Next →</button>' +
            '<span class="exw-stepname"></span>' +
            '<span class="exw-dots"></span>' +
          '</div>' +

          // Step 1 — the mint reissues every coin and logs it
          '<div class="exw-step" data-step>' +
            '<h3>1 · A mint reissues every coin</h3>' +
            '<p>Without a central authority, a coin is just a chain of signatures and the payee can\'t be sure it wasn\'t already spent somewhere else. The classic fix is a <b>mint</b>: every coin passes through one trusted issuer. To pay, the owner returns the coin to the mint, which <b>voids</b> it, issues a fresh coin to the payee, and records the swap. Make a few payments and watch the mint sit in the middle of each one.</p>' +
            '<div class="exw-card">' +
              '<div class="exw-flowrow" data-s1flow></div>' +
              '<div class="exw-row" style="justify-content:flex-start;gap:0.5rem;margin-top:0.7rem">' +
                '<button class="exw-btn" data-s1pay style="margin:0">Make the next payment →</button>' +
                '<button class="exw-btn ghost" data-s1reset style="margin:0">Reset</button>' +
              '</div>' +
              '<div data-s1ledger style="margin-top:0.8rem"></div>' +
            '</div>' +
          '</div>' +

          // Step 2 — the mint catches a double-spend
          '<div class="exw-step" data-step>' +
            '<h3>2 · The mint catches a double-spend</h3>' +
            '<p>Because the mint logs every coin it voids, it can refuse one that is already spent. Alice will try to spend the <b>same</b> coin twice. Signatures alone can\'t stop her — both transfers are validly signed — but the mint\'s central ledger can, because it sees every transaction and the earliest one is the one that counts.</p>' +
            '<div class="exw-card">' +
              '<div class="exw-row" style="justify-content:flex-start;gap:0.5rem;flex-wrap:wrap">' +
                '<button class="exw-btn" data-s2bob style="margin:0">Alice pays Bob with Coin #1</button>' +
                '<button class="exw-btn danger" data-s2carol style="margin:0">Alice pays Carol with the SAME Coin #1</button>' +
                '<button class="exw-btn ghost" data-s2reset style="margin:0">Reset</button>' +
              '</div>' +
              '<div data-s2out style="margin-top:0.2rem"></div>' +
            '</div>' +
          '</div>' +

          // Step 3 — single point of failure / control
          '<div class="exw-step" data-step>' +
            '<h3>3 · So the whole system depends on the mint</h3>' +
            '<p>It works — but every coin must pass through one company, so the money system is only as reliable and honest as that company. Set the mint\'s state, then try to make a payment.</p>' +
            '<div class="exw-card">' +
              '<span class="exw-label">Mint state</span>' +
              '<div class="exw-row" style="justify-content:flex-start;gap:0.4rem;flex-wrap:wrap" data-s3modes>' +
                '<button class="exw-btn ghost" data-mode="online" style="margin:0">Online</button>' +
                '<button class="exw-btn ghost" data-mode="offline" style="margin:0">Offline</button>' +
                '<button class="exw-btn ghost" data-mode="seized" style="margin:0">Seized / corrupt</button>' +
              '</div>' +
              '<button class="exw-btn" data-s3pay style="margin-top:0.7rem">Alice pays Bob</button>' +
              '<div data-s3out></div>' +
            '</div>' +
          '</div>' +

          // Step 4 — thesis + link onward
          '<div class="exw-step" data-step>' +
            '<h3>4 · The mint\'s job, without the mint</h3>' +
            '<p class="exw-note">A mint prevents <b>double-spending</b> by being aware of every transaction and deciding which came first — but that rebuilds the <b>trusted third party</b> Bitcoin set out to remove: one company every payment must route through, able to halt, censor, or rewrite the money at will. Bitcoin keeps the job and discards the authority. Transactions are announced publicly and every node agrees on a single order using <a href="#sec-4">proof-of-work</a>, so the accepted history is the <a href="#sec-5">longest chain</a> — backed by the most work — instead of one company\'s ledger.</p>' +
          '</div>' +
        '</div>';

      // ── navigation ──
      var steps = Array.prototype.slice.call(panel.querySelectorAll('[data-step]'));
      var names = ['Reissue', 'Catch a cheat', 'Single point', 'Without the mint'];
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

      // ── step 1: chain of payments, each reissued by the mint ──
      var s1 = { i: 0, serial: 1, last: null, ledger: [] };
      var s1flow = panel.querySelector('[data-s1flow]');
      var s1ledger = panel.querySelector('[data-s1ledger]');
      var s1pay = panel.querySelector('[data-s1pay]');
      function s1render() {
        if (!s1.last) {
          s1flow.innerHTML = '<div class="exw-fbox pub">Alice<br><span class="small">holds Coin #1</span></div>' +
            '<span class="exw-farrow">← issued by the mint</span>';
        } else {
          s1flow.innerHTML =
            '<div class="exw-fbox">' + s1.last.payer + '<br><span class="small">Coin #' + s1.last.old + ' (void)</span></div>' +
            '<span class="exw-farrow">→ return →</span>' +
            '<div class="exw-fbox verify">MINT<br><span class="small">checks &amp; reissues</span></div>' +
            '<span class="exw-farrow">→ issue →</span>' +
            '<div class="exw-fbox pub">' + s1.last.payee + '<br><span class="small">Coin #' + s1.last.nw + '</span></div>';
        }
        s1ledger.innerHTML = s1.ledger.length
          ? '<span class="exw-label">Mint ledger — every payment, recorded by one company</span>' +
            s1.ledger.map(function (r) { return '<div class="exw-mono" style="font-size:0.72rem;color:var(--muted);padding:0.12rem 0">' + r + '</div>'; }).join('')
          : '<span class="exw-label">Mint ledger (empty)</span>';
        s1pay.disabled = s1.i >= OWNERS.length - 1;
        s1pay.textContent = s1pay.disabled ? 'Coin has reached the last owner' : 'Make the next payment →';
      }
      s1pay.addEventListener('click', function () {
        if (s1.i >= OWNERS.length - 1) return;
        var payer = OWNERS[s1.i], payee = OWNERS[s1.i + 1], old = s1.serial, nw = s1.serial + 1;
        s1.ledger.push('Coin #' + old + ' voided  ·  Coin #' + nw + ' issued to ' + payee + ' (paid by ' + payer + ')');
        s1.last = { payer: payer, payee: payee, old: old, nw: nw };
        s1.i++; s1.serial = nw;
        s1render();
      });
      panel.querySelector('[data-s1reset]').addEventListener('click', function () {
        s1 = { i: 0, serial: 1, last: null, ledger: [] };
        s1render();
      });
      s1render();

      // ── step 2: same coin spent twice; the mint rejects the second ──
      var s2 = { spentTo: null, log: [] };
      var s2out = panel.querySelector('[data-s2out]');
      function s2render() {
        s2out.innerHTML = s2.log.map(function (e) {
          return '<div class="exw-result ' + (e.ok ? 'ok' : 'bad') + '"><div><b>' + (e.ok ? '✓ ' : '✗ ') + e.title + '</b>' +
            '<span class="small">' + e.body + '</span></div></div>';
        }).join('');
      }
      function s2attempt(payee) {
        if (s2.spentTo === null) {
          s2.spentTo = payee;
          s2.log.push({ ok: true, title: 'Mint accepts: Coin #1 → ' + payee, body: 'The mint voids Coin #1 and issues Coin #2 to ' + payee + ', recording the swap in its ledger.' });
        } else if (s2.spentTo === payee) {
          s2.log.push({ ok: false, title: 'Already paid ' + payee, body: 'Coin #1 was already voided in this payment — there is nothing left to send.' });
        } else {
          s2.log.push({ ok: false, title: 'Mint rejects: Coin #1 → ' + payee, body: 'Coin #1 was already voided when Alice paid ' + s2.spentTo + '. Only coins the mint has issued and not yet voided are accepted, so the double-spend fails. Cryptography couldn\'t pick a winner — the central ledger can.' });
        }
        s2render();
      }
      panel.querySelector('[data-s2bob]').addEventListener('click', function () { s2attempt('Bob'); });
      panel.querySelector('[data-s2carol]').addEventListener('click', function () { s2attempt('Carol'); });
      panel.querySelector('[data-s2reset]').addEventListener('click', function () { s2 = { spentTo: null, log: [] }; s2render(); });
      s2render();

      // ── step 3: the mint as a single point of failure / control ──
      var s3mode = 'online';
      var s3modes = panel.querySelector('[data-s3modes]');
      var s3out = panel.querySelector('[data-s3out]');
      var OUTCOME = {
        online: { ok: true, title: 'Payment goes through', body: 'It works — but the mint saw exactly who paid whom, and could just as easily have refused. Every payment in the economy routes through this one company, just like a bank.' },
        offline: { ok: false, title: 'Nobody can transact', body: 'The mint is down, so no coin can be voided or reissued. The entire money system halts until the company brings it back.' },
        seized: { ok: false, title: 'The operator controls your money', body: 'Whoever controls the mint can void your coins and reissue them to themselves, censor payments, or mint new coins from nothing. The fate of the entire money system depends on the company running the mint.' }
      };
      function s3render(showResult) {
        Array.prototype.forEach.call(s3modes.children, function (b) {
          var on = b.getAttribute('data-mode') === s3mode;
          b.classList.toggle('ghost', !on);
        });
        if (showResult) {
          var o = OUTCOME[s3mode];
          s3out.innerHTML = '<div class="exw-result ' + (o.ok ? 'ok' : 'bad') + '"><div><b>' + (o.ok ? '✓ ' : '✗ ') + o.title + '</b><span class="small">' + o.body + '</span></div></div>';
        }
      }
      Array.prototype.forEach.call(s3modes.children, function (b) {
        b.addEventListener('click', function () { s3mode = b.getAttribute('data-mode'); s3out.innerHTML = ''; s3render(false); });
      });
      panel.querySelector('[data-s3pay]').addEventListener('click', function () { s3render(true); });
      s3render(false);

      show(0);
    },

    unmount: function (panel) { if (panel) panel.innerHTML = ''; }
  };
})();
