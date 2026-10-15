import { api, COMPANY_SLUG } from "@/lib/api";
import type {
  AvailabilitySlot,
  BookingInput,
  BookingResult,
  DayAvailability,
  DniLookupResult,
  OperatingSchedule,
  PublicPackage,
  PublicPaymentInfo,
  PublicService,
  ScheduleShift,
  WellnessPaymentMethod,
} from "@/types/wellness";

interface DjangoEnvelope<T> {
  status?: string;
  message?: string;
  data?: T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseList<T>(value: unknown): T[] {
  if (!isRecord(value)) return [];
  const payload = value as DjangoEnvelope<T[]>;
  return Array.isArray(payload.data) ? payload.data : [];
}

function unwrapData(value: unknown): unknown {
  if (isRecord(value) && "data" in value) return value.data;
  return value;
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

/** Error legible devuelto por el backend en el sobre Django. */
export class BookingApiError extends Error {
  /** Código de negocio opcional (p. ej. ``SLOT_UNAVAILABLE``). */
  code?: string;
}

/** Construye un ``BookingApiError`` extrayendo mensaje y código del backend. */
function toApiError(body: unknown): BookingApiError {
  const error = new BookingApiError(extractErrorMessage(body));
  if (isRecord(body) && typeof body.error === "string") {
    error.code = body.error;
  }
  return error;
}

function extractErrorMessage(value: unknown): string {
  if (isRecord(value) && typeof value.message === "string") {
    return value.message;
  }
  return "No se pudo completar la solicitud. Intenta nuevamente.";
}

function toService(value: unknown): PublicService | null {
  if (!isRecord(value)) return null;
  const raw = value as unknown as Partial<PublicService>;
  return {
    id: Number(raw.id) || 0,
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    category: String(raw.category ?? ""),
    category_display: String(raw.category_display ?? ""),
    duration_minutes: Number(raw.duration_minutes) || 0,
    cleanup_minutes: Number(raw.cleanup_minutes) || 0,
    total_block_minutes: Number(raw.total_block_minutes) || 0,
    price: String(raw.price ?? "0.00"),
    requires_sauna: Boolean(raw.requires_sauna),
    requires_stretcher: raw.requires_stretcher !== false,
    includes: Array.isArray(raw.includes)
      ? raw.includes.map((item) => String(item)).filter(Boolean)
      : [],
    protocol_notes: String(raw.protocol_notes ?? ""),
    is_active: raw.is_active !== false,
  };
}

function toPackage(value: unknown): PublicPackage | null {
  if (!isRecord(value)) return null;
  const raw = value as unknown as Partial<PublicPackage>;
  return {
    id: Number(raw.id) || 0,
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    package_contents: Array.isArray(raw.package_contents)
      ? raw.package_contents.map((item) => String(item)).filter(Boolean)
      : [],
    total_sessions: Number(raw.total_sessions) || 0,
    sauna_sessions: Number(raw.sauna_sessions) || 0,
    price: String(raw.price ?? "0.00"),
    validity_days: Number(raw.validity_days) || 0,
    is_active: raw.is_active !== false,
  };
}

function toShift(value: unknown): ScheduleShift | null {
  if (!isRecord(value)) return null;
  const start = asString(value.start);
  const end = asString(value.end);
  if (!start || !end) return null;
  return { start, end };
}

function toOperatingSchedule(value: unknown): OperatingSchedule | null {
  if (!isRecord(value)) return null;
  const raw = value as unknown as Partial<OperatingSchedule>;
  return {
    day_of_week: Number(raw.day_of_week) || 0,
    day_name: String(raw.day_name ?? ""),
    is_closed: raw.is_closed === true,
    morning: toShift(raw.morning),
    afternoon: toShift(raw.afternoon),
  };
}

function toSlot(value: unknown): AvailabilitySlot | null {
  if (!isRecord(value)) return null;
  const raw = value as unknown as Partial<AvailabilitySlot>;
  return {
    time: String(raw.time ?? ""),
    end_time: String(raw.end_time ?? ""),
    available: raw.available === true,
    slots_left: Number(raw.slots_left) || 0,
    reason: raw.reason == null ? null : String(raw.reason),
  };
}

function toSlotList(value: unknown): AvailabilitySlot[] {
  if (!Array.isArray(value)) return [];
  return value.map(toSlot).filter((item): item is AvailabilitySlot => item !== null);
}

/**
 * Motor público de disponibilidad y anticolisión (sin autenticación).
 * GET /api/wellness/public/availability/?date=YYYY-MM-DD&service_id=X&company_slug=<slug>
 *
 * Devuelve la grilla de slots de los turnos Mañana y Tarde con su estado real
 * (disponible/agotado) según las citas y reservas ya registradas.
 */
export async function getAvailability(
  date: string,
  serviceId: number | null,
  packageId?: number | null,
): Promise<DayAvailability> {
  try {
    const params: Record<string, string | number> = {
      date,
      company_slug: COMPANY_SLUG,
    };
    if (serviceId) params.service_id = serviceId;
    if (packageId) params.package_id = packageId;
    const { data } = await api.get<unknown>("/wellness/public/availability/", {
      params,
    });
    const payload = unwrapData(data);
    const raw = isRecord(payload) ? payload : {};
    return {
      date: asString(raw.date, date),
      day_of_week:
        typeof raw.day_of_week === "number" ? raw.day_of_week : undefined,
      day_name: asString(raw.day_name),
      is_closed: raw.is_closed === true,
      is_past: raw.is_past === true,
      message: raw.message == null ? null : String(raw.message),
      service_id:
        raw.service_id == null ? null : Number(raw.service_id) || serviceId,
      service_name:
        raw.service_name == null ? null : String(raw.service_name),
      service_duration_minutes: Number(raw.service_duration_minutes) || 0,
      cleanup_minutes: Number(raw.cleanup_minutes) || 0,
      block_minutes: Number(raw.block_minutes) || 0,
      slot_step_minutes: Number(raw.slot_step_minutes) || 30,
      capacity: Number(raw.capacity) || 0,
      morning: toSlotList(raw.morning),
      afternoon: toSlotList(raw.afternoon),
      slots: toSlotList(raw.slots),
    };
  } catch (error) {
    const response = isRecord(error) && "response" in error ? error.response : null;
    const body = isRecord(response) ? response.data : null;
    throw toApiError(body);
  }
}

/**
 * Catálogo público de servicios de la empresa (sin autenticación).
 * GET /api/wellness/public/services/?company_slug=<slug>
 */
export async function getPublicServices(): Promise<PublicService[]> {
  const { data } = await api.get<unknown>("/wellness/public/services/", {
    params: { company_slug: COMPANY_SLUG },
  });
  return parseList<PublicService>(data).map(toService).filter(
    (item): item is PublicService => item !== null,
  );
}

/**
 * Catálogo público de paquetes de tratamiento de la empresa (sin autenticación).
 * GET /api/wellness/public/packages/?company_slug=<slug>
 */
export async function getPublicPackages(): Promise<PublicPackage[]> {
  const { data } = await api.get<unknown>("/wellness/public/packages/", {
    params: { company_slug: COMPANY_SLUG },
  });
  return parseList<PublicPackage>(data).map(toPackage).filter(
    (item): item is PublicPackage => item !== null,
  );
}

/**
 * Horario público de atención de la semana (7 días), sin autenticación.
 * GET /api/wellness/public/operating-schedules/?company_slug=<slug>
 */
export async function getOperatingSchedules(): Promise<OperatingSchedule[]> {
  const { data } = await api.get<unknown>(
    "/wellness/public/operating-schedules/",
    { params: { company_slug: COMPANY_SLUG } },
  );
  return parseList<OperatingSchedule>(data)
    .map(toOperatingSchedule)
    .filter((item): item is OperatingSchedule => item !== null);
}

/**
 * Consulta RENIEC para autocompletar el nombre del paciente (sin autenticación).
 * GET /api/wellness/public/lookup-dni/?dni=<8 dígitos>&company_slug=<slug>
 */
export async function lookupDni(dni: string): Promise<DniLookupResult> {
  const { data } = await api.get<unknown>("/wellness/public/lookup-dni/", {
    params: { dni, company_slug: COMPANY_SLUG },
  });
  const payload = unwrapData(data);
  if (isRecord(payload) && payload.found === false) {
    throw new BookingApiError(extractErrorMessage(data));
  }
  const value = isRecord(payload) ? payload : {};
  return {
    found: value.found !== false,
    document_number: asString(value.document_number, dni),
    nombres: asString(value.nombres),
    apellido_paterno: asString(value.apellido_paterno),
    apellido_materno: asString(value.apellido_materno),
    nombre_completo: asString(value.nombre_completo),
  };
}

/**
 * Datos de pago (QR Yape/Plin/Transferencia) de la empresa (sin autenticación).
 * GET /api/wellness/public/payment-info/?company_slug=<slug>
 */
export async function getPublicPaymentInfo(): Promise<PublicPaymentInfo> {
  const { data } = await api.get<unknown>("/wellness/public/payment-info/", {
    params: { company_slug: COMPANY_SLUG },
  });
  const payload = unwrapData(data);
  const value = isRecord(payload) ? payload : {};
  const methods = Array.isArray(value.payment_methods)
    ? value.payment_methods.map((entry) => {
        const item = isRecord(entry) ? entry : {};
        return {
          value: asString(item.value, "YAPE") as WellnessPaymentMethod,
          label: asString(item.label),
        };
      })
    : [];
  return {
    company_id: Number(value.company_id) || 0,
    company_name: asString(value.company_name),
    account_holder: asString(value.account_holder),
    phone: asString(value.phone),
    bank_info: asString(value.bank_info),
    qr_url: value.qr_url == null ? null : asString(value.qr_url),
    advance_ratio: asString(value.advance_ratio, "0.50"),
    payment_methods: methods,
  };
}

/** Arma el cuerpo del POST: FormData si hay voucher, JSON en caso contrario. */
function buildBookingBody(
  fields: Record<string, unknown>,
  voucher?: File | null,
): Record<string, unknown> | FormData {
  if (!voucher) return fields;
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === "") continue;
    form.append(key, String(value));
  }
  form.append("voucher_image", voucher);
  return form;
}

