import { Activity, HeartPulse, ScanLine, Target } from "lucide-react";

import { Reveal } from "@/components/Reveal";

const PILLARS = [
  {
    icon: Activity,
    title: "Quiropraxia clínica",
    text: "Ajustes espinales manuales de baja fuerza para restaurar el movimiento articular y aliviar el dolor de origen vertebral.",
  },
  {
    icon: ScanLine,
    title: "Enfoque postural",
    text: "Análisis de tu postura estática y dinámica para corregir desequilibrios que generan tensión crónica en cuello, espalda y pelvis.",
  },
  {
    icon: Target,
    title: "Recuperación biomecánica",
    text: "Programas de rehabilitación progresiva que devuelven fuerza, estabilidad y rango de movimiento a tu sistema musculoesquelético.",
  },
  {
    icon: HeartPulse,
    title: "Bienestar integral",
    text: "Higiene del sueño, nutrición antiinflamatoria y hábitos posturales acompañando cada plan terapéutico.",
  },
];

export default function AboutSection() {
  return (
    <section id="nosotros" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <Reveal direction="right">
            <span className="inline-flex items-center rounded-full border border-wellness-500/30 bg-wellness-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.18em] text-wellness-400">
              Sobre nosotros
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Tu cuerpo merece un abordaje que lo escuche
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              En <strong className="text-white">Quiropraxia Bienestar</strong>{" "}
              creemos que el dolor no se apaga, se corrige. Nuestro propósito
              terapéutico es identificar el origen de tus molestias —postura,
              tensión, sobrecarga o desalineación vertebral— y restablecer el
              equilibrio del sistema nervioso y musculoesquelético de forma
              natural.
            </p>
            <p className="mt-3 text-base leading-relaxed text-slate-300">
              Cada plan se construye a partir de una evaluación clínica inicial,
              con ajustes progresivos y educación para que aprendas a cuidar tu
              columna en el día a día.
            </p>
            <a
              href="#cita"
              className="btn-glow mt-6 inline-flex h-12 items-center rounded-lg bg-gradient-to-r from-wellness-primary to-wellness-accent px-6 text-sm font-semibold text-white active:scale-[0.98]"
            >
              Conoce tu plan de tratamiento
            </a>
          </Reveal>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PILLARS.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 90} className="h-full">
                <div className="glass-card group h-full rounded-2xl border border-white/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-wellness-500/40 hover:shadow-lg hover:shadow-wellness-500/10">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-wellness-500/15 text-wellness-400 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    {text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}