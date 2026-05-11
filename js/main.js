import { initShareButton } from './ui.js';
import { initSearch }      from './search.js';
import { initDetailPage }  from './detail.js';

// Returns true when the current page is the event detail page
function isDetailPage() {
  return window.location.pathname.includes('event-detail');
}

// Bootstraps the correct module set depending on which page is loaded
function init() {
  if (isDetailPage()) {
    initDetailPage();
    initShareButton();
  } else {
    initSearch();
  }
}

document.addEventListener('DOMContentLoaded', init);
