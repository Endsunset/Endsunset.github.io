/* Progressive enhancement: no script or observer means fully visible content. */
(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;

  const elements = document.querySelectorAll('.story-visual, .story-copy');
  const reveal = (element) => {
    element.classList.remove('reveal-pending');
    observer.unobserve(element);
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.2) reveal(entry.target);
    }
  }, { threshold: 0.2 });

  for (const element of elements) {
    // Preserve visible content, including restored scroll positions and deep links.
    if (element.getBoundingClientRect().top < window.innerHeight) continue;
    observer.observe(element);
    element.classList.add('reveal-ready', 'reveal-pending');
  }

  document.addEventListener('focusin', (event) => {
    const element = event.target.closest('.reveal-pending');
    if (element) reveal(element);
  });
  motion.addEventListener('change', (event) => {
    if (!event.matches) return;
    observer.disconnect();
    for (const element of elements) element.classList.remove('reveal-ready', 'reveal-pending');
  });
})();
