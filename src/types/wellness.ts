export interface PublicService {
  id: number;
  name: string;
  description: string;
  category: string;
  category_display: string;
  duration_minutes: number;
  cleanup_minutes: number;
  total_block_minutes: number;
  price: string;
  requires_sauna: boolean;
  requires_stretcher: boolean;
  includes: string[];
  protocol_notes: string;
  is_active: boolean;
}

export interface PublicPackage {
  id: number;
  name: string;
  description: string;
  package_contents: string[];
  total_sessions: number;
  sauna_sessions: number;
  price: string;
  validity_days: number;
  is_active: boolean;
}

export interface WellnessContact {
  phone: string;
  phoneDisplay: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: { days: string; time: string }[];
}

export interface DniLookupResult {
  found: boolean;
  document_number: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombre_completo: string;
}

export interface AvailabilitySlot {
  time: string;
  end_time: string;
  available: boolean;
  slots_left: number;
  reason: string | null;
}

export interface DayAvailability {
  date: string;
  day_of_week?: number;
  day_name: string;
  is_closed: boolean;
  is_past: boolean;
  message: string | null;
  service_id: number | null;
  service_name: string | null;
  service_duration_minutes: number;
  cleanup_minutes: number;
  block_minutes: number;
  slot_step_minutes: number;
  capacity: number;
  morning: AvailabilitySlot[];
  afternoon: AvailabilitySlot[];
  slots: AvailabilitySlot[];
}

export interface ScheduleShift {
  start: string;
  end: string;
}

export interface OperatingSchedule {
  day_of_week: number;
  day_name: string;
  is_closed: boolean;
  morning: ScheduleShift | null;
  afternoon: ScheduleShift | null;
}

export type WellnessAlertLevel = "GREEN" | "YELLOW" | "RED";

export type BookingType = "SERVICE" | "PACKAGE";

/** Objetivo preseleccionado al abrir el modal de reserva pública. */
export interface BookingTarget {
  type: BookingType;
  id: number;
}

export type WellnessPaymentMethod = "EFECTIVO" | "YAPE" | "PLIN" | "TRANSFERENCIA" | "TARJETA";

/** Datos de pago (QR Yape/Plin/Transferencia) de la empresa. */
export interface PublicPaymentInfo {
  company_id: number;
  company_name: string;
  account_holder: string;
  phone: string;
  bank_info: string;
  qr_url: string | null;
  advance_ratio: string;
  payment_methods: { value: WellnessPaymentMethod; label: string }[];
}

export interface BookingInput {
  service_id?: number;
  package_id?: number;
  booking_type?: BookingType;
  document_number: string;
  full_name: string;
  phone: string;
  date: string;
  time: string;
  notes?: string;
  email?: string;
  alert_level?: WellnessAlertLevel;
  medical_alerts?: string;
  /** Pago preliminar declarado (nunca impacta en caja hasta verificación). */
  operation_number?: string;
  advance_amount_declared?: string;
  payment_method_declared?: WellnessPaymentMethod;
  voucher_image?: File | null;
}

export interface BookingResult {
  id: number;
  full_name: string;
  date: string;
  time: string;
  status: string;
  service_name: string | null;
  item_name?: string | null;
  booking_type?: BookingType;
  payment_status?: string;
  operation_number?: string;
}