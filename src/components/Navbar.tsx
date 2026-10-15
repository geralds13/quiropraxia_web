"use client";

import { useState } from "react";
import { HeartPulse, Menu, Phone, X } from "lucide-react";

import { useBooking } from "@/components/BookingProvider";
import { BRAND, NAV_LINKS, CONTACT } from "@/data/site";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { openBookingModal } = useBooking();

  return (
    <header className="animate-step-in sticky top-0 z-50 border-b border-white/5 bg-wellness-darkBg/80 shadow-lg shadow-black/20 backdrop-blur-xl">
      {/* Franja superior con datos rápidos */}
      <div className="border-b border-wellness-border bg-wellness-card/60">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-2 text-[11px] font-semibold tracking-wide text-slate-300 sm:px-6 lg:px-8">
          <span className="truncate">
            {BRAND.tagline} — Tarapoto, San Martín
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-wellness-400">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            {CONTACT.phoneDisplay}
          </span>
        </div>
      </div>

      <div className="mx-auto flex h-18 w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <a href="#inicio" className="flex shrink-0 items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-wellness-500 to-wellness-accent text-white shadow-lg shadow-wellness-500/30 transition-transform duration-300 hover:scale-105">
            <HeartPulse className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-sm font-bold text-white">{BRAND.name}</span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-wellness-400">
              Quiropraxia clínica
            </span>
          </span>
        </a>

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-white active:scale-[0.97]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => openBookingModal()}
            className="btn-glow hidden h-11 items-center rounded-lg bg-gradient-to-r from-wellness-primary to-wellness-accent px-4 text-sm font-semibold text-white active:scale-[0.97] sm:inline-flex"
          >
            Agendar Cita
          </button>

          <button
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            className="grid h-11 w-11 place-items-center rounded-lg border border-wellness-border text-slate-200 transition-all hover:border-wellness-500/50 hover:text-white active:scale-[0.95] lg:hidden"
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div className="animate-step-in border-t border-wellness-border bg-wellness-darkBg/95 backdrop-blur-xl lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-white active:scale-[0.98]"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openBookingModal();
              }}
              className="btn-glow mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-wellness-primary to-wellness-accent text-sm font-semibold text-white active:scale-[0.98]"
            >
              Agendar Cita
            </button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}