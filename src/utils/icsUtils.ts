/**
 * ICS (iCalendar) Import/Export utilities for Avivar Agenda
 * Follows RFC 5545 standard, compatible with Google Calendar exports
 */

export interface ICSEvent {
  uid?: string;
  summary: string;
  description?: string;
  dtstart: Date;
  dtend: Date;
  location?: string;
  status?: string;
  attendees?: string[];
}

// ─── EXPORT ────────────────────────────────────────────────

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function toICSDate(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function generateICS(events: ICSEvent[], calendarName = 'Avivar Agenda'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Avivar//Agenda//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(calendarName)}`,
    'X-WR-TIMEZONE:America/Sao_Paulo',
  ];

  for (const ev of events) {
    const uid = ev.uid || `${Date.now()}-${Math.random().toString(36).slice(2)}@avivar`;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${toICSDate(new Date())}`);
    lines.push(`DTSTART;TZID=America/Sao_Paulo:${toICSDate(ev.dtstart)}`);
    lines.push(`DTEND;TZID=America/Sao_Paulo:${toICSDate(ev.dtend)}`);
    lines.push(`SUMMARY:${escapeICS(ev.summary)}`);
    if (ev.description) lines.push(`DESCRIPTION:${escapeICS(ev.description)}`);
    if (ev.location) lines.push(`LOCATION:${escapeICS(ev.location)}`);
    if (ev.status) {
      const statusMap: Record<string, string> = {
        confirmed: 'CONFIRMED',
        pending: 'TENTATIVE',
        scheduled: 'TENTATIVE',
        cancelled: 'CANCELLED',
      };
      lines.push(`STATUS:${statusMap[ev.status] || 'TENTATIVE'}`);
    }
    if (ev.attendees) {
      for (const email of ev.attendees) {
        lines.push(`ATTENDEE;RSVP=TRUE:mailto:${email}`);
      }
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(content: string, filename = 'agenda.ics') {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── IMPORT (ICS Parser) ──────────────────────────────────

function unfoldLines(raw: string): string[] {
  // RFC 5545: lines starting with space/tab are continuations
  return raw.replace(/\r\n[ \t]/g, '').replace(/\r/g, '').split('\n');
}

function unescapeICS(text: string): string {
  return text.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

function parseICSDateTime(value: string): Date | null {
  // Formats: 20251111T214000Z (UTC), 20251111T214000 (local), TZID=...:20251111T214000, 20251111 (all-day)
  const isUTC = value.endsWith('Z');
  const cleanValue = value.replace(/^.*:/, ''); // remove TZID=...: prefix
  const match = cleanValue.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?Z?$/);
  if (!match) return null;

  const [, y, mo, d, h, mi, s] = match;
  const year = parseInt(y), month = parseInt(mo) - 1, day = parseInt(d);
  const hour = parseInt(h || '0'), min = parseInt(mi || '0'), sec = parseInt(s || '0');

  if (isUTC) {
    // Convert UTC to local time
    return new Date(Date.UTC(year, month, day, hour, min, sec));
  }
  // Already local time (TZID or no suffix)
  return new Date(year, month, day, hour, min, sec);
}

export function parseICS(content: string): ICSEvent[] {
  const lines = unfoldLines(content);
  const events: ICSEvent[] = [];
  let current: Partial<ICSEvent> | null = null;
  let attendees: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VEVENT') {
      current = {};
      attendees = [];
      continue;
    }
    if (trimmed === 'END:VEVENT') {
      if (current?.dtstart && current?.dtend && current?.summary) {
        events.push({
          ...current,
          summary: current.summary!,
          dtstart: current.dtstart!,
          dtend: current.dtend!,
          attendees: attendees.length > 0 ? attendees : undefined,
        } as ICSEvent);
      }
      current = null;
      continue;
    }
    if (!current) continue;

    // Parse property
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const propPart = trimmed.substring(0, colonIdx);
    const valuePart = trimmed.substring(colonIdx + 1);
    const propName = propPart.split(';')[0].toUpperCase();

    switch (propName) {
      case 'SUMMARY':
        current.summary = unescapeICS(valuePart);
        break;
      case 'DESCRIPTION':
        current.description = unescapeICS(valuePart);
        break;
      case 'LOCATION':
        current.location = unescapeICS(valuePart);
        break;
      case 'DTSTART':
        current.dtstart = parseICSDateTime(trimmed.substring(trimmed.indexOf(':') + 1)) || undefined;
        break;
      case 'DTEND':
        current.dtend = parseICSDateTime(trimmed.substring(trimmed.indexOf(':') + 1)) || undefined;
        break;
      case 'UID':
        current.uid = valuePart;
        break;
      case 'STATUS':
        const statusMap: Record<string, string> = {
          CONFIRMED: 'confirmed',
          TENTATIVE: 'pending',
          CANCELLED: 'cancelled',
        };
        current.status = statusMap[valuePart.toUpperCase()] || 'scheduled';
        break;
      case 'ATTENDEE': {
        const emailMatch = valuePart.match(/mailto:(.+)/i);
        if (emailMatch) attendees.push(emailMatch[1]);
        break;
      }
    }
  }

  return events;
}

// ─── CONVERSION helpers ───────────────────────────────────

export interface AppointmentForExport {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string | null;
  appointment_date: string; // yyyy-MM-dd
  start_time: string; // HH:mm or HH:mm:ss
  end_time: string;
  service_type?: string | null;
  status: string;
  notes?: string | null;
  location?: string | null;
  professional_name?: string | null;
}

export function appointmentsToICSEvents(appointments: AppointmentForExport[]): ICSEvent[] {
  return appointments.map(apt => {
    const [y, mo, d] = apt.appointment_date.split('-').map(Number);
    const [sh, sm] = apt.start_time.split(':').map(Number);
    const [eh, em] = apt.end_time.split(':').map(Number);

    const descParts: string[] = [];
    if (apt.patient_phone) descParts.push(`Telefone: ${apt.patient_phone}`);
    if (apt.service_type) descParts.push(`Procedimento: ${apt.service_type}`);
    if (apt.notes) descParts.push(`Obs: ${apt.notes}`);

    return {
      uid: `${apt.id}@avivar`,
      summary: `${apt.patient_name}${apt.service_type ? ` - ${apt.service_type}` : ''}`,
      description: descParts.join('\n'),
      dtstart: new Date(y, mo - 1, d, sh, sm),
      dtend: new Date(y, mo - 1, d, eh, em),
      location: apt.location || undefined,
      status: apt.status,
      attendees: apt.patient_email ? [apt.patient_email] : undefined,
    };
  });
}

/** Extract patient name and phone from ICS SUMMARY/DESCRIPTION (Google Calendar format) */
export function icsEventToAppointmentData(event: ICSEvent) {
  // Try to extract phone from description
  const phoneMatch = event.description?.match(/(?:Telefone|Tel|Phone)[:\s]*([+\d()\s-]+)/i);
  const phone = phoneMatch ? phoneMatch[1].trim() : '';

  // Try to extract patient name from summary
  // Google Calendar formats:
  // "Consulta ONLINE com Especialista CAPILAR - Paciente NAME FILIAL ..."
  // "Consulta ONLINE com Especialista Capilar - Paciente NAME - NEOFOLIC ..."
  let patientName = event.summary;
  const patientMatch = event.summary.match(/Paciente\s+(.+?)(?:\s+FILIAL\b|\s+-\s+NEOFOLIC\b|\s+NEOFOLIC\b|\s*\.\s*$|\s*$)/i);
  if (patientMatch) {
    patientName = patientMatch[1].trim();
    // Remove trailing dots or dashes
    patientName = patientName.replace(/[\s.\-]+$/, '');
  }

  // Try to extract service from summary
  const serviceMatch = event.summary.match(/^(Consulta[^-]*?)(?:\s*-\s*Paciente)/i);
  const serviceType = serviceMatch ? serviceMatch[1].trim() : null;

  // Try to extract location from summary (FILIAL X or NEOFOLIC X)
  const locationMatch = event.summary.match(/(?:FILIAL|NEOFOLIC)\s+([^,.]+)/i);
  const location = locationMatch ? locationMatch[1].trim() : event.location || null;

  // Extract email from description or attendees
  const emailMatch = event.description?.match(/(?:Email|E-mail)[:\s]*([^\s\n]+@[^\s\n]+)/i);
  const email = emailMatch ? emailMatch[1] : event.attendees?.[0] || null;

  return {
    patient_name: patientName,
    patient_phone: phone,
    patient_email: email,
    appointment_date: `${event.dtstart.getFullYear()}-${pad(event.dtstart.getMonth() + 1)}-${pad(event.dtstart.getDate())}`,
    start_time: `${pad(event.dtstart.getHours())}:${pad(event.dtstart.getMinutes())}`,
    end_time: `${pad(event.dtend.getHours())}:${pad(event.dtend.getMinutes())}`,
    service_type: serviceType,
    status: event.status || 'scheduled',
    notes: event.description || null,
    location: location,
  };
}
