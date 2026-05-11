const API_KEY = '08ee540c9a7a450e8b2f52b2fcc5fe70';
const API_BASE = 'https://api.openagenda.com/v2';
const EVENTS_LIMIT = 18;

// Agendas aggregated to cover concerts, museum events, and city-wide culture
const AGENDA_UIDS = [24882772, 2119473, 21769447];

// Builds the query string manually — URLSearchParams encodes brackets which breaks OpenAgenda
function buildAgendaEventsUrl(agendaUid, { keyword = '', categories = [] } = {}) {
  const now = new Date().toISOString();

  const parts = [
    `key=${API_KEY}`,
    `lang=fr`,
    `size=${EVENTS_LIMIT}`,
    `timings[gte]=${encodeURIComponent(now)}`,
  ];

  if (keyword) parts.push(`search=${encodeURIComponent(keyword)}`);
  categories.forEach(cat => parts.push(`keyword[]=${encodeURIComponent(cat)}`));

  return `${API_BASE}/agendas/${agendaUid}/events?${parts.join('&')}`;
}

// Returns start/end Date objects for the selected filter, or null if no filter is active
function getDateRange(dateFilter) {
  const now = new Date();

  if (dateFilter === 'this-week') {
    const end = new Date();
    end.setDate(end.getDate() + 7);
    return { start: now, end };
  }

  if (dateFilter === 'this-month') {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start: now, end };
  }

  if (dateFilter === 'next-month') {
    const start = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
    const end   = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
    return { start, end };
  }

  return null;
}

// Filters events client-side by firstTiming.begin — more reliable than API-side timings params
function filterByDateRange(events, dateFilter) {
  const range = getDateRange(dateFilter);
  if (!range) return events;

  return events.filter(e => {
    const begin = e.firstTiming?.begin;
    if (!begin) return false;
    const date = new Date(begin);
    return date >= range.start && date <= range.end;
  });
}

// Removes events that share the same uid (same event indexed by multiple agendas)
function deduplicateByUid(events) {
  const seen = new Set();
  return events.filter(e => {
    if (seen.has(e.uid)) return false;
    seen.add(e.uid);
    return true;
  });
}

// Removes recurring events with identical titles, keeping only the earliest occurrence
function deduplicateByTitle(events) {
  const seen = new Set();
  return events.filter(e => {
    const title = e.title?.fr?.trim().toLowerCase();
    if (!title || seen.has(title)) return false;
    seen.add(title);
    return true;
  });
}

// Removes employment/job centre events from France Travail agencies
function filterOutAgencyEvents(events) {
  return events.filter(e => {
    const origin = e.originAgenda?.title ?? '';
    return !origin.toLowerCase().includes('france travail');
  });
}

// Fetches all agendas in parallel, merges, deduplicates, sorts, and applies date filter
export async function fetchEvents(params = {}) {
  const results = await Promise.allSettled(
    AGENDA_UIDS.map(uid =>
      fetch(buildAgendaEventsUrl(uid, params))
        .then(res => res.ok ? res.json() : Promise.reject(res.status))
        .then(data => data.events ?? [])
    )
  );

  const allEvents = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);

  if (!allEvents.length) throw new Error('No events returned from any agenda');

  const deduplicated = deduplicateByUid(allEvents);

  // Sort ascending so deduplicateByTitle keeps the soonest occurrence of each title
  const sorted = deduplicated.sort(
    (a, b) => new Date(a.firstTiming?.begin) - new Date(b.firstTiming?.begin)
  );

  const filtered = filterByDateRange(deduplicateByTitle(sorted), params.dateFilter ?? '');
  return filterOutAgencyEvents(filtered).slice(0, EVENTS_LIMIT);
}

// Tries each agenda in turn — stops at the first one that returns a valid event object
export async function fetchEventById(eventUid) {
  for (const agendaUid of AGENDA_UIDS) {
    const url = `${API_BASE}/agendas/${agendaUid}/events/${eventUid}?key=${API_KEY}&lang=fr`;
    const res  = await fetch(url);
    if (!res.ok) continue;
    const data = await res.json();
    if (data.event) return data.event;
  }
  throw new Error(`Event ${eventUid} not found in any agenda`);
}