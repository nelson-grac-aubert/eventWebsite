// Syncs the active dot to the currently visible card index
function updateDots(dots, activeIndex) {
  dots.forEach((dot, i) => {
    dot.classList.toggle('carousel__dot--active', i === activeIndex);
    dot.setAttribute('aria-selected', String(i === activeIndex));
  });
}

// Wires up dot navigation and scroll-driven dot sync for a carousel element
export function initCarousel(carouselEl) {
  const track = carouselEl.querySelector('.event-grid');
  const dots  = [...carouselEl.querySelectorAll('.carousel__dot')];
  if (!track || !dots.length) return;

  // Clicking a dot scrolls the track to the corresponding card
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const card = track.children[i];
      if (!card) return;
      track.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
    });
  });

  // Updates the active dot as the user scrolls through cards
  track.addEventListener('scroll', () => {
    const cardWidth = track.children[0]?.offsetWidth ?? 1;
    const index     = Math.round(track.scrollLeft / cardWidth);
    updateDots(dots, index);
  }, { passive: true });
}
