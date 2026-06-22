/* Explorable kit — reusable across all explorable-paper diagrams.
 * Depends on GSAP (loaded via CDN before this file).
 *
 *   Explorable.stepper({
 *     root: '#fig1',                 // container with .stage svg, .caption, .controls, .dots
 *     steps: [{label, text}, ...],   // one per timeline label, in order
 *     build: (gsap, svg) => timeline // build a paused GSAP timeline with addLabel('s0'..)
 *   })
 *
 * The build() fn must add a label 's0','s1',... at the END of each step's tweens,
 * matching steps[] order. Step 0 is the initial (pre-animation) state.
 */
window.Explorable = (function () {
  function stepper(cfg) {
    var root = typeof cfg.root === 'string' ? document.querySelector(cfg.root) : cfg.root;
    var svg = root.querySelector('svg');
    var capEl = root.querySelector('.caption');
    var prevBtn = root.querySelector('[data-prev]');
    var nextBtn = root.querySelector('[data-next]');
    var replayBtn = root.querySelector('[data-replay]');
    var dotsWrap = root.querySelector('.dots');
    var steps = cfg.steps;
    var labels = steps.map(function (_, i) { return 's' + i; });

    var tl = cfg.build(window.gsap, svg);
    tl.pause();

    // build dots
    steps.forEach(function (_, i) {
      var d = document.createElement('i');
      d.addEventListener('click', function () { go(i); });
      dotsWrap.appendChild(d);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    var cur = 0;

    function render() {
      capEl.innerHTML =
        '<span class="step-label">Step ' + (cur + 1) + ' / ' + steps.length +
        (steps[cur].label ? ' · ' + steps[cur].label : '') + '</span>' + steps[cur].text;
      prevBtn.disabled = cur === 0;
      nextBtn.disabled = cur === steps.length - 1;
      dots.forEach(function (d, i) { d.classList.toggle('on', i === cur); });
    }

    function go(i) {
      i = Math.max(0, Math.min(steps.length - 1, i));
      if (i === cur) { render(); return; }
      // seek to the target label; tween smoothly forward or back
      tl.tweenTo(labels[i], { duration: Math.min(1.0, 0.45 + 0.18 * Math.abs(i - cur)) });
      cur = i;
      render();
    }

    nextBtn.addEventListener('click', function () { go(cur + 1); });
    prevBtn.addEventListener('click', function () { go(cur - 1); });
    if (replayBtn) replayBtn.addEventListener('click', function () { tl.pause(0); cur = 0; render(); });

    // Arrow keys act only on the diagram the pointer is currently over, so
    // multiple steppers on one page don't all advance together.
    var hovered = false;
    root.addEventListener('mouseenter', function () { hovered = true; });
    root.addEventListener('mouseleave', function () { hovered = false; });
    function onKey(e) {
      if (!hovered) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
    }
    document.addEventListener('keydown', onKey);

    // start at step 0 (timeline already at time 0)
    render();

    // Tear down a stepper whose container is being removed (e.g. an explainer
    // panel closing): kill the timeline and drop the global key listener so
    // nothing dangles.
    function destroy() {
      document.removeEventListener('keydown', onKey);
      tl.kill();
    }
    return { go: go, destroy: destroy };
  }

  return { stepper: stepper };
})();
