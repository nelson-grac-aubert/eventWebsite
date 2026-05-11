import { fetchEventById } from './api.js';
import { renderEventDetail } from './render.js';
import { showError } from './ui.js';
import { announce, setAriaBusy } from './accessibility.js';

// Reads the event uid from the ?id= query parameter in the current URL
function getEventUidFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

// Returns the cached event from sessionStorage if it matches the requested uid.
// This avoids a CORS-blocked API call when navigating from the home page.
function getEventFromSession(uid) {
  try {
    const raw = sessionStorage.getItem('currentEvent');
    if (!raw) return null;
    const event = JSON.parse(raw);
    if (String(event.uid) !== String(uid)) return null;
    return event;
  } catch {
    return null;
  }
}

// Loads and renders a single event — uses sessionStorage cache first, API as fallback
export async function initDetailPage() {
  const uid     = getEventUidFromUrl();
  const article = document.querySelector('.event-detail');
  if (!article) return;

  if (!uid) {
    showError(article, "Identifiant d'événement manquant dans l'URL.");
    return;
  }

  setAriaBusy(article, true);
  try {
    const cached = getEventFromSession(uid);
    const event  = cached ?? await fetchEventById(uid);
    renderEventDetail(event);
    announce(`Détails chargés : ${event.title?.fr ?? ''}`);
  } catch (err) {
    showError(article, 'Impossible de charger les détails de cet événement.');
    console.error(err);
  } finally {
    setAriaBusy(article, false);
  }
}
