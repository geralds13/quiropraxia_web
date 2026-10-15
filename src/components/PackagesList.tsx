"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, RefreshCw, Sparkles } from "lucide-react";

import { useBooking } from "@/components/BookingProvider";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { getPublicPackages } from "@/services/wellnessService";
import type { PublicPackage } from "@/types/wellness";
import { formatSoles } from "@/lib/format";

export function PackagesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((key) => (
        <div
          key={key}
          className="animate-pulse rounded-2xl border border-wellness-border bg-wellness-card p-6"
        >
          <div className="h-5 w-2/3 rounded bg-white/10" />
          <div className="mt-3 h-3 w-5/6 rounded bg-white/10" />
          <div className="mt-3 h-3 w-4/6 rounded bg-white/10" />
          <div className="mt-6 h-10 rounded-lg bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export default function PackagesList() {
  const { openBookingModal } = useBooking();
  const [packages, setPackages] = useState<PublicPackage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPackages(null);
      setPackages(await getPublicPackages());
    } catch {
      setError(
        "No pudimos cargar los paquetes en este momento. Reintenta en unos segundos.",
      );
      setPackages(null);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch inicial
    void load();
  }, [load]);

  return (
    <section id="paquetes" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Paquetes de tratamiento"
          title="Programas que sostienen tu recuperación"
          description="Combina ajustes, terapia y seguimiento con planes progresivos que optimizan resultado por sesión y cuidando tu inversión."
        />

        <div className="mt-12">
          {packages === null && error === null ? <PackagesSkeleton /> : null}

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

          {packages && packages.length === 0 ? (
            <p className="text-center text-sm text-slate-400">
              Aún no publicamos paquetes. Vuelve pronto.
            </p>
          ) : null}

          {packages && packages.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((entry, index) => (
                <Reveal key={entry.id} delay={index * 100} className="h-full">
                  <div className="glass-card relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-950/30">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-wellness-500/10 blur-2xl"
                    />
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-wellness-primary to-wellness-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      Paquete terapéutico
                    </span>

                    <h3 className="mt-4 text-lg font-bold text-white">
                      {entry.name}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-300">
                      {entry.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                      <span className="inline-flex items-center gap-1 rounded-full bg-wellness-500/10 px-2.5 py-1 font-semibold text-wellness-400">
                        <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                        {entry.total_sessions} sesiones
                      </span>
                      {entry.sauna_sessions > 0 ? (
                        <span className="inline-flex rounded-full bg-wellness-accent/10 px-2.5 py-1 font-semibold text-wellness-accent">
                          {entry.sauna_sessions} con sauna
                        </span>
                      ) : null}
                      {entry.validity_days > 0 ? (
                        <span className="inline-flex rounded-full bg-wellness-card px-2.5 py-1 font-medium text-slate-400">
                          Válido {entry.validity_days} días
                        </span>
                      ) : null}
                    </div>

                    {entry.package_contents.length > 0 ? (
                      <ul className="mt-4 space-y-1.5">
                        {entry.package_contents.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-xs text-slate-400"
                          >
                            <CheckCircle2
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-wellness-400"
                              aria-hidden="true"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="mt-5 flex items-center justify-between border-t border-wellness-border pt-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">
                          Inversión total
                        </p>
                        <p className="text-2xl font-bold text-wellness-400">
                          {formatSoles(entry.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          openBookingModal({ type: "PACKAGE", id: entry.id })
                        }
                        className="btn-glow inline-flex h-10 items-center rounded-lg bg-gradient-to-r from-wellness-primary to-wellness-accent px-4 text-xs font-semibold text-white active:scale-[0.97]"
                      >
                        Reservar
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