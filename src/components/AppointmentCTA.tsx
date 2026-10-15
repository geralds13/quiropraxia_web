"use client";

import { CalendarCheck, Mail, MapPin, Phone } from "lucide-react";

import { useBooking } from "@/components/BookingProvider";
import { Reveal } from "@/components/Reveal";
import { CONTACT } from "@/data/site";

export default function AppointmentCTA() {
  const { openBookingModal } = useBooking();

  return (
    <section id="cita" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="glass-panel relative overflow-hidden rounded-3xl border border-wellness-500/30 bg-gradient-to-br from-wellness-card via-wellness-darkBg to-wellness-card p-8 sm:p-12 lg:p-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-wellness-500/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-wellness-accent/20 blur-3xl"
            />

            <div className="relative flex flex-col items-center gap-8 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-wellness-500/30 bg-wellness-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.18em] text-wellness-400">
                  <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Agendar cita
                </span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Da el primer paso hacia una columna saludable
                </h2>
                <p className="mt-3 text-base leading-relaxed text-slate-300">
                  Reserva en línea tu servicio, fecha y hora. Nuestro equipo te
                  contactará por WhatsApp para confirmar los detalles de tu cita
                  en {CONTACT.address}.
                </p>
                <div className="mt-5 flex flex-col gap-2 text-sm text-slate-300 sm:flex-row sm:flex-wrap sm:gap-x-6">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-wellness-400" aria-hidden="true" />
                    {CONTACT.address}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4 text-wellness-400" aria-hidden="true" />
                    {CONTACT.phoneDisplay}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4 text-wellness-400" aria-hidden="true" />
                    {CONTACT.email}
                  </span>
                </div>
              </div>

              <div className="flex w-full max-w-sm flex-col gap-3">
                <button
                  type="button"
                  onClick={() => openBookingModal()}
                  className="btn-glow inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-wellness-primary to-wellness-accent px-6 text-base font-semibold text-white active:scale-[0.98]"
                >
                  <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                  Reservar mi cita online
                </button>
                <p className="text-center text-xs text-slate-400">
                  Reserva 100% en línea en pocos pasos, con confirmación de
                  disponibilidad en tiempo real.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
