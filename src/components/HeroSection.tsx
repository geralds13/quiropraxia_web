"use client";

import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

import { useBooking } from "@/components/BookingProvider";
import { Reveal } from "@/components/Reveal";
import { SPECIALTIES } from "@/data/site";

const TRUST = [
  { icon: ShieldCheck, label: "Profesionales certificados" },
  { icon: Sparkles, label: "Atención personalizada" },
  { icon: UserCheck, label: "Sin fármacos invasivos" },
];

export default function HeroSection() {
  const { openBookingModal } = useBooking();

  return (
    <section id="inicio" className="relative overflow-hidden">
      {/* Resplandores decorativos */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-wellness-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-wellness-accent/20 blur-3xl"
      />

      <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal delay={0}>
          <span className="inline-flex items-center gap-2 rounded-full border border-wellness-500/30 bg-wellness-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-wellness-400">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            Quiropraxia clínica · Bienestar integral
          </span>
        </Reveal>

        <Reveal delay={90} className="max-w-4xl text-center">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Alivio del dolor,{" "}
            <span className="bg-gradient-to-r from-wellness-400 to-wellness-accent bg-clip-text text-transparent">
              alineación vertebral
            </span>{" "}
            y bienestar integral
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            Recupera tu biomecánica con ajustes quiroprácticos precisos, terapia
            manual y programas personalizados. Sin fármacos invasivos, con un
            enfoque centrado en tu cuerpo y tu historia clínica.
          </p>
        </Reveal>

        <Reveal delay={180} className="w-full sm:w-auto">
          <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={() => openBookingModal()}
              className="btn-glow animate-glow-pulse inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-wellness-primary to-wellness-accent px-7 text-base font-semibold text-white active:scale-[0.98] sm:w-auto"
            >
              Agendar mi primera cita
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <a
              href="#servicios"
              className="inline-flex h-13 w-full items-center justify-center rounded-xl border border-wellness-border bg-wellness-card/60 px-7 text-base font-semibold text-slate-200 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-wellness-500/50 hover:text-white active:scale-[0.98] sm:w-auto"
            >
              Explorar tratamientos
            </a>
          </div>
        </Reveal>

        {/* Badges de confianza */}
        <Reveal delay={260}>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {TRUST.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-wellness-border bg-wellness-card px-3.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-wellness-500/40"
              >
                <Icon className="h-3.5 w-3.5 text-wellness-400" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Resumen de especialidades */}
        <div className="mt-4 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SPECIALTIES.map((specialty, index) => (
            <Reveal key={specialty} delay={320 + index * 80} className="h-full">
              <div className="glass-card h-full rounded-2xl border border-white/5 p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-wellness-500/40 hover:shadow-lg hover:shadow-wellness-500/10">
                <p className="text-sm font-semibold text-white">{specialty}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Evaluación y seguimiento personalizado
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}