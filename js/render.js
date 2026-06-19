import { createElement, clearContainer } from './dom.js';

const PLACEHOLDER = 'assets/placeholder.webp';

// Formats an ISO date string into a short French date (DD/MM/YY)
export function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  });
}

// Builds the full image URL by concatenating the CDN base path and filename
function getImageSrc(event) {
  const { base, filename } = event.image ?? {};
  if (base && filename) return `${base}${filename}`;
  return PLACEHOLDER;
}

// Matches descriptions that contain only whitespace or music/emoji characters
const MEANINGLESS = /^[\s♫♪🎵🎶\p{Emoji}]*$/u;

// Returns the French description if meaningful, or null if empty/emoji-only
function getDescription(event) {
  const desc = event.description?.fr ?? '';
  if (!desc || MEANINGLESS.test(desc)) return null;
  return desc;
}

// Returns the URL for the event detail page
function buildDetailUrl(uid) {
  return `event-detail.html?id=${uid}`;
}

// Saves the full event object to sessionStorage so the detail page can read it without an API call
function storeEventInSession(event) {
  try {
    sessionStorage.setItem('currentEvent', JSON.stringify(event));
  } catch {
    // sessionStorage unavailable : detail page will fall back to API
  }
}

// Builds and returns a <li> containing a full event card from an API event object
export function createEventCard(event) {
  const uid       = event.uid;
  const title     = event.title?.fr    ?? 'Événement sans titre';
  const location  = event.location?.name ?? '';
  const date      = formatDate(event.firstTiming?.begin);
  const detailUrl = buildDetailUrl(uid);

  const li      = createElement('li', 'event-grid__item');
  const article = createElement('article', 'event-card');

  // Image link is hidden from assistive tech : the title link is the real CTA
  const imgLink = createElement('a', 'event-card__media-link');
  imgLink.href = detailUrl;
  imgLink.tabIndex = -1;
  imgLink.setAttribute('aria-hidden', 'true');
  imgLink.addEventListener('click', () => storeEventInSession(event));

  const img = createElement('img');
  img.src   = getImageSrc(event);
  img.alt   = '';
  img.setAttribute('width', '400');
  img.setAttribute('height', '250');
  img.setAttribute('loading', 'lazy');
  imgLink.appendChild(img);

  const body = createElement('div', 'event-card__body');

  const timeEl = createElement('time', 'event-card__date', date);
  timeEl.setAttribute('datetime', event.firstTiming?.begin ?? '');

  const h3        = createElement('h3', 'event-card__title');
  const titleLink = createElement('a', '', title);
  titleLink.href  = detailUrl;
  titleLink.addEventListener('click', () => storeEventInSession(event));
  h3.appendChild(titleLink);

  const locationEl = createElement('p', 'event-card__location', location);

  // Truncate description to 150 characters, or show a fallback message
  const rawDesc   = getDescription(event);
  const shortDesc = rawDesc
    ? (rawDesc.length > 150 ? `${rawDesc.slice(0, 150)}…` : rawDesc)
    : 'Pas de description disponible pour cet événement.';
  const descEl = createElement('p', 'event-card__desc', shortDesc);

  const moreLink = createElement('a', 'event-card__link');
  moreLink.href  = detailUrl;
  moreLink.setAttribute('aria-label', `En savoir plus sur ${title}`);
  moreLink.addEventListener('click', () => storeEventInSession(event));
  moreLink.appendChild(document.createTextNode('En savoir plus '));
  const arrow = createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '→';
  moreLink.appendChild(arrow);

  body.append(timeEl, h3, locationEl, descEl, moreLink);
  article.append(imgLink, body);
  li.appendChild(article);
  return li;
}

// Clears the container and renders one card per event, or an empty-state message
export function renderEventCards(events, container) {
  clearContainer(container);
  if (!events.length) {
    container.appendChild(createElement('p', 'loading-msg', 'Aucun événement trouvé.'));
    return;
  }
  events.forEach(event => container.appendChild(createEventCard(event)));
}

// Injects all event data into the detail page DOM elements
export function renderEventDetail(event) {
  const title   = event.title?.fr    ?? '';
  const venue   = event.location?.name    ?? '';
  const address = event.location?.address ?? '';

  document.title = `${title} – VillaNova Events`;

  const heroImg = document.querySelector('#event-hero-img');
  if (heroImg) { heroImg.src = getImageSrc(event); heroImg.alt = `Illustration : ${title}`; }

  const titleEl = document.querySelector('#event-title');
  if (titleEl)  titleEl.textContent = title;

  const venueEl = document.querySelector('#event-venue');
  if (venueEl)  venueEl.textContent = venue;

  const addrEl  = document.querySelector('#event-address');
  if (addrEl)   addrEl.textContent = address;

  const descEl = document.querySelector('#event-description p');
  if (descEl)   descEl.textContent =
    getDescription(event) ?? 'Pas de description disponible pour cet événement.';

  if (event.firstTiming) {
    const dateEl = document.querySelector('#event-dates');
    if (dateEl)  dateEl.textContent =
      `${formatDate(event.firstTiming.begin)} – ${formatDate(event.firstTiming.end)}`;
  }

  // Only show the official link if the API provides one
  const officialUrl = event.links?.find(l => l.type === 'website')?.url;
  const linkEl = document.querySelector('#event-official-link');
  if (linkEl) linkEl.href = officialUrl ?? 'https://www.marseille.fr/culture';

  buildCalendarLink(event, address);
}

// Generates a Google Calendar "add event" URL and sets it on the calendar button
function buildCalendarLink(event, address) {
  const calLink = document.querySelector('#event-calendar-link');
  if (!calLink || !event.firstTiming) return;

  // Google Calendar expects dates in YYYYMMDDTHHmmssZ format
  const toGCal = iso =>
    new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     event.title?.fr ?? '',
    dates:    `${toGCal(event.firstTiming.begin)}/${toGCal(event.firstTiming.end)}`,
    location: address,
  });
  calLink.href = `https://calendar.google.com/calendar/render?${params.toString()}`;
}
