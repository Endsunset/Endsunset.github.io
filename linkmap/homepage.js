/* Native scrolling drives a single measured path. Content is visible by default. */
(() => {
  const journey = document.querySelector('.journey');
  if (!journey) return;
  const svg = journey.querySelector('.journey-path');
  const track = svg.querySelector('.journey-track');
  const progress = svg.querySelector('.journey-progress');
  const nodes = svg.querySelector('.journey-nodes');
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
    points = stops.map((stop, index) => {
      const right = stop.classList.contains('story-heading-right') ||
        (stop.classList.contains('story-row') && stop.classList.contains('story-row-reverse'));
      return {
        x: mobile ? 18 + (index % 2) * 4 : right ? bounds.width - 24 : 24,
        y: stop.getBoundingClientRect().top - bounds.top + 36,
        stop,
      };
    });
    let d = `M ${points[0].x} 0 V ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1], next = points[i];
      if (mobile) {
        d += ` C ${prev.x} ${next.y - 64} ${next.x} ${next.y - 64} ${next.x} ${next.y}`;
      } else if (prev.x === next.x) {
        d += ` V ${next.y}`;
      } else {
        // A curve gains height throughout its turn, so drawing never jumps across a horizontal segment.
        // Keep the whole crossing in the whitespace between content blocks.
        d += ` V ${next.y - 100} C ${prev.x} ${next.y - 52} ${next.x} ${next.y - 52} ${next.x} ${next.y}`;
      }
    }
    d += ` V ${bounds.height - 16}`;
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    track.setAttribute('d', d);
    progress.setAttribute('d', d);
    length = progress.getTotalLength();
    nodes.replaceChildren(...points.map(point => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', point.x);
      circle.setAttribute('cy', point.y);
      circle.setAttribute('r', point.stop.classList.contains('story-row') ? 7 : 10);
      circle.setAttribute('class', 'journey-node');
      point.circle = circle;
      return circle;
    }));
    journey.classList.add('has-path');
  }

  function update() {
    frame = 0;
    if (measureNeeded) { measure(); measureNeeded = false; }
    const y = window.innerHeight * 0.8 - journey.getBoundingClientRect().top;
    // The path is monotonic in y, so binary search maps viewport progress to arc length.
    let low = 0, high = length;
    for (let i = 0; i < 16; i++) {
      const mid = (low + high) / 2;
      if (progress.getPointAtLength(mid).y <= y) low = mid;
      else high = mid;
    }
    furthest = motion.matches || !canReveal ? 1 : Math.max(furthest, low / length);
    progress.style.strokeDasharray = `${length}`;
    progress.style.strokeDashoffset = `${length * (1 - furthest)}`;
    const tip = progress.getPointAtLength(length * furthest).y;
    for (const point of points) {
      const reached = point.y <= tip;
      point.circle.classList.toggle('is-reached', reached);
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
})();
