/** Formatea un precio en soles: ``S/ 80.00``. */
export function formatSoles(value: string | number): string {
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  const safe = Number.isFinite(parsed) ? parsed : 0;
  return `S/ ${safe.toFixed(2)}`;
}

/** Duración legible (min). */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "—";
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 hora" : `${hours} horas`;
  }
  return `${minutes} min`;
}

/** Convierte ``"08:00"`` a ``"08:00 AM"`` (formato de 12 horas). */
export function formatClock(value: string | null | undefined): string {
  if (!value) return "—";
  const [rawHours, rawMinutes] = value.split(":");
  const hours = Number(rawHours);
  if (!Number.isFinite(hours)) return value;
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const minutes = (rawMinutes ?? "00").padStart(2, "0");
  return `${String(hour12).padStart(2, "0")}:${minutes} ${period}`;
}

/** Rango horario legible: ``"08:00 AM - 01:00 PM"``. */
export function formatTimeRange(
  range: { start: string; end: string } | null | undefined,
): string {
  if (!range) return "—";
  return `${formatClock(range.start)} - ${formatClock(range.end)}`;
}