'use client';

import { useState } from 'react';
import { DuplicateEventError, saveEvent } from '../eventStorage';

const initialForm = {
  title: '',
  location: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  description: '',
};

export default function EventForm() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setMessage('');
    setError('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (form.endDate < form.startDate || (form.endDate === form.startDate && form.endTime <= form.startTime)) {
      setError('De einddatum en -tijd moeten na de startdatum en -tijd liggen.');
      return;
    }

    try {
      saveEvent({
        ...form,
        id: window.crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
      setForm(initialForm);
      setMessage('Het event is succesvol aangemaakt.');
    } catch (storageError) {
      if (storageError instanceof DuplicateEventError) {
        setError(storageError.message);
        return;
      }

      console.error('Het event kon niet worden opgeslagen.', storageError);
      setError('Er is een fout opgetreden. Het event kon niet worden toegevoegd.');
    }
  }

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="event-title">Titel <span aria-hidden="true">*</span></label>
        <input id="event-title" name="title" value={form.title} onChange={updateField} required maxLength={100} />
      </div>

      <div className="form-field">
        <label htmlFor="event-location">Locatie <span aria-hidden="true">*</span></label>
        <input id="event-location" name="location" value={form.location} onChange={updateField} required maxLength={120} />
      </div>

      <fieldset className="form-group">
        <legend>Datum <span aria-hidden="true">*</span></legend>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="event-start-date">Begindatum</label>
            <input id="event-start-date" type="date" name="startDate" value={form.startDate} onChange={updateField} required />
          </div>
          <div className="form-field">
            <label htmlFor="event-end-date">Einddatum</label>
            <input id="event-end-date" type="date" name="endDate" value={form.endDate} onChange={updateField} required min={form.startDate || undefined} />
          </div>
        </div>
      </fieldset>

      <fieldset className="form-group">
        <legend>Tijd <span aria-hidden="true">*</span></legend>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="event-start-time">Begintijd</label>
            <input id="event-start-time" type="time" name="startTime" value={form.startTime} onChange={updateField} required />
          </div>
          <div className="form-field">
            <label htmlFor="event-end-time">Eindtijd</label>
            <input id="event-end-time" type="time" name="endTime" value={form.endTime} onChange={updateField} required />
          </div>
        </div>
      </fieldset>

      <div className="form-field">
        <label htmlFor="event-description">Beschrijving <span className="optional-label">(optioneel)</span></label>
        <textarea id="event-description" name="description" value={form.description} onChange={updateField} rows={4} maxLength={500} />
      </div>

      {error && <p className="form-message form-message-error" role="alert">{error}</p>}
      {message && <p className="form-message form-message-success" role="status">{message}</p>}

      <button className="button button-primary event-submit" type="submit">Event opslaan</button>
    </form>
  );
}
