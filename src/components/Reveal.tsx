"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealDirection = "up" | "down" | "left" | "right" | "none";

interface RevealProps {
  children: ReactNode;
  /** Retardo en milisegundos para efecto cascada entre hermanos. */
  delay?: number;
  /** Dirección del desplazamiento inicial. */
  direction?: RevealDirection;
  /** Duración de la transición en milisegundos. */
  duration?: number;
  className?: string;
  /** Vuelve a ocultar el bloque al salir del viewport. */
  repeat?: boolean;
}

const OFFSETS: Record<RevealDirection, string> = {
  up: "translate-y-5",
  down: "-translate-y-5",
  left: "translate-x-6",
  right: "-translate-x-6",
  none: "",
};

/**
 * Envuelve contenido y lo revela con un fade + slide suave cuando entra al
 * viewport, usando IntersectionObserver. Soporta `delay` para efectos cascada.
 */
export function Reveal({
  children,
  delay = 0,
  direction = "up",
  duration = 700,
  className,
  repeat = false,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fallback sin animación
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (!repeat) observer.unobserve(entry.target);
          } else if (repeat) {
            setVisible(false);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [repeat]);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: visible ? `${delay}ms` : "0ms",
        transitionDuration: `${duration}ms`,
      }}
      className={`transform-gpu transition-all ease-out will-change-[opacity,transform] ${
        visible
          ? "translate-x-0 translate-y-0 opacity-100"
          : `opacity-0 ${OFFSETS[direction]}`
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
