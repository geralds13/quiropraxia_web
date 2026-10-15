import { Reveal } from "@/components/Reveal";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <Reveal
      className={`max-w-3xl ${centered ? "mx-auto text-center" : "text-left"}`}
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-wellness-500/30 bg-wellness-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.18em] text-wellness-400">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-slate-300">
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}