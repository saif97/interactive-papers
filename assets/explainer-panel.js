/* Explainer panels — the click-to-expand layer over hover-glossary keywords.
 *
 * Layered on top of glossary-tooltip.js, not a replacement: a `.term` keyword
 * still shows its text tooltip on hover. Additionally, if window.EXPLAINERS has
 * a module for that keyword's data-term, the keyword is decorated with an accent
 * underline + a small ⊕, and clicking it expands a block-level interactive panel
 * directly below the paragraph it sits in.
 *
 * Rules:
 *   - One panel open at a time. Clicking the same keyword (or its ✕) closes it;
 *     clicking a different keyword closes the current panel and opens the new one.
 *   - The visible word and the concept are decoupled (Wikipedia-style): any
 *     phrasing tagged data-term="x" opens the same module x.
 *   - Keywords whose explainer module isn't loaded on this page stay plain hover
 *     terms — graceful, no errors.
 *   - Mouse-click only for now (keyboard interaction remains the tooltip).
 */
(function () {
  function init() {
    var EX = window.EXPLAINERS || {};
    var open = null; // { trigger, panel, body, key }

    function closeOpen() {
      if (!open) return;
      var mod = EX[open.key];
      try { if (mod && mod.unmount) mod.unmount(open.body); } catch (e) {}
      open.panel.remove();
      open.trigger.classList.remove('ex-active');
      open.trigger.setAttribute('aria-expanded', 'false');
      open = null;
    }

    function toggle(trigger, key) {
      if (open && open.trigger === trigger) { closeOpen(); return; }
      closeOpen();
      var mod = EX[key];
      if (!mod) return;

      // Insert below the keyword's block-level ancestor so the text reflows
      // around a full-width panel, matching the paper's figure blocks.
      var block = trigger.closest('p, li, blockquote, h1, h2, h3, h4') || trigger.parentNode;

      var panel = document.createElement('div');
      panel.className = 'explainer-panel';

      var head = document.createElement('div');
      head.className = 'ex-head';
      head.innerHTML =
        '<span class="ex-title">' + (mod.title || key) + '</span>' +
        (mod.blurb ? '<span class="ex-blurb">' + mod.blurb + '</span>' : '');

      var closeBtn = document.createElement('button');
      closeBtn.className = 'ex-close';
      closeBtn.setAttribute('aria-label', 'Close explainer');
      closeBtn.innerHTML = '✕';
      closeBtn.addEventListener('click', closeOpen);
      head.appendChild(closeBtn);

      var body = document.createElement('div');
      body.className = 'ex-body';

      panel.appendChild(head);
      panel.appendChild(body);
      block.parentNode.insertBefore(panel, block.nextSibling);

      trigger.classList.add('ex-active');
      trigger.setAttribute('aria-expanded', 'true');
      open = { trigger: trigger, panel: panel, body: body, key: key };

      try { mod.mount(body); }
      catch (e) { body.innerHTML = '<p class="ex-error">Could not load this explainer.</p>'; }

      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    document.querySelectorAll('.term').forEach(function (el) {
      var key = el.getAttribute('data-term');
      if (!key || !EX[key] || el.classList.contains('has-explainer')) return;
      el.classList.add('has-explainer');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-expanded', 'false');
      var glyph = document.createElement('span');
      glyph.className = 'ex-glyph';
      glyph.setAttribute('aria-hidden', 'true');
      glyph.textContent = '⊕'; // ⊕
      el.appendChild(glyph);
      el.addEventListener('click', function (e) { e.preventDefault(); toggle(el, key); });
      // Keyboard: Enter or Space presses the chip, same as a click.
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          toggle(el, key);
        }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
