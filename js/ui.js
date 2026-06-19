import { createElement, clearContainer } from './dom.js';
import { announce, setAriaBusy } from './accessibility.js';

// Marks a container as busy and replaces its content with a loading message
export function setLoadingState(container, isLoading) {
  setAriaBusy(container, isLoading);
  if (!isLoading) return;
  clearContainer(container);
  container.appendChild(createElement('p', 'loading-msg', 'Chargement…'));
}

// Clears a container and injects an accessible error message
export function showError(container, message) {
  clearContainer(container);
  const el = createElement('p', 'error-msg', message);
  el.setAttribute('role', 'alert');
  container.appendChild(el);
}

// Initialises the share button using the Web Share API with a clipboard fallback
export function initShareButton() {
  const btn = document.querySelector('#btn-share');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        announce('Lien copié dans le presse-papier.');
      }
    } catch {
      // User cancelled the share dialog : no action needed
    }
  });
}
