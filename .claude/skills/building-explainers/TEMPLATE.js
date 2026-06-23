/* Explainer module template. Copy to assets/explainers/<concept-key>.js and fill in.
 * Reached from step 4 of SKILL.md. Read assets/explainers/digital-signatures.js for a
 * full worked example (real Web Crypto + next/prev) — this is the same shape, trimmed.
 *
 * Approach: interactive HTML panels stepped with next/prev. Layout is HTML/CSS
 * (the .exw-* classes in style.css) — never hand-placed SVG coordinates. Run real
 * computation when the concept allows (window.crypto.subtle, etc.).
 *
 * Contract (window.EXPLAINERS[key]):
 *   title   (required) panel heading
 *   blurb   (optional) one-line framing
 *   mount(panel)   (required) render the steps + wire interactions into panel
 *   unmount(panel) (optional) clear the panel and stop anything still running
 *
 * Useful .exw-* classes (see style.css): .exw wrapper, .exw-nav (prev/next),
 * .exw-step (one per step; .on shows it), .exw-card, .exw-grid.cols2/.cols3,
 * .exw-label, .exw-input, .exw-textarea, .exw-btn(.sign/.verify/.danger/.ghost),
 * .exw-key.priv/.pub, .exw-hex, .exw-result.ok/.bad, .exw-note.
 */
(function () {
  window.EXPLAINERS = window.EXPLAINERS || {};

  window.EXPLAINERS["<concept-key>"] = {
    title: "<Concept name>",
    blurb: "<one-line framing — the thesis, compressed>",

    mount: function (panel) {
      panel.innerHTML =
        '<div class="exw">' +
          '<div class="exw-nav">' +
            '<button data-prev disabled>← Prev</button>' +
            '<button data-next>Next →</button>' +
            '<span class="exw-stepname"></span>' +
            '<span class="exw-dots"></span>' +
          '</div>' +

          // One .exw-step per step. Give each a concrete interaction the reader does.
          '<div class="exw-step" data-step>' +
            '<h3>1 · <step title></h3>' +
            '<p><setup — who and what is involved></p>' +
            // e.g. '<input class="exw-input" data-x value="...">' + a button that does something
          '</div>' +

          '<div class="exw-step" data-step>' +
            '<h3>2 · <step title></h3>' +
            '<p><one idea, with a real interaction></p>' +
          '</div>' +

          // Last step: state the thesis and link the next concept.
          '<div class="exw-step" data-step>' +
            '<h3><N> · What it proves</h3>' +
            '<p class="exw-note"><thesis>. Link onward: <a href="#sec-N">term</a>.</p>' +
          '</div>' +
        '</div>';

      // ── next/prev navigation (copy as-is; set names to match your steps) ──
      var steps = Array.prototype.slice.call(panel.querySelectorAll('[data-step]'));
      var names = ['<step 1 name>', '<step 2 name>', '<step N name>'];
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

      // ── wire each step's interactions here (query within `panel`) ──
      // var input = panel.querySelector('[data-x]'); input.addEventListener('input', ...);
      // Run real computation when the concept allows it.
    },

    unmount: function (panel) { if (panel) panel.innerHTML = ''; }
  };
})();
