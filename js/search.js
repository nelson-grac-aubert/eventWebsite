import { fetchEvents } from './api.js';
import { renderEventCards } from './render.js';
import { setLoadingState, showError } from './ui.js';
import { announce, moveFocusTo } from './accessibility.js';
import { initCarousel } from './carousel.js';

// Delays execution of fn until delay ms have passed since the last call
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Collects the text content of all currently active category chips
function getActiveCategories() {
  return [...document.querySelectorAll('.chip[aria-pressed="true"]')]
    .map(btn => btn.textContent.trim().toLowerCase());
}

// Reads the current state of all search form controls into a params object
function buildSearchParams() {
  return {
    keyword:    document.querySelector('#search-input')?.value.trim() ?? '',
    dateFilter: document.querySelector('#date-filter')?.value ?? '',
    categories: getActiveCategories(),
  };
}

// Returns n randomly selected items from arr
function pickRandom(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

// Fetches events with the given params, renders them, and announces the result count
async function loadAndRender(container, params = {}) {
  setLoadingState(container, true);
  try {
    const events = await fetchEvents(params);
    renderEventCards(events, container);
    const n = events.length;
    announce(`${n} événement${n > 1 ? 's' : ''} trouvé${n > 1 ? 's' : ''}.`);
    moveFocusTo(container);
  } catch (err) {
    showError(container, 'Une erreur est survenue lors du chargement des événements.');
    console.error(err);
  }
}

// Fetches all events, picks 3 at random, renders them, and initialises the carousel
async function loadFeatured(carouselEl) {
  const grid = carouselEl.querySelector('.event-grid');
  if (!grid) return;
  setLoadingState(grid, true);
  try {
    const events = await fetchEvents();
    renderEventCards(pickRandom(events, 3), grid);
    initCarousel(carouselEl);
  } catch (err) {
    showError(grid, 'Une erreur est survenue lors du chargement des événements.');
    console.error(err);
  }
}

// Toggles a chip's active state and triggers the filter callback
function toggleChip(chip, onFilterChange) {
  const isActive = chip.getAttribute('aria-pressed') === 'true';
  chip.setAttribute('aria-pressed', String(!isActive));
  chip.classList.toggle('chip--active', !isActive);
  onFilterChange();
}

// Attaches click listeners to all category chips
function initFilterChips(onFilterChange) {
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => toggleChip(chip, onFilterChange));
  });
}

// Wires up all search controls and triggers the initial data loads
export function initSearch() {
  const carouselEl  = document.querySelector('.event-carousel');
  const resultsGrid = document.querySelector('.search-results .event-grid');
  if (!resultsGrid) return;

  // Debounced so the API is not called on every keystroke
  const onSearchChange = debounce(
    () => loadAndRender(resultsGrid, buildSearchParams()),
    400
  );

  document.querySelector('#search-input')?.addEventListener('input',  onSearchChange);
  document.querySelector('#date-filter')?.addEventListener('change', onSearchChange);
  initFilterChips(onSearchChange);

  if (carouselEl) loadFeatured(carouselEl);
  loadAndRender(resultsGrid);
}