/**
 * Registra una solicitud de reserva desde la landing pública (sin autenticación).
 * POST /api/wellness/public/bookings/?company_slug=<slug>
 *
 * Envía el pago declarado (número de operación y, opcionalmente, la foto del
 * voucher) como ``multipart/form-data``. El backend NO asienta nada en caja.
 */
export async function createWebBooking(
  input: BookingInput,
): Promise<BookingResult> {
  try {
    const fields: Record<string, unknown> = {
      booking_type: input.booking_type,
      service_id: input.service_id,
      package_id: input.package_id,
      document_number: input.document_number,
      full_name: input.full_name,
      phone: input.phone,
      email: input.email ?? "",
      date: input.date,
      time: input.time,
      notes: input.notes ?? "",
      alert_level: input.alert_level,
      medical_alerts: input.medical_alerts ?? "",
      operation_number: input.operation_number ?? "",
      advance_amount_declared: input.advance_amount_declared ?? "",
      payment_method_declared: input.payment_method_declared,
    };
    const { data } = await api.post<unknown>(
      "/wellness/public/bookings/",
      buildBookingBody(fields, input.voucher_image),
      { params: { company_slug: COMPANY_SLUG } },
    );
    const payload = unwrapData(data);
    const value = isRecord(payload) ? payload : {};
    return {
      id: Number(value.id) || 0,
      full_name: asString(value.full_name, input.full_name),
      date: asString(value.date, input.date),
      time: asString(value.time, input.time),
      status: asString(value.status, "PENDIENTE"),
      service_name: value.service_name == null ? null : asString(value.service_name),
      item_name: value.item_name == null ? null : asString(value.item_name),
      booking_type:
        value.booking_type === "PACKAGE" || value.booking_type === "SERVICE"
          ? value.booking_type
          : input.booking_type,
      payment_status: asString(value.payment_status, "SIN_PAGO"),
      operation_number: asString(value.operation_number),
    };
  } catch (error) {
    const response = isRecord(error) && "response" in error ? error.response : null;
    const body = isRecord(response) ? response.data : null;
    throw toApiError(body);
  }
}