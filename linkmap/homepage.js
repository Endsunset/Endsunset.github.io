/* Each section starts its own rounded route. Content is visible by default. */
(() => {
  for (const journey of document.querySelectorAll('.journey')) initialize(journey);

  function initialize(journey) {
    const svg = journey.querySelector('.journey-path');
    const track = svg.querySelector('.journey-track');
    const progress = svg.querySelector('.journey-progress');
    const stops = [...journey.querySelectorAll('.story-heading, .story-row')];
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canReveal = 'IntersectionObserver' in window;
    const visible = new Set();
    let points = [], length = 0, furthest = 0, frame = 0, measureNeeded = true;
    let observer;

    function reveal(stop) {
      stop.classList.remove('journey-pending');
      visible.delete(stop);
      observer?.unobserve(stop.querySelector('.story-copy') || stop);
    }

    function measure() {
      const bounds = journey.getBoundingClientRect();
      const mobile = window.innerWidth <= 760;
      points = stops.map(stop => {
        const text = stop.querySelector('.story-copy') || stop;
        const textBounds = text.getBoundingClientRect();
        const right = stop.classList.contains('story-row') && !stop.classList.contains('story-row-reverse');
        return {
          x: mobile ? 18 : textBounds.left - bounds.left + textBounds.width * (right ? 2 / 3 : 1 / 3),
          y: stop.getBoundingClientRect().top - bounds.top + 36,
          stop,
        };
      });
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1], next = points[i];
        if (prev.x === next.x) {
          d += ` V ${next.y}`;
        } else {
          const direction = Math.sign(next.x - prev.x);
          const radius = Math.min(64, Math.abs(next.x - prev.x) / 2);
          const crossY = next.y - radius;
          d += ` V ${crossY - radius} Q ${prev.x} ${crossY} ${prev.x + direction * radius} ${crossY}`;
          d += ` H ${next.x - direction * radius} Q ${next.x} ${crossY} ${next.x} ${next.y}`;
        }
      }
      d += ` V ${bounds.height - 16}`;
      svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
      track.setAttribute('d', d);
      progress.setAttribute('d', d);
      length = progress.getTotalLength();
      // Cache arc lengths at stops. Interpolation lets horizontal runs draw smoothly
      // across a scroll interval instead of jumping at one vertical coordinate.
      for (const point of points) {
        let low = 0, high = length;
        for (let i = 0; i < 20; i++) {
          const mid = (low + high) / 2;
          if (progress.getPointAtLength(mid).y < point.y) low = mid;
          else high = mid;
        }
        point.length = high;
      }
      journey.classList.add('has-path');
    }

    function update() {
      frame = 0;
      if (measureNeeded) { measure(); measureNeeded = false; }
      const y = window.innerHeight * 0.8 - journey.getBoundingClientRect().top;
      const anchors = [...points, { y: journey.getBoundingClientRect().height - 16, length }];
      let drawn = y >= anchors.at(-1).y ? length : 0;
      for (let i = 1; i < anchors.length; i++) {
        const start = anchors[i - 1], end = anchors[i];
        if (y >= start.y && y < end.y) {
          const fraction = (y - start.y) / (end.y - start.y);
          drawn = start.length + fraction * (end.length - start.length);
          break;
        }
      }
      furthest = motion.matches || !canReveal ? 1 : Math.max(furthest, drawn / length);
      progress.style.strokeDasharray = `${length}`;
      progress.style.strokeDashoffset = `${length * (1 - furthest)}`;
      const drawnLength = length * furthest;
      for (const point of points) {
        const reached = point.length <= drawnLength;
        if (reached && visible.has(point.stop)) reveal(point.stop);
      }
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    function resize() { measureNeeded = true; schedule(); }

    // Build geometry successfully before opting any content into hiding.
    measure();
    measureNeeded = false;
    if (canReveal && !motion.matches) {
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          const stop = entry.target.closest('.story-row, .story-heading');
          if (entry.isIntersecting && entry.intersectionRatio >= 0.2) visible.add(stop);
        }
        schedule();
      }, { threshold: 0.2 });
      for (const stop of stops) {
        const text = stop.querySelector('.story-copy') || stop;
        // Keep restored positions, fragment navigation and initially visible text readable.
        if (text.getBoundingClientRect().top < window.innerHeight) continue;
        observer.observe(text);
        stop.classList.add('journey-ready', 'journey-pending');
      }
    }
    journey.addEventListener('focusin', event => {
      const stop = event.target.closest('.journey-pending');
      if (stop) { stop.classList.remove('journey-ready'); reveal(stop); }
    });
    motion.addEventListener('change', event => {
      if (event.matches) {
        observer?.disconnect();
        for (const stop of stops) { stop.classList.remove('journey-ready'); reveal(stop); }
      }
      schedule();
    });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pageshow', resize);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(journey);
    document.fonts?.ready.then(resize);
    update();
  }
})();
