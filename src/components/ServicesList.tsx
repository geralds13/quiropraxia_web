"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, RefreshCw, Timer } from "lucide-react";

import { useBooking } from "@/components/BookingProvider";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { getPublicServices } from "@/services/wellnessService";
import type { PublicService } from "@/types/wellness";
import { formatDuration, formatSoles } from "@/lib/format";

export function ServicesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((key) => (
        <div
          key={key}
          className="animate-pulse rounded-2xl border border-wellness-border bg-wellness-card p-6"
        >
          <div className="h-5 w-3/4 rounded bg-white/10" />
          <div className="mt-3 h-3 rounded bg-white/10" />
          <div className="mt-2 h-3 w-5/6 rounded bg-white/10" />
          <div className="mt-6 h-9 w-1/2 rounded-lg bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export default function ServicesList() {
  const { openBookingModal } = useBooking();
  const [services, setServices] = useState<PublicService[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setServices(null);
      const items = await getPublicServices();
      setServices(items);
    } catch {
      setError(
        "No pudimos cargar los servicios en este momento. Reintenta en unos segundos.",
      );
      setServices(null);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch inicial
    void load();
  }, [load]);

  return (
    <section id="servicios" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Servicios"
          title="Tratamientos diseñados para tu recuperación"
          description="Ajustes, terapia manual y rehabilitación en sesiones guiadas por profesionales. Cada servicio incluye evaluación previa y seguimiento."
        />

        <div className="mt-12">
          {services === null && error === null ? <ServicesSkeleton /> : null}

          {error ? (
            <div className="mx-auto max-w-md rounded-2xl border border-wellness-border bg-wellness-card p-8 text-center">
              <p className="text-sm text-slate-300">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-wellness-primary to-wellness-accent px-5 py-2.5 text-sm font-semibold text-white"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Reintentar
              </button>
            </div>
          ) : null}

          {services && services.length === 0 ? (
            <p className="text-center text-sm text-slate-400">
              Aún no publicamos servicios. Vuelve pronto.
            </p>
          ) : null}

          {services && services.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <Reveal key={service.id} delay={index * 80} className="h-full">
                  <div className="glass-card group flex h-full flex-col rounded-2xl border border-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-950/30">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex rounded-full bg-wellness-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-wellness-400">
                        {service.category_display || "Tratamiento"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatDuration(service.duration_minutes)}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-white">
                      {service.name}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-300">
                      {service.description}
                    </p>

                    {service.includes.length > 0 ? (
                      <ul className="mt-4 space-y-1.5">
                        {service.includes.slice(0, 3).map((include) => (
                          <li
                            key={include}
                            className="flex items-start gap-2 text-xs text-slate-400"
                          >
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-wellness-400" />
                            {include}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="mt-5 flex items-center justify-between border-t border-wellness-border pt-4">
                      <span className="text-xl font-bold text-wellness-400">
                        {formatSoles(service.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => openBookingModal(service.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-wellness-border px-3 py-2 text-xs font-semibold text-slate-200 transition-all group-hover:border-wellness-500/50 group-hover:text-white active:scale-[0.96]"
                      >
                        Agendar
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}