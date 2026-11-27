'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { asset, services, site, whatsappLink } from '@/lib/site';
import { BOOK_EVENT, availableDays, bookingMessage, formatPhone, slotsFor, type BookingDay } from '@/lib/booking';
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal } from '../ui/Reveal';
import { Arrow } from '../ui/Button';

function StepTitle({ n, title, done, hint }: { n: string; title: string; done: boolean; hint?: string }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full border font-mono text-[11px] transition-colors duration-500 ${
          done ? 'border-brand bg-brand text-ink' : 'border-white/20 text-chrome'
        }`}
      >
        {done ? (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
            <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          n
        )}
      </span>
      <h3 className="text-lg font-medium text-white">{title}</h3>
      {hint && <span className="ml-auto hidden font-mono text-[10px] tracking-[0.16em] text-silver/70 uppercase sm:block">{hint}</span>}
    </div>
  );
}

const chip = (active: boolean) =>
  `relative rounded-2xl border text-left transition-all duration-300 focus-visible:outline-2 ${
    active
      ? 'border-brand bg-brand/[0.08] text-white shadow-[0_0_0_1px_rgba(248,210,17,0.35),0_10px_30px_-12px_rgba(248,210,17,0.5)]'
      : 'border-white/10 bg-white/[0.02] text-chrome/80 hover:border-white/25 hover:bg-white/[0.05] hover:text-white'
  }`;

export function Booking() {
  const [serviceId, setServiceId] = useState<string>('');
  const [days, setDays] = useState<BookingDay[]>([]);
  const [day, setDay] = useState<BookingDay | null>(null);
  const [time, setTime] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);
  const daysRef = useRef<HTMLDivElement>(null);

  // datas calculadas no navegador (o site é estático: a data de build não serve)
  useEffect(() => {
    const d = availableDays();
    setDays(d);
    setDay(d[0] ?? null);
  }, []);

  // cards de serviço e CTAs abrem o agendamento já com o serviço escolhido
  useEffect(() => {
    const on = (e: Event) => {
      const id = (e as CustomEvent<string | undefined>).detail;
      if (id) setServiceId(id);
    };
    window.addEventListener(BOOK_EVENT, on);
    return () => window.removeEventListener(BOOK_EVENT, on);
  }, []);

  const slots = useMemo(() => (day ? slotsFor(day.date) : []), [day]);
  useEffect(() => {
    if (time && !slots.find((s) => s.label === time && s.available)) setTime('');
  }, [slots, time]);

  const service = services.find((s) => s.id === serviceId);
  const phoneOk = phone.replace(/\D/g, '').length >= 10;
  const missing = [
    !service && 'serviço',
    !day && 'data',
    !time && 'horário',
    !vehicle.trim() && 'modelo do veículo',
    !name.trim() && 'nome',
    !phoneOk && 'telefone',
  ].filter(Boolean) as string[];
  const valid = missing.length === 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid || !day) return;
    const text = bookingMessage({ serviceId, day, time, vehicle: vehicle.trim(), name: name.trim(), phone, notes });
    window.open(whatsappLink(text), '_blank', 'noopener,noreferrer');
    setSent(true);
  };

  const input =
    'peer h-14 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 pt-4 text-[15px] text-white outline-none transition-colors duration-300 placeholder:text-transparent focus:border-brand/70 focus:bg-white/[0.05]';
  const label =
    'pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[15px] text-silver transition-all duration-300 peer-focus:top-4 peer-focus:text-[10px] peer-focus:tracking-[0.14em] peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:tracking-[0.14em] peer-[:not(:placeholder-shown)]:uppercase';
  const err = (bad: boolean) => (tried && bad ? 'border-red-400/60' : '');

  return (
    <section id="agendamento" className="relative overflow-hidden py-28 md:py-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="pointer-events-none absolute -left-[20vw] top-1/4 h-[50vh] w-[50vw] rounded-full bg-water/[0.06] blur-[140px]" />

      <div className="relative mx-auto max-w-[1440px] px-5 md:px-10">
        <SectionHeading index="05" eyebrow="Agendamento" title={['Agende sua', 'experiência.']}>
          Escolha o serviço, o dia e o horário. Você confirma tudo pelo WhatsApp e recebe a resposta da nossa equipe.
        </SectionHeading>

        <form onSubmit={submit} noValidate className="mt-16 grid grid-cols-1 gap-6 md:mt-20 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {/* 1. Serviço */}
            <Reveal className="hairline rounded-[26px] bg-graphite/60 p-5 md:p-8">
              <fieldset className="min-w-0">
                <legend className="w-full">
                  <StepTitle n="1" title="Escolha o serviço" done={!!service} />
                </legend>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setServiceId(s.id)}
                      aria-pressed={serviceId === s.id}
                      className={`${chip(serviceId === s.id)} p-4 ${tried && !service ? 'border-red-400/40' : ''}`}
                    >
                      <span className="block text-[14px] leading-tight font-medium">{s.name}</span>
                      <span className="mt-2 block font-mono text-[10px] tracking-[0.14em] text-silver uppercase">{s.duration}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </Reveal>

            {/* 2. Data e 3. Horário */}
            <Reveal className="hairline rounded-[26px] bg-graphite/60 p-5 md:p-8">
              <fieldset className="min-w-0">
                <legend className="w-full">
                  <StepTitle n="2" title="Selecione o dia" done={!!day} hint={day ? day.date.toLocaleDateString('pt-BR', { month: 'long' }) : undefined} />
                </legend>
                <div ref={daysRef} className="-mx-5 flex snap-x gap-2.5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:-mx-8 md:px-8 [&::-webkit-scrollbar]:hidden">
                  {days.length === 0 && <div className="h-[86px] w-full animate-pulse rounded-2xl bg-white/[0.03]" />}
                  {days.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setDay(d)}
                      aria-pressed={day?.key === d.key}
                      aria-label={d.date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      className={`${chip(day?.key === d.key)} flex w-[76px] shrink-0 snap-start flex-col items-center py-3.5`}
                    >
                      <span className="font-mono text-[10px] tracking-[0.12em] text-silver uppercase">{d.weekday}</span>
                      <span className="display mt-1.5 text-2xl">{d.day}</span>
                      <span className="font-mono text-[10px] text-silver/80 uppercase">{d.month}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="my-7 h-px bg-white/[0.07]" />

              <fieldset className="min-w-0">
                <legend className="w-full">
                  <StepTitle n="3" title="Escolha o horário" done={!!time} hint="Horários disponíveis" />
                </legend>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 md:grid-cols-6">
                  {slots.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setTime(s.label)}
                      aria-pressed={time === s.label}
                      className={`${chip(time === s.label)} py-3 text-center font-mono text-sm tabular-nums disabled:cursor-not-allowed disabled:border-white/[0.04] disabled:bg-transparent disabled:text-white/20 disabled:line-through ${
                        tried && !time ? 'border-red-400/40' : ''
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </Reveal>

            {/* 4. Dados */}
            <Reveal className="hairline rounded-[26px] bg-graphite/60 p-5 md:p-8">
              <fieldset className="min-w-0">
                <legend className="w-full">
                  <StepTitle n="4" title="Seus dados" done={!!vehicle.trim() && !!name.trim() && phoneOk} />
                </legend>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="relative md:col-span-2">
                    <input id="veiculo" className={`${input} ${err(!vehicle.trim())}`} placeholder="Modelo do veículo" value={vehicle} onChange={(e) => setVehicle(e.target.value)} autoComplete="off" required />
                    <label htmlFor="veiculo" className={label}>Modelo do veículo</label>
                  </div>
                  <div className="relative">
                    <input id="nome" className={`${input} ${err(!name.trim())}`} placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
                    <label htmlFor="nome" className={label}>Seu nome</label>
                  </div>
                  <div className="relative">
                    <input
                      id="telefone"
                      className={`${input} ${err(!phoneOk)}`}
                      placeholder="Telefone"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      inputMode="tel"
                      autoComplete="tel"
                      required
                    />
                    <label htmlFor="telefone" className={label}>Telefone (WhatsApp)</label>
                  </div>
                  <div className="relative md:col-span-2">
                    <input id="obs" className={input} placeholder="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} autoComplete="off" />
                    <label htmlFor="obs" className={label}>Observações (opcional)</label>
                  </div>
                </div>
              </fieldset>
            </Reveal>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-4">
            <Reveal className="hairline sticky top-24 overflow-hidden rounded-[26px] bg-graphite">
              <div className="relative aspect-[16/10] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={service?.image ?? 'default'}
                    src={asset(service?.image ?? '/media/after.webp')}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-graphite via-graphite/20 to-transparent" />
              </div>
              <div className="relative -mt-8 p-6 md:p-8">
                <p className="eyebrow">Resumo</p>
                <dl className="mt-5 divide-y divide-white/[0.07] text-sm">
                  {[
                    ['Serviço', service?.name],
                    ['Data', day?.date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })],
                    ['Horário', time],
                    ['Veículo', vehicle.trim()],
                    ['Duração', service?.duration],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-4 py-3">
                      <dt className="text-silver">{k}</dt>
                      <dd className={`text-right ${v ? 'text-white' : 'text-white/25'}`}>{v || '—'}</dd>
                    </div>
                  ))}
                </dl>

                <button
                  type="submit"
                  className={`group relative mt-6 flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-full text-[15px] font-medium transition-all duration-500 ${
                    valid ? 'bg-brand text-ink shadow-[0_14px_50px_-12px_rgba(248,210,17,0.7)]' : 'bg-white/[0.06] text-white/60'
                  }`}
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-[900ms] group-hover:translate-x-full" />
                  <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="currentColor" aria-hidden>
                    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
                  </svg>
                  <span className="relative">Confirmar pelo WhatsApp</span>
                  <Arrow className="relative" />
                </button>

                <AnimatePresence mode="wait">
                  {sent ? (
                    <motion.p key="ok" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-center text-sm text-chrome" role="status">
                      Abrimos o WhatsApp com a mensagem pronta. É só enviar.
                    </motion.p>
                  ) : (
                    <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center text-xs text-silver" role="status">
                      {valid ? 'Tudo certo. A confirmação chega em minutos.' : tried ? `Falta: ${missing.join(', ')}.` : 'Sem pagamento antecipado. Confirmação humana.'}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
            <p className="mt-4 px-2 text-center font-mono text-[10px] tracking-[0.16em] text-silver/60 uppercase">
              Prefere falar direto?{' '}
              <a href={whatsappLink(`Olá, ${site.fullName}! Quero tirar uma dúvida.`)} target="_blank" rel="noopener noreferrer" className="text-chrome underline-offset-4 hover:text-brand hover:underline">
                {site.phoneDisplay}
              </a>
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
