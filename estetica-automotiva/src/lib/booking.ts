import { site, services } from './site';
import { scrollToId } from './scroll';

export type BookingDay = { key: string; date: Date; weekday: string; day: string; month: string };

const WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function hoursFor(d: Date) {
  return site.hours.find((h) => h.day === d.getDay());
}

/** Próximos dias com expediente e pelo menos um horário livre. */
export function availableDays(now = new Date()): BookingDay[] {
  const out: BookingDay[] = [];
  for (let i = 0; i < site.bookingWindowDays; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const h = hoursFor(d);
    if (!h || h.open === null) continue;
    if (slotsFor(d, now).every((s) => !s.available)) continue;
    out.push({
      key: dayKey(d),
      date: d,
      weekday: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : WEEK[d.getDay()],
      day: pad(d.getDate()),
      month: MONTHS[d.getMonth()],
    });
  }
  return out;
}

export type Slot = { label: string; available: boolean };

/** Horários de hora em hora dentro do expediente; o último começa 1h antes de fechar. */
export function slotsFor(d: Date, now = new Date()): Slot[] {
  const h = hoursFor(d);
  if (!h || h.open === null || h.close === null) return [];
  const slots: Slot[] = [];
  const sameDay = dayKey(d) === dayKey(now);
  for (let hour = h.open; hour < h.close; hour++) {
    const label = `${pad(hour)}:00`;
    // No dia de hoje, só horários com pelo menos 1h de antecedência
    const past = sameDay && hour <= now.getHours();
    const blocked = site.blockedSlots.includes(`${dayKey(d)} ${label}`);
    slots.push({ label, available: !past && !blocked });
  }
  return slots;
}

export function formatPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export type BookingData = {
  serviceId: string;
  day: BookingDay;
  time: string;
  vehicle: string;
  name: string;
  phone: string;
  notes?: string;
};

export function bookingMessage(b: BookingData) {
  const s = services.find((x) => x.id === b.serviceId);
  const date = b.day.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  const lines = [
    `Olá, ${site.fullName}! Quero agendar uma experiência.`,
    '',
    `*Serviço:* ${s?.name ?? b.serviceId}`,
    `*Data:* ${date}`,
    `*Horário:* ${b.time}`,
    `*Veículo:* ${b.vehicle}`,
    `*Nome:* ${b.name}`,
    `*Telefone:* ${b.phone}`,
  ];
  if (b.notes?.trim()) lines.push(`*Observações:* ${b.notes.trim()}`);
  lines.push('', 'Aguardo a confirmação.');
  return lines.join('\n');
}

/** Os cards de serviço chamam isto para abrir o agendamento já com o serviço escolhido. */
export const BOOK_EVENT = 'impacto:book';
export function requestBooking(serviceId?: string) {
  window.dispatchEvent(new CustomEvent(BOOK_EVENT, { detail: serviceId }));
  scrollToId('agendamento');
}
