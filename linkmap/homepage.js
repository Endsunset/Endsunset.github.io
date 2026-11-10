/* One centered route joins the sections and opens into the final road. */
(() => {
  for (const journey of document.querySelectorAll('.journey')) initialize(journey);

  function initialize(journey) {
    const svg = journey.querySelector('.journey-path');
    const track = svg.querySelector('.journey-track');
    const progress = svg.querySelector('.journey-progress');
    const ending = journey.querySelector('.get-started');
    const road = journey.querySelector('.journey-road');
    const sections = [...journey.querySelectorAll('.product-story:not(.get-started)')];
    const stops = [...journey.querySelectorAll('.story-heading, .story-row')];
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canReveal = 'IntersectionObserver' in window;
    const visible = new Set();
    const revealPosition = 0.618;
    let points = [], length = 0, furthest = 0, frame = 0, measureNeeded = true, endY = 0, roadProgress = 0;
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
          x: stop.classList.contains('story-heading') ? bounds.width / 2 : mobile ? 18 : textBounds.left - bounds.left + textBounds.width * (right ? 2 / 3 : 1 / 3),
          y: stop.getBoundingClientRect().top - bounds.top + 36,
          stop,
        };
      });
      // Return to the center before each section boundary, then continue directly
      // into the next heading. These are geometry anchors, not extra reveal targets.
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        points.push({ x: bounds.width / 2, y: rect.bottom - bounds.top - 24 });
      }
      const endingBounds = ending.getBoundingClientRect();
      endY = endingBounds.top - bounds.top + endingBounds.height * 0.618;
      points.push({ x: bounds.width / 2, y: endY });
      points.sort((a, b) => a.y - b.y);
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1], next = points[i];
        if (prev.x === next.x) {
          d += ` V ${next.y}`;
        } else {
          const direction = Math.sign(next.x - prev.x);
          const radius = Math.min(64, Math.abs(next.x - prev.x) / 2, (next.y - prev.y) / 2);
          const crossY = next.y - radius;
          d += ` V ${crossY - radius} Q ${prev.x} ${crossY} ${prev.x + direction * radius} ${crossY}`;
          d += ` H ${next.x - direction * radius} Q ${next.x} ${crossY} ${next.x} ${next.y}`;
        }
      }
      svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
      track.setAttribute('d', d);
      progress.setAttribute('d', d);
      length = progress.getTotalLength();
      // Cache arc lengths at stops so content waits for its part of the route.
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
      const triggerY = window.innerHeight * revealPosition;
      const y = triggerY - journey.getBoundingClientRect().top;
      // Follow the actual vertical position, including horizontal runs. A short
      // stroke transition smooths their draw without advancing beyond the trigger.
      let low = 0, high = length;
      for (let i = 0; i < 20; i++) {
        const mid = (low + high) / 2;
        if (progress.getPointAtLength(mid).y <= y) low = mid;
        else high = mid;
      }
      const drawn = y >= endY ? length : low;
      furthest = motion.matches || !canReveal ? 1 : Math.max(furthest, drawn / length);
      progress.style.strokeDasharray = `${length}`;
      progress.style.strokeDashoffset = `${length * (1 - furthest)}`;
      const atPageEnd = window.scrollY + window.innerHeight >= (document.documentElement?.scrollHeight ?? Infinity) - 2;
      const roadFraction = Math.max(0, Math.min(1, (y - endY) / (journey.getBoundingClientRect().height - endY)));
      roadProgress = motion.matches || !canReveal || atPageEnd ? 1 : Math.max(roadProgress, roadFraction);
      road.style.clipPath = `inset(0 0 ${(1 - roadProgress) * 100}% 0)`;
      const drawnLength = length * furthest;
      for (const point of points) {
        const reached = point.length <= drawnLength;
        if (reached && point.stop && visible.has(point.stop)) {
          const text = point.stop.querySelector('.story-copy') || point.stop;
          if (text.getBoundingClientRect().top <= triggerY) reveal(point.stop);
        }
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
        if (text.getBoundingClientRect().top < window.innerHeight * revealPosition) continue;
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
