import { Project, Lead } from '../types';

/**
 * Creates a direct Google Calendar web URL to add an event without OAuth.
 */
export function createGoogleCalendarUrl(event: {
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  location?: string;
  description?: string;
}): string {
  const formatGCalDate = (dateStr: string, timeStr?: string) => {
    // If no time, standard all-day event format YYYYMMDD
    const cleanDate = dateStr.replace(/-/g, '');
    if (!timeStr) {
      return `${cleanDate}/${cleanDate}`;
    }
    const [hh, mm] = timeStr.split(':');
    const isoTime = `${hh || '09'}${mm || '00'}00`;
    return `${cleanDate}T${isoTime}`;
  };

  const startFormatted = event.startTime
    ? `${event.startDate.replace(/-/g, '')}T${(event.startTime || '09:00').replace(':', '')}00`
    : event.startDate.replace(/-/g, '');

  const endDateStr = event.endDate || event.startDate;
  const endFormatted = event.endTime
    ? `${endDateStr.replace(/-/g, '')}T${(event.endTime || '23:00').replace(':', '')}00`
    : event.startTime
    ? `${event.startDate.replace(/-/g, '')}T230000`
    : endDateStr.replace(/-/g, '');

  const datesParam = `${startFormatted}/${endFormatted}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: datesParam,
    details: event.description || '',
    location: event.location || 'Bangalore, Karnataka',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates an .ics file content for an array of projects/events
 */
export function generateICS(events: Array<{
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  location?: string;
  description?: string;
}>): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Z S EVENTS//Bangalore Floral Productions//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((ev) => {
    const cleanStart = ev.startDate.replace(/-/g, '');
    const cleanEnd = (ev.endDate || ev.startDate).replace(/-/g, '');
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.id}@zsevents.com`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${cleanStart}`,
      `DTEND;VALUE=DATE:${cleanEnd}`,
      `SUMMARY:${ev.title.replace(/\n/g, ' ')}`,
      `LOCATION:${(ev.location || 'Bangalore, Karnataka').replace(/\n/g, ' ')}`,
      `DESCRIPTION:${(ev.description || '').replace(/\n/g, '\\n')}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Triggers a download of the .ics calendar file in the browser
 */
export function downloadICSFile(filename: string, icsContent: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
