/* Hover-glossary. Any element with class "term" and a data-term key shows a
 * floating tooltip with the matching definition. Definitions live in window.GLOSSARY
 * (defined per-page or in glossary-data.js). Falls back to the element's data-def.
 * Keyboard-accessible: terms are focusable and show the tip on focus.
 */
(function () {
  function init() {
    var tip = document.createElement('div');
    tip.id = 'tooltip';
    document.body.appendChild(tip);

    var dict = window.GLOSSARY || {};

    function show(el) {
      var key = el.getAttribute('data-term');
      var def = (dict[key] && dict[key].def) || el.getAttribute('data-def');
      var title = (dict[key] && dict[key].term) || key || '';
      if (!def) return;
      // Keywords wired to a click-to-expand explainer get an explicit call to
      // act, so the reader knows the chip does more than show this definition.
      var cta = el.classList.contains('has-explainer')
        ? '<span class="t-cta">▸ press to open the interactive explainer</span>' : '';
      tip.innerHTML = '<span class="t-term">' + title + '</span>' + def + cta;
      tip.classList.add('show');
      position(el);
    }
    function position(el) {
      var r = el.getBoundingClientRect();
      tip.style.left = '0px'; tip.style.top = '0px'; // measure
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var left = r.left + r.width / 2 - tw / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
      var top = r.top - th - 10;
      if (top < 8) top = r.bottom + 10; // flip below if no room above
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    }
    function hide() { tip.classList.remove('show'); }

    document.querySelectorAll('.term').forEach(function (el) {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      el.addEventListener('mouseenter', function () { show(el); });
      el.addEventListener('mouseleave', hide);
      el.addEventListener('focus', function () { show(el); });
      el.addEventListener('blur', hide);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
