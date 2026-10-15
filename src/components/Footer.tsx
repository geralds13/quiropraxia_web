import { Clock, HeartPulse, Mail, MapPin, Phone } from "lucide-react";

import { Reveal } from "@/components/Reveal";
import { BRAND, CONTACT, NAV_LINKS } from "@/data/site";

export default function Footer() {
  return (
    <footer className="border-t border-wellness-border bg-wellness-card/40">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Marca */}
        <Reveal>
          <a href="#inicio" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-wellness-500 to-wellness-accent text-white">
              <HeartPulse className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-base font-bold text-white">{BRAND.name}</span>
          </a>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            {BRAND.tagline}. Centro de quiropraxia clínica dedicado al alivio
            del dolor, la alineación vertebral y el bienestar integral de
            nuestros pacientes.
          </p>
        </Reveal>

        {/* Enlaces */}
        <Reveal delay={80}>
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Secciones
          </h3>
          <ul className="mt-4 space-y-2.5">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="inline-block text-sm text-slate-300 transition-all hover:translate-x-0.5 hover:text-wellness-400"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Horario */}
        <Reveal delay={160}>
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Horario de atención
          </h3>
          <ul className="mt-4 space-y-2.5">
            {CONTACT.hours.map((row) => (
              <li key={row.days} className="text-sm text-slate-300">
                <span className="block text-slate-400">{row.days}</span>
                <span className="font-medium text-white">{row.time}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Contacto */}
        <Reveal delay={240}>
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Contacto
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2.5">
              <MapPin
                className="mt-0.5 h-4 w-4 shrink-0 text-wellness-400"
                aria-hidden="true"
              />
              {CONTACT.address}
            </li>
            <li>
              <a
                href={`tel:+${CONTACT.phone}`}
                className="flex items-center gap-2.5 transition-colors hover:text-wellness-400"
              >
                <Phone className="h-4 w-4 shrink-0 text-wellness-400" aria-hidden="true" />
                {CONTACT.phoneDisplay}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${CONTACT.email}`}
                className="flex items-center gap-2.5 transition-colors hover:text-wellness-400"
              >
                <Mail className="h-4 w-4 shrink-0 text-wellness-400" aria-hidden="true" />
                {CONTACT.email}
              </a>
            </li>
          </ul>
          <a
            href="#cita"
            className="btn-glow mt-5 inline-flex h-11 items-center rounded-lg bg-gradient-to-r from-wellness-primary to-wellness-accent px-5 text-sm font-semibold text-white active:scale-[0.97]"
          >
            Agendar Cita
          </a>
        </Reveal>
      </div>

      <div className="border-t border-wellness-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 {BRAND.name} — Todos los derechos reservados.</p>
          <p>Quiropraxia clínica · Tarapoto, San Martín · Perú</p>
        </div>
      </div>
    </footer>
  );
}