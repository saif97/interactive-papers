/* Interactive explainer: electronic-coin.
 * Registers into window.EXPLAINERS (see _base.js). Built as interactive HTML
 * panels stepped with next/prev. Where the concept can be run for real, it is:
 * this uses the Web Crypto API for genuine ECDSA P-256 keys and real
 * sign/verify. Each transfer is a real signature over a real hash — nothing
 * is faked.
 *
 * Complements the inline §2 figure (#fig1), which is a static diagram of the
 * transaction chain. Here the reader BUILDS the chain: each transfer signs
 * hash(previous transaction + next owner's public key) with the current
 * owner's private key, the chain grows as the coin is handed on, and verifying
 * walks the whole chain of ownership. Redirecting a transfer to someone the
 * owner never signed for breaks that link.
 *
 * Thesis: an electronic coin is not an object — it is a verifiable chain of
 * signed transfers. Each transfer commits to the one before it (by hash) and
 * to the next owner (by their public key), so the whole history of ownership
 * can be checked by anyone. But a signature proves who authorized a transfer,
 * never that the same coin wasn't already signed to someone else — that gap is
 * double-spending, which needs the timestamped chain to close.
 */
(function () {
  window.EXPLAINERS = window.EXPLAINERS || {};

  var enc = new TextEncoder();
  function bufToHex(buf) { return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join(''); }
  function sha256Hex(text) { return crypto.subtle.digest('SHA-256', enc.encode(text)).then(bufToHex); }
  function genKeyPair() { return crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']); }
  function trunc(s, n) { n = n || 8; return s && s.length > n * 2 ? s.slice(0, n) + '…' + s.slice(-n) : s; }

  // The cast. Mint creates the coin; Alice/Bob/Carol are honest holders;
  // Mallory is an attacker who holds keys but was never signed a transfer.
  var NAMES = ['Mint', 'Alice', 'Bob', 'Carol', 'Mallory'];

  window.EXPLAINERS["electronic-coin"] = {
    title: "Electronic coin",
    blurb: "A coin is a chain of signatures: each owner signs the coin over to the next, and anyone can verify the whole history.",

    mount: function (panel) {
      // people[name] = { keyPair, pubHex }  ·  coin = [ tx, tx, ... ]
      // tx = { owner, signer, prevHash, msg, sigHex }
      var people = {};
      var coin = [];
      var redirect = {};   // step 4 tamper: tx index -> substituted owner name

      panel.innerHTML =
        '<div class="exw">' +
          '<div class="exw-nav">' +
            '<button data-prev disabled>← Prev</button>' +
            '<button data-next>Next →</button>' +
            '<span class="exw-stepname"></span>' +
            '<span class="exw-dots"></span>' +
          '</div>' +

          // Step 1 — what a coin is
          '<div class="exw-step" data-step>' +
            '<h3>1 · A coin is a chain of signatures</h3>' +
            '<p>There is no coin file or coin object. A coin is just a <b>list of transfers</b>, each one digitally signed. To own the coin is to be the owner named in its most recent transfer. Everyone here has a live ECDSA key pair — the secret half signs, the public half is their identity.</p>' +
            '<div class="exw-card"><span class="exw-label">Live key pairs (ECDSA P-256, public key shown)</span><div data-people style="margin-top:0.5rem"><span class="exw-label">Generating…</span></div></div>' +
            '<p class="exw-note" style="margin-top:0.8rem">The <b>Mint</b> creates the coin and signs it over to Alice. From there each owner can pass it on. <b>Mallory</b> has keys too — but no one ever signed her the coin. Watch what happens when she tries to take it.</p>' +
          '</div>' +

          // Step 2 — make a transfer (real signature)
          '<div class="exw-step" data-step>' +
            '<h3>2 · A transfer signs over the previous transaction + the next owner</h3>' +
            '<p>To hand the coin on, the <b>current owner</b> signs a hash of two things: the <b>previous transaction</b> (so this transfer is pinned to the exact history) and the <b>next owner\'s public key</b> (so only that person can spend it next). Build the coin one transfer at a time.</p>' +
            '<div class="exw-row" style="gap:0.5rem;flex-wrap:wrap">' +
              '<span class="exw-label" style="margin:0">Current owner: <b data-holder>—</b> signs over to</span>' +
              '<button class="exw-btn sign" data-give="Bob" style="margin:0">Alice → Bob</button>' +
              '<button class="exw-btn sign" data-give="Carol" style="margin:0">Bob → Carol</button>' +
              '<button class="exw-btn ghost" data-reset style="margin:0">↻ Reset coin</button>' +
            '</div>' +
            '<div class="exw-coin" data-coin2 style="margin-top:0.8rem"></div>' +
          '</div>' +

          // Step 3 — verify the chain of ownership
          '<div class="exw-step" data-step>' +
            '<h3>3 · Anyone can verify the whole chain of ownership</h3>' +
            '<p>A payee accepting the coin re-checks every transfer: each signature must verify against the <b>signer\'s public key</b> over the hash that transfer committed to. If every link checks out, the chain of ownership is sound. Build the coin in step 2, then verify it here.</p>' +
            '<button class="exw-btn verify" data-verify>✓ Verify the chain</button>' +
            '<div class="exw-coin" data-coin3 style="margin-top:0.8rem"></div>' +
            '<div data-vresult></div>' +
          '</div>' +

          // Step 4 — why it can't be forged
          '<div class="exw-step" data-step>' +
            '<h3>4 · You can\'t redirect a transfer you didn\'t sign</h3>' +
            '<p>Suppose Mallory tries to steal the coin by changing who a transfer paid. The signature was computed over the <b>real recipient\'s key</b>, so swapping in Mallory\'s key makes that link fail to verify — she would need the signer\'s private key to forge a valid one, and she doesn\'t have it. Redirect a transfer and re-verify.</p>' +
            '<div class="exw-coin" data-coin4 style="margin-top:0.4rem"></div>' +
            '<div data-fresult style="margin-top:0.6rem"></div>' +
          '</div>' +

          // Step 5 — thesis
          '<div class="exw-step" data-step>' +
            '<h3>5 · What the coin is — and what\'s still missing</h3>' +
            '<p class="exw-note">A coin is a <b>verifiable chain of signed transfers</b>: each transfer commits by hash to the one before it and by public key to the next owner, so anyone can replay the whole history and confirm who owns it now — no mint or bank needed to vouch for it. But signatures prove <b>who</b> authorized each transfer, never that the same coin wasn\'t <b>also</b> signed to someone else at the same time. Closing that gap — agreeing which transfer came first — is the <a href="#sec-2">double-spending</a> problem, and it takes a <a href="#sec-3">timestamp server</a> and a single agreed history to solve.</p>' +
          '</div>' +
        '</div>';

      // ── navigation ──
      var steps = Array.prototype.slice.call(panel.querySelectorAll('[data-step]'));
      var names = ['What a coin is', 'Transfer', 'Verify', 'Forge attempt', 'Thesis'];
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
        renderCoins();
      }
      prevBtn.addEventListener('click', function () { show(cur - 1); });
      nextBtn.addEventListener('click', function () { show(cur + 1); });

      // ── crypto helpers ──
      // The bytes a transfer signs: hash(previous transaction) + the next owner's public key.
      function transferMessage(prevHash, nextOwnerName) {
        return prevHash + '||' + people[nextOwnerName].pubHex;
      }
      function txHash(tx) { return sha256Hex(tx.sigHex + '|' + tx.owner); }

      function signTransfer(signerName, nextOwnerName, prevHash) {
        var msg = transferMessage(prevHash, nextOwnerName);
        return crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, people[signerName].keyPair.privateKey, enc.encode(msg))
          .then(function (sig) {
            return { owner: nextOwnerName, signer: signerName, prevHash: prevHash, sigHex: bufToHex(sig) };
          });
      }

      // Verify one transfer. effectiveOwner lets step 4 substitute a redirected recipient
      // WITHOUT a matching signature, so the check fails.
      function verifyTx(tx, effectiveOwner) {
        var owner = effectiveOwner || tx.owner;
        var msg = transferMessage(tx.prevHash, owner);
        var bytes = Uint8Array.from(tx.sigHex.match(/.{2}/g).map(function (h) { return parseInt(h, 16); }));
        return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, people[tx.signer].keyPair.publicKey, bytes, enc.encode(msg));
      }

      function holder() { return coin.length ? coin[coin.length - 1].owner : 'Mint'; }

      // Mint the coin to Alice (coinbase: Mint signs over to Alice on a genesis hash).
      function mintCoin() {
        coin = [];
        redirect = {};
        return sha256Hex('coinbase:genesis').then(function (g) {
          return signTransfer('Mint', 'Alice', g).then(function (tx) { coin.push(tx); });
        });
      }

      // ── rendering ──
      var peopleEl = panel.querySelector('[data-people]');
      var holderEl = panel.querySelector('[data-holder]');
      var coin2El = panel.querySelector('[data-coin2]');
      var coin3El = panel.querySelector('[data-coin3]');
      var coin4El = panel.querySelector('[data-coin4]');
      var vresultEl = panel.querySelector('[data-vresult]');
      var fresultEl = panel.querySelector('[data-fresult]');

      function renderPeople() {
        peopleEl.innerHTML = NAMES.map(function (n) {
          var role = n === 'Mint' ? 'mint' : (n === 'Mallory' ? 'mallory' : 'owner');
          return '<div class="exw-person ' + role + '"><span class="pn">' + n + '</span>' +
            '<span class="pk">' + (people[n] ? trunc(people[n].pubHex) : '…') + '</span></div>';
        }).join('');
      }

      // Render the coin as a row of transaction cards. opts.verdicts is an array
      // of true/false/undefined per tx; opts.redirectable wires the step-4 dropdowns.
      function renderCoin(el, opts) {
        opts = opts || {};
        if (!coin.length) { el.innerHTML = '<span class="exw-label">No coin yet — reset to mint it to Alice.</span>'; return; }
        var html = '';
        coin.forEach(function (tx, i) {
          var v = opts.verdicts ? opts.verdicts[i] : undefined;
          var cls = v === true ? ' ok' : (v === false ? ' bad' : '');
          if (i > 0) html += '<div class="exw-clink' + (v === false ? ' broken' : '') + '">← over prev tx</div>';
          var ownerCell;
          if (opts.redirectable && i > 0) {
            var sel = NAMES.filter(function (n) { return n !== 'Mint'; }).map(function (n) {
              var chosen = (redirect[i] || tx.owner) === n;
              return '<option' + (chosen ? ' selected' : '') + '>' + n + '</option>';
            }).join('');
            ownerCell = '<select class="exw-input exw-redir" data-redir="' + i + '" style="margin:0">' + sel + '</select>';
          } else {
            ownerCell = '<b>' + (redirect[i] || tx.owner) + '</b>';
          }
          html += '<div class="exw-tx' + cls + '">' +
            '<div class="tx-head">transfer ' + i + (i === 0 ? ' · coinbase' : '') +
              (v === true ? ' · ✓' : (v === false ? ' · ✗' : '')) + '</div>' +
            '<div class="tx-line"><span class="tx-lab">to</span><span class="tx-to">' + ownerCell + '</span></div>' +
            '<div class="tx-line"><span class="tx-lab">signed by</span><span class="tx-by">' + tx.signer + '</span></div>' +
            '<div class="tx-line"><span class="tx-lab">prev</span><span class="tx-hash">' + trunc(tx.prevHash) + '</span></div>' +
            '<div class="tx-line"><span class="tx-lab">sig</span><span class="tx-hash">' + trunc(tx.sigHex) + '</span></div>' +
            '</div>';
        });
        el.innerHTML = '<div class="exw-coinrow">' + html + '</div>';
      }

      function renderCoins() {
        if (holderEl) holderEl.textContent = holder();
        // disable transfer buttons that don't apply to the current holder
        var giveBob = panel.querySelector('[data-give="Bob"]');
        var giveCarol = panel.querySelector('[data-give="Carol"]');
        if (giveBob) giveBob.disabled = holder() !== 'Alice';
        if (giveCarol) giveCarol.disabled = holder() !== 'Bob';
        renderCoin(coin2El, {});
        renderCoin(coin3El, {});
        renderCoin(coin4El, { redirectable: true });
        wireRedirects();
      }

      function wireRedirects() {
        Array.prototype.forEach.call(coin4El.querySelectorAll('[data-redir]'), function (sel) {
          sel.addEventListener('change', function () {
            var i = +sel.getAttribute('data-redir');
            redirect[i] = sel.value;
            runForgeCheck();
          });
        });
      }

      // ── step 2: transfers ──
      Array.prototype.forEach.call(panel.querySelectorAll('[data-give]'), function (btn) {
        btn.addEventListener('click', function () {
          var next = btn.getAttribute('data-give');
          var prev = coin[coin.length - 1];
          txHash(prev).then(function (h) {
            return signTransfer(prev.owner, next, h);
          }).then(function (tx) {
            coin.push(tx);
            vresultEl.innerHTML = '';
            renderCoins();
          });
        });
      });
      panel.querySelector('[data-reset]').addEventListener('click', function () {
        mintCoin().then(function () { vresultEl.innerHTML = ''; fresultEl.innerHTML = ''; renderCoins(); });
      });

      // ── step 3: verify the honest chain ──
      panel.querySelector('[data-verify]').addEventListener('click', function () {
        Promise.all(coin.map(function (tx) { return verifyTx(tx); })).then(function (verdicts) {
          renderCoin(coin3El, { verdicts: verdicts });
          var allOk = verdicts.every(Boolean);
          vresultEl.innerHTML = '<div class="exw-result ' + (allOk ? 'ok' : 'bad') + '"><div><b>' +
            (allOk ? '✓ Chain of ownership valid' : '✗ A link failed to verify') + '</b><span class="small">' +
            (allOk
              ? 'Every transfer is signed by the prior owner over the correct next owner and previous transaction. ' + holder() + ' owns the coin.'
              : 'At least one signature does not match — the chain is not trustworthy.') +
            '</span></div></div>';
        });
      });

      // ── step 4: forge attempt ──
      function runForgeCheck() {
        Promise.all(coin.map(function (tx, i) { return verifyTx(tx, redirect[i]); })).then(function (verdicts) {
          renderCoin(coin4El, { redirectable: true, verdicts: verdicts });
          wireRedirects();
          var anyRedirect = Object.keys(redirect).some(function (k) { return redirect[k] !== coin[k].owner; });
          var allOk = verdicts.every(Boolean);
          if (!anyRedirect) {
            fresultEl.innerHTML = '<div class="exw-result ok"><div><b>✓ Untouched chain verifies</b><span class="small">Redirect a transfer above to a different recipient and watch that link fail.</span></div></div>';
          } else {
            fresultEl.innerHTML = '<div class="exw-result ' + (allOk ? 'ok' : 'bad') + '"><div><b>' +
              (allOk ? '✓ Still valid' : '✗ Forged link rejected') + '</b><span class="small">' +
              (allOk
                ? 'No change took effect.'
                : 'The signature was made over the real recipient\'s public key, so it doesn\'t verify for the substituted one. Forging it would need the signer\'s private key.') +
              '</span></div></div>';
          }
        });
      }

      // ── boot: generate everyone's keys, mint the coin ──
      Promise.all(NAMES.map(function (n) {
        return genKeyPair().then(function (kp) {
          return crypto.subtle.exportKey('jwk', kp.publicKey).then(function (jwk) {
            people[n] = { keyPair: kp, pubHex: (jwk.x + jwk.y) };
          });
        });
      })).then(function () {
        renderPeople();
        return mintCoin();
      }).then(function () {
        renderCoins();
        runForgeCheck();
      });

      show(0);
    },

    unmount: function (panel) { if (panel) panel.innerHTML = ''; }
  };
})();
