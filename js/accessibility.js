// Hidden live region injected once into the DOM for screen reader announcements
let liveRegion = null;

// Creates the live region on first use and returns it on subsequent calls
function getOrCreateLiveRegion() {
  if (liveRegion) return liveRegion;
  liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.style.cssText =
    'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)';
  document.body.appendChild(liveRegion);
  return liveRegion;
}

// Reads a message aloud for screen reader users without any visual change.
// The text is cleared first to ensure the same message triggers a new announcement.
export function announce(message) {
  const region = getOrCreateLiveRegion();
  region.textContent = '';
  setTimeout(() => { region.textContent = message; }, 100);
}

// Moves keyboard focus to an element, adding tabindex if the element is not naturally focusable
export function moveFocusTo(element) {
  if (!element) return;
  element.setAttribute('tabindex', '-1');
  element.focus({ preventScroll: true });
}

// Toggles aria-busy on a container to signal loading state to assistive technologies
export function setAriaBusy(container, isBusy) {
  if (!container) return;
  isBusy
    ? container.setAttribute('aria-busy', 'true')
    : container.removeAttribute('aria-busy');
}
