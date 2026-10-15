"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Clock,
  Coffee,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  Timer,
  Users,
} from "lucide-react";

import { useBooking } from "@/components/BookingProvider";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { getOperatingSchedules } from "@/services/wellnessService";
import type { OperatingSchedule, ScheduleShift } from "@/types/wellness";
import { formatClock } from "@/lib/format";

const NOTES = [
  {
    icon: Users,
    title: "Capacidad",
    text: "Atención personalizada sujeta a disponibilidad de camillas simultáneas.",
  },
  {
    icon: Timer,
    title: "Puntualidad",
    text: "Se recomienda asistir con 10 minutos de anticipación.",
  },
  {
    icon: ShieldCheck,
    title: "Protocolo",
    text: "Bloqueos de desinfección garantizados entre cada paciente.",
  },
] as const;

/** Convierte ``"08:00"`` en minutos desde medianoche. */
function toMinutes(value: string): number | null {
  const [rawHours, rawMinutes] = value.split(":");
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

/** ¿La hora actual cae dentro del turno indicado? */
function isWithinShift(shift: ScheduleShift | null, nowMinutes: number): boolean {
  if (!shift) return false;
  const start = toMinutes(shift.start);
  const end = toMinutes(shift.end);
  if (start === null || end === null) return false;
  return nowMinutes >= start && nowMinutes < end;
}

/** Reloj reactivo (se refresca cada minuto) para el indicador en vivo. */
function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reloj del cliente
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return now;
}

