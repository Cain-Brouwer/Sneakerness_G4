'use client';

import { useEffect, useState } from 'react';
import {
  DuplicateEventError,
  EventNotFoundError,
  getAllEvents,
  updateEvent,
} from '../eventStorage';

const editableFields = {
  title: '',
  location: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  description: '',
};

function toFormValues(event) {
  return Object.fromEntries(
    Object.keys(editableFields).map((field) => [field, event[field] || '']),
  );
}

export default function EventEditor() {
  const [events, setEvents] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(editableFields);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      const availableEvents = getAllEvents();
      const requestedEventId = new URLSearchParams(window.location.search).get('id') || '';
      setEvents(availableEvents);

      if (requestedEventId) {
        const selectedEvent = availableEvents.find((event) => event.id === requestedEventId);
        if (selectedEvent) {
          setSelectedId(requestedEventId);
          setForm(toFormValues(selectedEvent));
        } else {
          setError('Het event dat je wilt wijzigen kon niet worden gevonden.');
        }
      }
    } catch (loadError) {
      console.error('De events konden niet worden geladen.', loadError);
      setError('De events konden niet worden geladen. Probeer het later opnieuw.');
    }
  }, []);

  function selectEvent(event) {
    const id = event.target.value;
    const selectedEvent = events.find((availableEvent) => availableEvent.id === id);
    setSelectedId(id);
    setForm(selectedEvent ? toFormValues(selectedEvent) : editableFields);
    setError('');
    setMessage('');
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setError('');
    setMessage('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!selectedId) {
      setError('Selecteer eerst het event dat je wilt wijzigen.');
      return;
    }

    if (form.endDate < form.startDate || (form.endDate === form.startDate && form.endTime <= form.startTime)) {
      setError('De einddatum en -tijd moeten na de startdatum en -tijd liggen.');
      return;
    }

    try {
      const updatedEvent = updateEvent(selectedId, form);
      setEvents((currentEvents) => currentEvents.map((availableEvent) => (
        availableEvent.id === selectedId ? updatedEvent : availableEvent
      )));
      setForm(toFormValues(updatedEvent));
      setMessage('De wijzigingen zijn succesvol opgeslagen.');
    } catch (updateError) {
      if (updateError instanceof DuplicateEventError) {
        setError(updateError.message);
        return;
      }

      if (updateError instanceof EventNotFoundError) {
        setError(updateError.message);
        return;
      }

      console.error('De eventwijzigingen konden niet worden opgeslagen.', updateError);
      setError('Er is een fout opgetreden. De wijzigingen konden niet worden opgeslagen.');
    }
  }

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="event-to-edit">Event selecteren <span aria-hidden="true">*</span></label>
        <select id="event-to-edit" value={selectedId} onChange={selectEvent} required>
          <option value="">Kies een event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>{event.title}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="event-title-edit">Titel <span aria-hidden="true">*</span></label>
        <input id="event-title-edit" name="title" value={form.title} onChange={updateField} required maxLength={100} disabled={!selectedId} />
      </div>

      <div className="form-field">
        <label htmlFor="edit-event-location">Locatie <span aria-hidden="true">*</span></label>
        <input id="edit-event-location" name="location" value={form.location} onChange={updateField} required maxLength={120} disabled={!selectedId} />
      </div>

      <fieldset className="form-group">
        <legend>Datum <span aria-hidden="true">*</span></legend>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="edit-event-start-date">Begindatum</label>
            <input id="edit-event-start-date" type="date" name="startDate" value={form.startDate} onChange={updateField} required disabled={!selectedId} />
          </div>
          <div className="form-field">
            <label htmlFor="edit-event-end-date">Einddatum</label>
            <input id="edit-event-end-date" type="date" name="endDate" value={form.endDate} onChange={updateField} required min={form.startDate || undefined} disabled={!selectedId} />
          </div>
        </div>
      </fieldset>

      <fieldset className="form-group">
        <legend>Tijd <span aria-hidden="true">*</span></legend>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="edit-event-start-time">Begintijd</label>
            <input id="edit-event-start-time" type="time" name="startTime" value={form.startTime} onChange={updateField} required disabled={!selectedId} />
          </div>
          <div className="form-field">
            <label htmlFor="edit-event-end-time">Eindtijd</label>
            <input id="edit-event-end-time" type="time" name="endTime" value={form.endTime} onChange={updateField} required disabled={!selectedId} />
          </div>
        </div>
      </fieldset>

      <div className="form-field">
        <label htmlFor="edit-event-description">Beschrijving <span className="optional-label">(optioneel)</span></label>
        <textarea id="edit-event-description" name="description" value={form.description} onChange={updateField} rows={4} maxLength={500} disabled={!selectedId} />
      </div>

      {error && <p className="form-message form-message-error" role="alert">{error}</p>}
      {message && <p className="form-message form-message-success" role="status">{message}</p>}

      <button className="button button-primary event-submit" type="submit" disabled={!selectedId}>Wijzigingen opslaan</button>
    </form>
  );
}
