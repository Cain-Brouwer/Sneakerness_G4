const EVENTS_STORAGE_KEY = 'sneakerness-events';
const EVENT_OVERRIDES_STORAGE_KEY = 'sneakerness-event-overrides';

export const upcomingEvents = [
  {
    id: 'sneakerness-rotterdam-2026',
    title: 'Sneakerness Rotterdam 2026',
    location: 'Van Nellefabriek, Rotterdam',
    description: 'De grootste sneakerbeurs van Nederland met sneakers, streetwear en limited drops.',
    startDate: '2026-11-14',
    endDate: '2026-11-15',
    startTime: '10:00',
    endTime: '18:00',
    action: 'Tickets kopen',
    primary: true,
  },
  {
    id: 'sneakerness-amsterdam-2026',
    title: 'Sneakerness Amsterdam 2026',
    location: 'RAI Amsterdam',
    description: 'Twee dagen vol sneakers, exposanten en speciale events.',
    startDate: '2026-12-05',
    endDate: '2026-12-06',
    startTime: '10:00',
    endTime: '18:00',
    action: 'Tickets kopen',
    primary: true,
  },
  {
    id: 'sneakerness-utrecht-2027',
    title: 'Sneakerness Utrecht 2027',
    location: 'Jaarbeurs Utrecht',
    description: 'Start het jaar met de eerste sneakerbeurs van 2027.',
    startDate: '2027-01-16',
    endDate: '2027-01-17',
    startTime: '10:00',
    endTime: '18:00',
    action: 'Bekijk details',
    primary: false,
  },
];

export class DuplicateEventError extends Error {
  constructor() {
    super('Je kunt niet twee events tegelijkertijd opslaan. Dit tijdslot is al bezet.');
    this.name = 'DuplicateEventError';
  }
}

function eventsOverlap(firstEvent, secondEvent) {
  const firstStart = `${firstEvent.startDate}T${firstEvent.startTime}`;
  const firstEnd = `${firstEvent.endDate}T${firstEvent.endTime}`;
  const secondStart = `${secondEvent.startDate}T${secondEvent.startTime}`;
  const secondEnd = `${secondEvent.endDate}T${secondEvent.endTime}`;

  return firstStart < secondEnd && firstEnd > secondStart;
}

export class EventNotFoundError extends Error {
  constructor() {
    super('Het event dat je wilt wijzigen bestaat niet meer.');
    this.name = 'EventNotFoundError';
  }
}

function getEventOverrides() {
  const serializedOverrides = window.localStorage.getItem(EVENT_OVERRIDES_STORAGE_KEY);
  if (!serializedOverrides) return {};

  const overrides = JSON.parse(serializedOverrides);
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new Error('De opgeslagen eventwijzigingen hebben een ongeldig formaat.');
  }

  return overrides;
}

function getBaseEvents() {
  const overrides = getEventOverrides();
  return upcomingEvents.map((event) => ({ ...event, ...overrides[event.id] }));
}

export function getStoredEvents() {
  const serializedEvents = window.localStorage.getItem(EVENTS_STORAGE_KEY);
  if (!serializedEvents) return [];

  const events = JSON.parse(serializedEvents);
  if (!Array.isArray(events)) {
    throw new Error('De opgeslagen events hebben een ongeldig formaat.');
  }

  const validEvents = [];
  const baseEvents = getBaseEvents();
  events.forEach((event) => {
    if (![...baseEvents, ...validEvents].some((storedEvent) => eventsOverlap(event, storedEvent))) {
      validEvents.push(event);
    }
  });

  // Verwijder oude dubbele events die zijn opgeslagen voordat vaste events werden gecontroleerd.
  if (validEvents.length !== events.length) {
    window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(validEvents));
  }

  return validEvents;
}

export function getAllEvents() {
  return [...getBaseEvents(), ...getStoredEvents()];
}

export function saveEvent(event) {
  const events = getStoredEvents();
  const duplicate = getAllEvents().some((storedEvent) => eventsOverlap(event, storedEvent));

  if (duplicate) {
    throw new DuplicateEventError();
  }

  events.push(event);
  window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
}

export function updateEvent(id, changes) {
  const events = getAllEvents();
  const existingEvent = events.find((event) => event.id === id);
  if (!existingEvent) {
    throw new EventNotFoundError();
  }

  const updatedEvent = { ...existingEvent, ...changes, id };
  if (events.some((event) => event.id !== id && eventsOverlap(updatedEvent, event))) {
    throw new DuplicateEventError();
  }

  if (upcomingEvents.some((event) => event.id === id)) {
    const overrides = getEventOverrides();
    overrides[id] = updatedEvent;
    window.localStorage.setItem(EVENT_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
    return updatedEvent;
  }

  const storedEvents = getStoredEvents();
  const storedEventIndex = storedEvents.findIndex((event) => event.id === id);
  if (storedEventIndex === -1) {
    throw new EventNotFoundError();
  }

  storedEvents[storedEventIndex] = updatedEvent;
  window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(storedEvents));
  return updatedEvent;
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