export function OperatingHoursSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {[1, 2, 3, 4, 5, 6].map((key) => (
        <div
          key={key}
          className="animate-pulse rounded-2xl border border-white/5 bg-slate-900/40 p-5"
        >
          <div className="h-4 w-1/2 rounded bg-white/10" />
          <div className="mt-4 h-9 rounded-xl bg-white/10" />
          <div className="mt-2 h-9 rounded-xl bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export default function OperatingHoursSection() {
  const { openBookingModal } = useBooking();
  const [schedules, setSchedules] = useState<OperatingSchedule[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = useNow();

  const load = useCallback(async () => {
    setError(null);
    try {
      setSchedules(null);
      setSchedules(await getOperatingSchedules());
    } catch {
      setError(
        "No pudimos cargar los horarios de atención. Reintenta en unos segundos.",
      );
      setSchedules(null);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch inicial
    void load();
  }, [load]);

  const todayDow = now ? (now.getDay() + 6) % 7 : null;
  const nowMinutes = now ? now.getHours() * 60 + now.getMinutes() : null;

  // Estado en vivo del centro: abierto si hoy no está cerrado y estamos en turno.
  const isOpenNow = useMemo(() => {
    if (!schedules || todayDow === null || nowMinutes === null) return null;
    const today = schedules.find((item) => item.day_of_week === todayDow);
    if (!today || today.is_closed) return false;
    return (
      isWithinShift(today.morning, nowMinutes) ||
      isWithinShift(today.afternoon, nowMinutes)
    );
  }, [schedules, todayDow, nowMinutes]);

  return (
    <section id="horarios" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Horarios de atención"
          title="Planifica tu visita en el horario que prefieras"
          description="Atendemos de lunes a sábado en dos turnos con protocolo de desinfección entre pacientes. Consulta nuestra disponibilidad semanal y reserva tu cita en línea."
        />

        <Reveal className="mt-12">
          <div className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-900/60 shadow-2xl shadow-emerald-950/40 backdrop-blur-xl">
            {/* Encabezado del bloque */}
            <div className="relative flex flex-col gap-4 border-b border-white/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7 lg:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"
              />
              <div className="relative">
                <h3 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                  Agenda semanal de atención
                </h3>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-400">
                  Dos turnos diarios con receso de mediodía para desinfección y
                  refrigerio del equipo clínico.
                </p>
              </div>
              <StatusBadge state={isOpenNow} />
            </div>

            {/* Turnos por día */}
            <div className="p-4 sm:p-6 lg:p-8">
              {schedules === null && error === null ? (
                <OperatingHoursSkeleton />
              ) : null}

              {error ? (
                <div className="mx-auto max-w-md rounded-2xl border border-white/5 bg-slate-900/40 p-8 text-center">
                  <p className="text-sm text-slate-300">{error}</p>
                  <button
                    type="button"
                    onClick={() => void load()}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-wellness-primary to-wellness-accent px-5 py-2.5 text-sm font-semibold text-white active:scale-[0.97]"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Reintentar
                  </button>
                </div>
              ) : null}

              {schedules && schedules.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {schedules.map((schedule, index) => (
                    <Reveal
                      key={schedule.day_of_week}
                      delay={index * 60}
                      className="h-full"
                    >
                      <DayCard
                        schedule={schedule}
                        isToday={schedule.day_of_week === todayDow}
                      />
                    </Reveal>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Notas operativas al pie */}
            {schedules && schedules.length > 0 ? (
              <div className="border-t border-white/5 bg-slate-950/30 p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {NOTES.map(({ icon: Icon, title, text }) => (
                    <div
                      key={title}
                      className="flex items-start gap-3 rounded-2xl border border-white/5 bg-slate-900/40 p-4"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                          {text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex justify-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => openBookingModal()}
                    className="btn-glow inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-wellness-primary to-wellness-accent px-6 text-sm font-semibold text-white active:scale-[0.97] sm:w-auto"
                  >
                    <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                    Agendar ahora
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StatusBadge({ state }: { state: boolean | null }) {
  if (state === true) {
    return (
      <span className="relative inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-300">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Abierto ahora
      </span>
    );
  }

  if (state === false) {
    return (
      <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
        <span className="h-2 w-2 rounded-full bg-slate-500" />
        Cerrado en este momento
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
      <span className="h-2 w-2 animate-pulse rounded-full bg-slate-500" />
      Verificando estado
    </span>
  );
}

function DayCard({
  schedule,
  isToday,
}: {
  schedule: OperatingSchedule;
  isToday: boolean;
}) {
  const open = !schedule.is_closed;
  const showRecess = open && schedule.morning != null && schedule.afternoon != null;

  return (
    <div
      className={`relative flex h-full flex-col gap-3 rounded-2xl border p-4 transition-all duration-300 sm:p-5 ${
        isToday
          ? "border-emerald-500/40 bg-emerald-950/20"
          : "border-white/5 bg-slate-900/40"
      } ${open ? "hover:border-emerald-500/30" : "opacity-80"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-bold text-white">
          {schedule.day_name}
          {isToday ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
              Hoy
            </span>
          ) : null}
        </h4>
        {open ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Abierto
          </span>
        ) : (
          <span className="inline-flex shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Sin atención
          </span>
        )}
      </div>

      {open ? (
        <div className="space-y-2">
          <ShiftRow
            icon={<Sun className="h-3.5 w-3.5" aria-hidden="true" />}
            label="Turno mañana"
            range={schedule.morning}
          />
          {showRecess ? <Recess /> : null}
          <ShiftRow
            icon={<Moon className="h-3.5 w-3.5" aria-hidden="true" />}
            label="Turno tarde / noche"
            range={schedule.afternoon}
          />
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-slate-500">
          Cerrado este día. Elige otra fecha para tu cita.
        </p>
      )}
    </div>
  );
}

function ShiftRow({
  icon,
  label,
  range,
}: {
  icon: React.ReactNode;
  label: string;
  range: ScheduleShift | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/50 px-3 py-2.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300">
        <span className="text-wellness-400">{icon}</span>
        {label}
      </span>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-100">
        {range ? (
          <>
            <Clock className="h-3 w-3 text-slate-500" aria-hidden="true" />
            <span className="whitespace-nowrap">
              {formatClock(range.start)} – {formatClock(range.end)}
            </span>
          </>
        ) : (
          <span className="text-slate-500">No disponible</span>
        )}
      </span>
    </div>
  );
}

function Recess() {
  return (
    <div className="flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
      <span className="h-px flex-1 bg-white/10" />
      <span className="inline-flex items-center gap-1 whitespace-nowrap">
        <Coffee className="h-3 w-3" aria-hidden="true" />
        Receso · desinfección
      </span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}
