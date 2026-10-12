const EVENTS_STORAGE_KEY = 'sneakerness-events';

export class DuplicateEventError extends Error {
  constructor() {
    super('Er bestaat al een event met dezelfde begin- en einddatum en tijd.');
    this.name = 'DuplicateEventError';
  }
}

export function getStoredEvents() {
  const serializedEvents = window.localStorage.getItem(EVENTS_STORAGE_KEY);
  if (!serializedEvents) return [];

  const events = JSON.parse(serializedEvents);
  if (!Array.isArray(events)) {
    throw new Error('De opgeslagen events hebben een ongeldig formaat.');
  }

  return events;
}

export function saveEvent(event) {
  const events = getStoredEvents();
  // Een tijdslot mag maar één keer voorkomen, ongeacht de eventtitel of locatie.
  const duplicate = events.some((storedEvent) => (
    storedEvent.startDate === event.startDate
    && storedEvent.startTime === event.startTime
    && storedEvent.endDate === event.endDate
    && storedEvent.endTime === event.endTime
  ));

  if (duplicate) {
    throw new DuplicateEventError();
  }

  events.push(event);
  window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
}

export function formatEventDate(date) {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export function formatEventDateRange(startDate, endDate) {
  const start = formatEventDate(startDate);
  return startDate === endDate ? start : `${start} – ${formatEventDate(endDate)}`;
}
