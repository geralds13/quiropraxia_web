"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CalendarOff,
  Check,
  CircleCheckBig,
  Clock,
  Copy,
  Download,
  ImagePlus,
  Info,
  Loader2,
  Moon,
  QrCode,
  RefreshCw,
  Search,
  Sparkles,
  Sun,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { formatDuration, formatSoles } from "@/lib/format";
import {
  BookingApiError,
  createWebBooking,
  getAvailability,
  getPublicPackages,
  getPublicPaymentInfo,
  getPublicServices,
  lookupDni,
} from "@/services/wellnessService";
import type {
  AvailabilitySlot,
  BookingType,
  DayAvailability,
  PublicPackage,
  PublicPaymentInfo,
  PublicService,
  WellnessAlertLevel,
  WellnessPaymentMethod,
} from "@/types/wellness";

function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

const ALERT_OPTIONS: {
  value: WellnessAlertLevel;
  emoji: string;
  title: string;
  hint: string;
  active: string;
  dot: string;
}[] = [
  {
    value: "GREEN",
    emoji: "🟢",
    title: "Sin riesgo",
    hint: "Me siento bien, busco mantenimiento / relajación",
    active: "border-emerald-500/60 bg-emerald-500/10",
    dot: "bg-emerald-400",
  },
  {
    value: "YELLOW",
    emoji: "🟡",
    title: "Precaución",
    hint: "Tengo dolor moderado o molestia recurrente",
    active: "border-amber-500/60 bg-amber-500/10",
    dot: "bg-amber-400",
  },
  {
    value: "RED",
    emoji: "🔴",
    title: "Riesgo / Contraindicación",
    hint: "Hernia diagnosticada, prótesis, embarazo u osteoporosis",
    active: "border-red-500/60 bg-red-500/10",
    dot: "bg-red-400",
  },
];

const STEP_DEFS = [
  { id: 1, label: "Servicio", icon: Sparkles },
  { id: 2, label: "Fecha y Turno", icon: CalendarClock },
  { id: 3, label: "Datos Personales", icon: UserRound },
  { id: 4, label: "Pago", icon: QrCode },
] as const;

// La reserva de un paquete no elige servicio: inicia en fecha de la 1ª sesión.
const PACKAGE_STEP_DEFS = [
  { id: 2, label: "Fecha y Turno", icon: CalendarClock },
  { id: 3, label: "Datos Personales", icon: UserRound },
  { id: 4, label: "Pago", icon: QrCode },
] as const;

interface BookingModalProps {
  initialServiceId: number | null;
  initialPackageId?: number | null;
  onClose: () => void;
}

export default function BookingModal({
  initialServiceId,
  initialPackageId = null,
  onClose,
}: BookingModalProps) {
  const isPackage = initialPackageId != null;
  const bookingType: BookingType = isPackage ? "PACKAGE" : "SERVICE";
  const [step, setStep] = useState(initialServiceId ? 2 : isPackage ? 2 : 1);

  // Catálogo de servicios.
  const [services, setServices] = useState<PublicService[] | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // Paquete preseleccionado (modo PACKAGE).
  const [packages, setPackages] = useState<PublicPackage[] | null>(null);
  const [packageId] = useState<number | null>(initialPackageId);

  // Datos de la reserva.
  const [serviceId, setServiceId] = useState<number | null>(initialServiceId);
  const [date, setDate] = useState(() => todayIso());
  const [time, setTime] = useState("");
  const [dni, setDni] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [alertLevel, setAlertLevel] = useState<WellnessAlertLevel>("GREEN");
  const [medicalAlerts, setMedicalAlerts] = useState("");

  // Pago del adelanto (paso 4): QR de la empresa, N° de operación y voucher.
  const [paymentInfo, setPaymentInfo] = useState<PublicPaymentInfo | null>(null);
  const [paymentInfoError, setPaymentInfoError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<WellnessPaymentMethod>("YAPE");
  const [operationNumber, setOperationNumber] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Estados de UI.
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cierre animado: reproduce la salida antes de desmontar el modal.
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(() => onClose(), 220);
  }, [onClose]);

  // Disponibilidad real del día (motor anticolisión del backend).
  const [availability, setAvailability] = useState<DayAvailability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);

  const loadServices = useCallback(async () => {
    setServicesError(null);
    try {
      setServices(await getPublicServices());
    } catch {
      setServicesError(
        "No pudimos cargar los servicios. Reintenta en unos segundos.",
      );
      setServices([]);
    }
  }, []);

  useEffect(() => {
    if (services === null && servicesError === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- carga perezosa al abrir el modal
      void loadServices();
    }
  }, [services, servicesError, loadServices]);

  // Carga el catálogo de paquetes solo en modo PACKAGE (para la cabecera).
  useEffect(() => {
    if (!isPackage || packages !== null) return;
    void (async () => {
      try {
        setPackages(await getPublicPackages());
      } catch {
        setPackages([]);
      }
    })();
  }, [isPackage, packages]);

  // Consulta la disponibilidad real (anticolisión) al elegir fecha y servicio.
  useEffect(() => {
    if (step !== 2 || !date) return;
    if (!serviceId && !packageId) return;
    let cancelled = false;
    void (async () => {
      setAvailabilityLoading(true);
      setAvailabilityError(null);
      setAvailability(null);
      try {
        const data = await getAvailability(date, serviceId, packageId);
        if (cancelled) return;
        setAvailability(data);
        // Si la hora elegida dejó de estar disponible, se deselecciona.
        setTime((current) => {
          if (!current) return current;
          const match = [...data.morning, ...data.afternoon].find(
            (slot) => slot.time === current,
          );
          return match && match.available ? current : "";
        });
      } catch (error) {
        if (cancelled) return;
        setAvailability(null);
        setAvailabilityError(
          error instanceof Error
            ? error.message
            : "No pudimos consultar la disponibilidad. Intenta nuevamente.",
        );
      } finally {
        if (!cancelled) setAvailabilityLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, serviceId, packageId, date, availabilityRefreshKey]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") requestClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [requestClose]);

  const runLookup = useCallback(async (value: string) => {
    setLookingUp(true);
    setLookupMessage(null);
    try {
      const result = await lookupDni(value);
      const names = [
        result.nombres,
        result.apellido_paterno,
        result.apellido_materno,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
      setFullName(result.nombre_completo || names);
      setLookupMessage("Datos encontrados en RENIEC.");
    } catch (error) {
      setLookupMessage(
        error instanceof Error
          ? error.message
          : "No se pudo consultar el DNI. Elige tus nombres manualmente.",
      );
    } finally {
      setLookingUp(false);
    }
  }, []);

  function handleDniChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    setDni(digits);
    setLookupMessage(null);
    if (digits.length === 8) void runLookup(digits);
  }

  const maxReachable = useMemo(() => {
    if (isPackage) {
      if (!packageId) return 1;
    } else if (!serviceId) {
      return 1;
    }
    if (!date || !time) return 2;
    return 3;
  }, [isPackage, packageId, serviceId, date, time]);

  function goToStep(target: number) {
    if (target > maxReachable || target < 1) return;
    setFormError(null);
    setStep(target);
  }

  function goNext() {
    setFormError(null);
    if (step === 1) {
      if (!serviceId) {
        setFormError("Selecciona un servicio para continuar.");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!date) {
        setFormError("Selecciona una fecha.");
        return;
      }
      if (date < todayIso()) {
        setFormError("La fecha no puede ser anterior a hoy.");
        return;
      }
      if (!time) {
        setFormError("Selecciona una hora de atención.");
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      if (dni.length !== 8) {
        setFormError("Ingresa un DNI válido de 8 dígitos.");
        return;
      }
      if (!fullName.trim()) {
        setFormError("Ingresa tus nombres completos.");
        return;
      }
      if (!phone.trim()) {
        setFormError("Ingresa tu celular / WhatsApp.");
        return;
      }
      setStep(4);
      return;
    }
    if (step === 4) {
      if (!operationNumber.trim()) {
        setFormError("Ingresa el número de operación de tu pago.");
        return;
      }
      void submit();
    }
  }

  async function submit() {
    if (isPackage ? !packageId : !serviceId) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await createWebBooking({
        booking_type: bookingType,
        service_id: serviceId ?? undefined,
        package_id: isPackage ? packageId ?? undefined : undefined,
        document_number: dni,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        date,
        time,
        notes: notes.trim(),
        alert_level: alertLevel,
        medical_alerts: medicalAlerts.trim(),
        operation_number: operationNumber.trim(),
        advance_amount_declared: advanceAmount.trim() || suggestedAdvance,
        payment_method_declared: paymentMethod,
        voucher_image: voucherFile,
      });
      setStep(5);
    } catch (error) {
      // El horario se ocupó entre la consulta y la confirmación: se refresca
      // la grilla en tiempo real y se devuelve al usuario al paso de horario.
      if (error instanceof BookingApiError && error.code === "SLOT_UNAVAILABLE") {
        setFormError(error.message);
        setTime("");
        setStep(2);
        setAvailabilityRefreshKey((key) => key + 1);
        return;
      }
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la reserva. Intenta nuevamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedService = services?.find((service) => service.id === serviceId);
  const selectedPackage = packages?.find((entry) => entry.id === packageId) ?? null;
  const stepDefinitions = isPackage ? PACKAGE_STEP_DEFS : STEP_DEFS;

  // Total y adelanto sugerido (50%) del servicio o paquete seleccionado.
  const rawPrice = Number(
    (isPackage ? selectedPackage?.price : selectedService?.price) ?? 0,
  );
  const totalPrice = Number.isFinite(rawPrice) ? rawPrice : 0;
  const suggestedAdvance =
    totalPrice > 0 ? (totalPrice * 0.5).toFixed(2) : "0.00";

  // Carga los datos de pago (QR) solo al entrar al paso de pago.
  useEffect(() => {
    if (step !== 4 || paymentInfo !== null || paymentInfoError !== null) return;
    void (async () => {
      try {
        setPaymentInfo(await getPublicPaymentInfo());
      } catch {
        setPaymentInfoError(
          "No pudimos cargar los datos de pago. Escríbenos por WhatsApp.",
        );
      }
    })();
  }, [step, paymentInfo, paymentInfoError]);

  // Inicializa el monto del adelanto (50%) al entrar al paso de pago.
  useEffect(() => {
    if (step === 4 && !advanceAmount && suggestedAdvance !== "0.00") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- default del adelanto
      setAdvanceAmount(suggestedAdvance);
    }
  }, [step, advanceAmount, suggestedAdvance]);

  // Libera la URL de vista previa del voucher al cambiar o desmontar.
  useEffect(() => {
    return () => {
      if (voucherPreview) URL.revokeObjectURL(voucherPreview);
    };
  }, [voucherPreview]);

  function handleVoucherChange(file: File | null) {
    setVoucherFile(file);
    setVoucherPreview(file ? URL.createObjectURL(file) : null);
  }

  async function copyPhone() {
    const phone = paymentInfo?.phone?.trim();
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(true);
      window.setTimeout(() => setCopiedPhone(false), 2000);
    } catch {
      setCopiedPhone(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={requestClose}
        className={`absolute inset-0 cursor-default bg-black/75 backdrop-blur-md ${
          closing ? "animate-overlay-out" : "animate-overlay-in"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reservar cita"
        className={`glass-panel relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-emerald-500/20 shadow-2xl shadow-emerald-950/40 ${
          closing ? "animate-panel-out" : "animate-panel-in"
        }`}
      >
        <header className="relative shrink-0 border-b border-white/5 px-5 py-4 sm:px-7 sm:py-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#00C48C]">
                Reserva online
              </p>
              <h3 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                {isPackage && selectedPackage
                  ? `Reserva tu Paquete: ${selectedPackage.name}`
                  : "Agenda tu cita"}
              </h3>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Cerrar"
              className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-white/5 hover:text-white active:scale-90"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {step < 5 ? (
            <Stepper
              definitions={stepDefinitions}
              current={step}
              maxReachable={maxReachable}
              onSelect={goToStep}
            />
          ) : null}
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <div key={step} className="animate-step-in">
            {isPackage && selectedPackage && step < 5 ? (
            <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-wellness-primary to-wellness-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  {selectedPackage.total_sessions} sesiones
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-wellness-500/10 px-3 py-1 text-xs font-semibold text-wellness-400">
                  {formatSoles(selectedPackage.price)}
                </span>
                {selectedPackage.validity_days > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                    Válido {selectedPackage.validity_days} días
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Vas a agendar la <strong className="text-white">primera sesión</strong>{" "}
                de tu paquete. Las siguientes sesiones las coordinarás con nuestro
                equipo.
              </p>
            </div>
          ) : null}

          {step === 1 ? (
            <ServiceStep
              services={services}
              error={servicesError}
              selectedId={serviceId}
              onRetry={() => void loadServices()}
              onSelect={(id) => {
                setServiceId(id);
                setFormError(null);
              }}
            />
          ) : null}

          {step === 2 ? (
            <ScheduleStep
              title={
                isPackage
                  ? "Paso 1: Elige la fecha y hora para tu primera sesión"
                  : "Elige fecha y turno"
              }
              date={date}
              time={time}
              availability={availability}
              loading={availabilityLoading}
              error={availabilityError}
              onChangeDate={(value) => {
                setDate(value);
                setTime("");
                setFormError(null);
              }}
              onChangeTime={(value) => {
                setTime(value);
                setFormError(null);
              }}
              onRetry={() => setAvailabilityRefreshKey((key) => key + 1)}
            />
          ) : null}

          {step === 3 ? (
            <PatientStep
              dni={dni}
              fullName={fullName}
              phone={phone}
              email={email}
              notes={notes}
              alertLevel={alertLevel}
              medicalAlerts={medicalAlerts}
              lookingUp={lookingUp}
              lookupMessage={lookupMessage}
              onChangeDni={handleDniChange}
              onLookup={() => dni.length === 8 && void runLookup(dni)}
              onChangeFullName={setFullName}
              onChangePhone={setPhone}
              onChangeEmail={setEmail}
              onChangeNotes={setNotes}
              onChangeAlertLevel={setAlertLevel}
              onChangeMedicalAlerts={setMedicalAlerts}
            />
          ) : null}

          {step === 4 ? (
            <PaymentStep
              isPackage={isPackage}
              itemName={selectedPackage?.name ?? selectedService?.name ?? ""}
              totalPrice={totalPrice}
              advanceAmount={advanceAmount}
              onChangeAdvance={setAdvanceAmount}
              paymentInfo={paymentInfo}
              paymentInfoError={paymentInfoError}
              paymentMethod={paymentMethod}
              onChangePaymentMethod={setPaymentMethod}
              operationNumber={operationNumber}
              onChangeOperationNumber={setOperationNumber}
              voucherFile={voucherFile}
              voucherPreview={voucherPreview}
              onChangeVoucher={handleVoucherChange}
              copiedPhone={copiedPhone}
              onCopyPhone={() => void copyPhone()}
            />
          ) : null}

          {step === 5 ? (
            <SuccessStep
              isPackage={isPackage}
              operationNumber={operationNumber}
            />
          ) : null}
          </div>

          {formError ? (
            <p className="mt-4 animate-step-in rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {formError}
            </p>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-white/5 px-5 py-4 sm:px-7">
          {step < 5 ? (
            <div className="flex items-center gap-3">
              {step > (isPackage ? 2 : 1) ? (
                <button
                  type="button"
                  onClick={() => goToStep(step - 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-wellness-border px-4 py-3 text-sm font-semibold text-slate-200 transition-all hover:border-emerald-500/50 hover:text-white active:scale-[0.98]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Atrás
                </button>
              ) : null}
              <button
                type="button"
                onClick={goNext}
                disabled={submitting || (step === 2 && !time)}
                className="btn-glow inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-wellness-primary to-wellness-accent px-4 py-3 text-sm font-semibold text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    {step === 4 ? "Confirmar reserva" : "Continuar"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={requestClose}
              className="btn-glow w-full rounded-xl bg-gradient-to-r from-wellness-primary to-wellness-accent px-4 py-3 text-sm font-semibold text-white active:scale-[0.98]"
            >
              Entendido
            </button>
          )}
          {step < 5 && isPackage && selectedPackage ? (
            <p className="mt-3 truncate text-center text-xs text-slate-500">
              Paquete seleccionado:{" "}
              <span className="font-semibold text-slate-300">
                {selectedPackage.name}
              </span>{" "}
              · {selectedPackage.total_sessions} sesiones
            </p>
          ) : step < 5 && selectedService ? (
            <p className="mt-3 truncate text-center text-xs text-slate-500">
              Servicio seleccionado:{" "}
              <span className="font-semibold text-slate-300">
                {selectedService.name}
              </span>
            </p>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

function Stepper({
  definitions,
  current,
  maxReachable,
  onSelect,
}: {
  definitions: ReadonlyArray<{
    readonly id: number;
    readonly label: string;
    readonly icon: React.ComponentType<{ className?: string }>;
  }>;
  current: number;
  maxReachable: number;
  onSelect: (step: number) => void;
}) {
  return (
    <ol className="relative mt-5 flex items-center gap-1.5">
      {definitions.map((definition, index) => {
        const done = current > definition.id;
        const active = current === definition.id;
        const reachable = definition.id <= maxReachable;
        const Icon = definition.icon;
        return (
          <li key={definition.id} className="flex flex-1 items-center gap-1.5">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onSelect(definition.id)}
              aria-current={active ? "step" : undefined}
              className={`inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-xs font-semibold transition-all active:scale-[0.96] ${
                active
                  ? "bg-emerald-500/15 text-white"
                  : done
                    ? "text-[#00C48C]"
                    : reachable
                      ? "text-slate-300 hover:bg-white/5"
                      : "cursor-not-allowed text-slate-600"
              }`}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] transition-colors ${
                  active
                    ? "border-[#00C48C] bg-[#00C48C] text-[#04140e]"
                    : done
                      ? "border-[#00C48C] text-[#00C48C]"
                      : "border-white/15"
                }`}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </span>
              <span className="hidden sm:inline">{definition.label}</span>
            </button>
            {index < definitions.length - 1 ? (
              <span
                className={`h-px flex-1 ${
                  current > definition.id ? "bg-[#00C48C]/50" : "bg-white/10"
                }`}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function StepTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <p className="flex items-center gap-2 text-sm font-semibold text-white">
      {icon}
      {title}
    </p>
  );
}

function ServiceStep({
  services,
  error,
  selectedId,
  onSelect,
  onRetry,
}: {
  services: PublicService[] | null;
  error: string | null;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onRetry: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");

  const categories = useMemo(() => {
    if (!services) return [];
    const map = new Map<string, string>();
    for (const service of services) {
      if (service.category && !map.has(service.category)) {
        map.set(service.category, service.category_display || service.category);
      }
    }
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [services]);

  const filtered = useMemo(() => {
    if (!services) return [];
    const term = query.trim().toLowerCase();
    return services.filter((service) => {
      const matchesCategory = category === "ALL" || service.category === category;
      if (!matchesCategory) return false;
      if (!term) return true;
      return (
        service.name.toLowerCase().includes(term) ||
        (service.category_display || "").toLowerCase().includes(term) ||
        (service.description || "").toLowerCase().includes(term)
      );
    });
  }, [services, query, category]);

  if (services === null && !error) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-300">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando servicios...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-wellness-border bg-wellness-card/60 p-6 text-center">
        <p className="text-sm text-slate-300">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-400">
        Aún no hay servicios publicados. Escríbenos por WhatsApp.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <StepTitle
        icon={<Sparkles className="h-4 w-4 text-[#00C48C]" />}
        title="¿Qué servicio necesitas?"
      />

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre o categoría..."
          className="w-full rounded-xl border border-wellness-border bg-wellness-darkBg py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-[#00C48C]/60 focus:outline-none"
        />
      </div>

      {categories.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          <CategoryChip
            active={category === "ALL"}
            label="Todos"
            onClick={() => setCategory("ALL")}
          />
          {categories.map((entry) => (
            <CategoryChip
              key={entry.value}
              active={category === entry.value}
              label={entry.label}
              onClick={() => setCategory(entry.value)}
            />
          ))}
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <div className="grid max-h-[420px] grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
          {filtered.map((service) => {
            const active = service.id === selectedId;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => onSelect(service.id)}
                aria-pressed={active}
                className={`relative flex flex-col gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.99] ${
                  active
                    ? "border-[#00C48C]/70 bg-emerald-950/30 ring-2 ring-[#00C48C] shadow-lg shadow-emerald-500/20"
                    : "border-wellness-border bg-wellness-card/60 hover:border-[#00C48C]/40 hover:bg-emerald-950/10"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full transition-all duration-200 ${
                    active
                      ? "scale-100 bg-[#00C48C] text-[#04140e]"
                      : "scale-90 border border-white/15 text-transparent"
                  }`}
                >
                  <Check className="h-4 w-4" />
                </span>

                <span className="pr-8 text-sm font-bold leading-snug text-white">
                  {service.name}
                </span>

                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {formatDuration(service.duration_minutes)}
                  </span>
                  {service.category_display ? (
                    <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                      {service.category_display}
                    </span>
                  ) : null}
                </span>

                <span className="mt-auto text-base font-semibold text-[#00C48C]">
                  {formatSoles(service.price)}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-wellness-border bg-wellness-card/60 px-4 py-8 text-center text-sm text-slate-400">
          No encontramos servicios para tu búsqueda.
        </p>
      )}
    </div>
  );
}

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-[0.96] ${
        active
          ? "border-[#00C48C]/60 bg-[#00C48C]/15 text-white shadow-sm shadow-emerald-500/20"
          : "border-wellness-border bg-wellness-card/60 text-slate-300 hover:border-[#00C48C]/40 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function ScheduleStep({
  title,
  date,
  time,
  availability,
  loading,
  error,
  onChangeDate,
  onChangeTime,
  onRetry,
}: {
  title: string;
  date: string;
  time: string;
  availability: DayAvailability | null;
  loading: boolean;
  error: string | null;
  onChangeDate: (value: string) => void;
  onChangeTime: (value: string) => void;
  onRetry: () => void;
}) {
  const inputClass =
    "w-full rounded-xl border border-wellness-border bg-wellness-darkBg px-3.5 py-3 text-sm text-white focus:border-[#00C48C]/60 focus:outline-none";

  return (
    <div className="space-y-4">
      <StepTitle
        icon={<CalendarClock className="h-4 w-4 text-[#00C48C]" />}
        title={title}
      />
      <div className="max-w-xs">
        <label
          htmlFor="bk-date"
          className="mb-1.5 block text-xs font-semibold text-slate-400"
        >
          Fecha preferida
        </label>
        <input
          id="bk-date"
          type="date"
          value={date}
          min={todayIso()}
          onChange={(event) => onChangeDate(event.target.value)}
          className={inputClass}
        />
      </div>

      {loading ? (
        <AvailabilitySkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-wellness-border bg-wellness-card/60 p-5 text-center">
          <p className="text-sm text-slate-300">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      ) : availability && availability.is_closed ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-left">
          <CalendarOff
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-300"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-amber-200">
              El centro no atiende este día
            </p>
            <p className="mt-0.5 text-xs text-amber-200/80">
              {availability.day_name
                ? `No hay atención los ${availability.day_name}. Por favor elige otra fecha.`
                : "Por favor elige otra fecha."}
            </p>
          </div>
        </div>
      ) : availability && availability.is_past ? (
        <div className="flex items-start gap-3 rounded-2xl border border-wellness-border bg-wellness-card/60 p-4 text-left">
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-[#00C48C]"
            aria-hidden="true"
          />
          <p className="text-sm text-slate-300">
            Esta fecha ya pasó. Elige una fecha a partir de hoy.
          </p>
        </div>
      ) : availability ? (
        <div className="space-y-4">
          <ShiftPanel
            icon={<Sun className="h-4 w-4" aria-hidden="true" />}
            label="Turno Mañana"
            slots={availability.morning}
            selectedTime={time}
            onSelect={onChangeTime}
          />
          <ShiftPanel
            icon={<Moon className="h-4 w-4" aria-hidden="true" />}
            label="Turno Tarde"
            slots={availability.afternoon}
            selectedTime={time}
            onSelect={onChangeTime}
          />

          {availability.morning.length === 0 &&
          availability.afternoon.length === 0 ? (
            <p className="rounded-lg border border-wellness-border bg-wellness-card/60 px-3 py-3 text-center text-sm text-slate-400">
              No hay horarios disponibles para este día.
            </p>
          ) : null}

          <p className="rounded-lg border border-wellness-border bg-wellness-card/60 px-3 py-2 text-xs text-slate-400">
            {availability.capacity > 0
              ? `${availability.capacity} camillas disponibles por turno. `
              : ""}
            {availability.block_minutes
              ? `Cada cita reserva ${availability.block_minutes} min (incluye limpieza). `
              : ""}
            La disponibilidad se actualiza en tiempo real.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ShiftPanel({
  icon,
  label,
  slots,
  selectedTime,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  slots: AvailabilitySlot[];
  selectedTime: string;
  onSelect: (time: string) => void;
}) {
  if (slots.length === 0) return null;
  const availableCount = slots.filter((slot) => slot.available).length;

  return (
    <div className="rounded-2xl border border-wellness-border bg-wellness-card/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
          <span className="text-[#00C48C]">{icon}</span>
          {label}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            availableCount > 0
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-white/5 text-slate-500"
          }`}
        >
          <Users className="h-3 w-3" aria-hidden="true" />
          {availableCount} disponibles
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {slots.map((slot) => (
          <SlotButton
            key={slot.time}
            slot={slot}
            selected={slot.time === selectedTime}
            onSelect={() => onSelect(slot.time)}
          />
        ))}
      </div>
    </div>
  );
}

function SlotButton({
  slot,
  selected,
  onSelect,
}: {
  slot: AvailabilitySlot;
  selected: boolean;
  onSelect: () => void;
}) {
  const disabled = !slot.available;
  const classes = disabled
    ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-slate-600"
    : selected
      ? "border-[#00C48C] bg-[#00C48C]/20 text-white shadow-lg shadow-emerald-500/20"
      : "border-emerald-500/40 bg-wellness-darkBg text-slate-100 hover:border-[#00C48C] hover:bg-emerald-500/10";

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onSelect}
      title={
        disabled ? (slot.reason ?? "No disponible") : `Reservar a las ${slot.time}`
      }
      className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2.5 text-sm font-semibold transition-all active:scale-[0.97] ${classes}`}
    >
      <span className={disabled ? "line-through decoration-slate-600" : ""}>
        {slot.time}
      </span>
      {disabled ? (
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {slot.reason ?? "No disp."}
        </span>
      ) : (
        <span className="text-[10px] font-medium text-emerald-400/80">
          {slot.slots_left > 1 ? `${slot.slots_left} cupos` : "1 cupo"}
        </span>
      )}
    </button>
  );
}

function AvailabilitySkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="h-28 animate-pulse rounded-2xl border border-wellness-border bg-white/5" />
      <div className="h-28 animate-pulse rounded-2xl border border-wellness-border bg-white/5" />
    </div>
  );
}

function PatientStep({
  dni,
  fullName,
  phone,
  email,
  notes,
  alertLevel,
  medicalAlerts,
  lookingUp,
  lookupMessage,
  onChangeDni,
  onLookup,
  onChangeFullName,
  onChangePhone,
  onChangeEmail,
  onChangeNotes,
  onChangeAlertLevel,
  onChangeMedicalAlerts,
}: {
  dni: string;
  fullName: string;
  phone: string;
  email: string;
  notes: string;
  alertLevel: WellnessAlertLevel;
  medicalAlerts: string;
  lookingUp: boolean;
  lookupMessage: string | null;
  onChangeDni: (value: string) => void;
  onLookup: () => void;
  onChangeFullName: (value: string) => void;
  onChangePhone: (value: string) => void;
  onChangeEmail: (value: string) => void;
  onChangeNotes: (value: string) => void;
  onChangeAlertLevel: (value: WellnessAlertLevel) => void;
  onChangeMedicalAlerts: (value: string) => void;
}) {
  const inputClass =
    "w-full rounded-xl border border-wellness-border bg-wellness-darkBg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00C48C]/60 focus:outline-none";
  const labelClass = "mb-1.5 block text-xs font-semibold text-slate-400";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-4">
        <StepTitle
          icon={<UserRound className="h-4 w-4 text-[#00C48C]" />}
          title="Tus datos de contacto"
        />
        <div>
          <label htmlFor="bk-dni" className={labelClass}>
            DNI
          </label>
          <div className="flex gap-2">
            <input
              id="bk-dni"
              inputMode="numeric"
              value={dni}
              onChange={(event) => onChangeDni(event.target.value)}
              placeholder="8 dígitos"
              className={inputClass}
            />
            <button
              type="button"
              onClick={onLookup}
              disabled={dni.length !== 8 || lookingUp}
              aria-label="Consultar RENIEC"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-wellness-border bg-wellness-darkBg px-3.5 text-sm font-semibold text-slate-200 transition-colors hover:border-emerald-500/50 disabled:opacity-50"
            >
              {lookingUp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>
          </div>
          {lookupMessage ? (
            <p className="mt-1.5 text-xs text-slate-400">{lookupMessage}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="bk-name" className={labelClass}>
            Nombre completo
          </label>
          <input
            id="bk-name"
            value={fullName}
            onChange={(event) => onChangeFullName(event.target.value)}
            placeholder="Nombres y apellidos"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="bk-phone" className={labelClass}>
            Celular / WhatsApp
          </label>
          <input
            id="bk-phone"
            inputMode="tel"
            value={phone}
            onChange={(event) => onChangePhone(event.target.value)}
            placeholder="Ej: 957123456"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="bk-email" className={labelClass}>
            Correo (opcional)
          </label>
          <input
            id="bk-email"
            type="email"
            value={email}
            onChange={(event) => onChangeEmail(event.target.value)}
            placeholder="tucorreo@ejemplo.com"
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className={labelClass}>
            Condición de salud (semáforo clínico)
          </label>
          {ALERT_OPTIONS.map((option) => {
            const active = alertLevel === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChangeAlertLevel(option.value)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all active:scale-[0.99] ${
                  active
                    ? option.active
                    : "border-wellness-border bg-wellness-darkBg hover:border-emerald-500/40"
                }`}
              >
                <span
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${option.dot}`}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">
                    {option.emoji} {option.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    {option.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <label htmlFor="bk-medical" className={labelClass}>
            Condiciones médicas relevantes (opcional)
          </label>
          <textarea
            id="bk-medical"
            rows={2}
            value={medicalAlerts}
            onChange={(event) => onChangeMedicalAlerts(event.target.value)}
            placeholder="Ej: hernia lumbar, embarazo, prótesis de cadera, osteoporosis..."
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="bk-notes" className={labelClass}>
            Motivo de consulta / dolor principal (opcional)
          </label>
          <textarea
            id="bk-notes"
            rows={3}
            value={notes}
            onChange={(event) => onChangeNotes(event.target.value)}
            placeholder="Ej: Dolor lumbar bajo desde hace una semana"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}

const DEFAULT_PAYMENT_METHODS: { value: WellnessPaymentMethod; label: string }[] =
  [
    { value: "YAPE", label: "Yape" },
    { value: "PLIN", label: "Plin" },
    { value: "TRANSFERENCIA", label: "Transferencia" },
  ];

// QR de pagos empaquetado en el frontend (fallback si la empresa no configuró
// uno dinámico en el backend). El archivo vive en public/assets/img/.
const LOCAL_PAYMENT_QR = "/assets/img/qr-payment.jpeg";

function PaymentStep({
  isPackage,
  itemName,
  totalPrice,
  advanceAmount,
  onChangeAdvance,
  paymentInfo,
  paymentInfoError,
  paymentMethod,
  onChangePaymentMethod,
  operationNumber,
  onChangeOperationNumber,
  voucherFile,
  voucherPreview,
  onChangeVoucher,
  copiedPhone,
  onCopyPhone,
}: {
  isPackage: boolean;
  itemName: string;
  totalPrice: number;
  advanceAmount: string;
  onChangeAdvance: (value: string) => void;
  paymentInfo: PublicPaymentInfo | null;
  paymentInfoError: string | null;
  paymentMethod: WellnessPaymentMethod;
  onChangePaymentMethod: (value: WellnessPaymentMethod) => void;
  operationNumber: string;
  onChangeOperationNumber: (value: string) => void;
  voucherFile: File | null;
  voucherPreview: string | null;
  onChangeVoucher: (file: File | null) => void;
  copiedPhone: boolean;
  onCopyPhone: () => void;
}) {
  const inputClass =
    "w-full rounded-xl border border-wellness-border bg-wellness-darkBg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00C48C]/60 focus:outline-none";
  const labelClass = "mb-1.5 block text-xs font-semibold text-slate-400";
  const methods =
    paymentInfo && paymentInfo.payment_methods.length > 0
      ? paymentInfo.payment_methods
      : DEFAULT_PAYMENT_METHODS;

  return (
    <div className="space-y-4">
      <StepTitle
        icon={<QrCode className="h-4 w-4 text-[#00C48C]" />}
        title="Pago del adelanto (50%)"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Columna izquierda: resumen + QR */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-300">
                {isPackage ? "Paquete" : "Servicio"}:{" "}
                <span className="font-semibold text-white">{itemName}</span>
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Total
                </p>
                <p className="text-lg font-bold text-white">
                  {formatSoles(totalPrice)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Adelanto a pagar
                </p>
                <p className="text-lg font-bold text-[#00C48C]">
                  {formatSoles(Number(advanceAmount) || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center rounded-2xl border border-wellness-border bg-wellness-card/60 p-4">
            <div className="w-64 max-w-full overflow-hidden rounded-2xl border border-purple-500/30 bg-[#3b0764]/40 shadow-lg shadow-purple-950/40 sm:w-72">
              {/* eslint-disable-next-line @next/next/no-img-element -- QR remoto del backend o asset local */}
              <img
                src={paymentInfo?.qr_url ?? LOCAL_PAYMENT_QR}
                alt="Código QR de pago"
                className="block h-auto w-full object-cover"
              />
            </div>

            <a
              href={paymentInfo?.qr_url ?? LOCAL_PAYMENT_QR}
              download="qr-pago-quiropraxia.jpeg"
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#00C48C]/40 bg-[#00C48C]/10 px-3.5 py-1.5 text-xs font-semibold text-[#00C48C] transition-colors hover:bg-[#00C48C]/20"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar QR
            </a>

            {paymentInfo?.account_holder ? (
              <p className="mt-3 text-center text-sm text-slate-300">
                Titular:{" "}
                <strong className="font-bold text-white">
                  {paymentInfo.account_holder}
                </strong>
              </p>
            ) : null}

            {paymentInfo?.phone ? (
              <button
                type="button"
                onClick={onCopyPhone}
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
              >
                <Copy className="h-3.5 w-3.5" />
                {copiedPhone ? "¡Número copiado!" : paymentInfo.phone}
              </button>
            ) : null}

            {paymentInfo?.bank_info ? (
              <p className="mt-2 whitespace-pre-line text-center text-xs text-slate-400">
                {paymentInfo.bank_info}
              </p>
            ) : null}
          </div>

          <p className="rounded-lg border border-wellness-border bg-wellness-card/60 px-3 py-2 text-xs text-slate-400">
            Escanea el código QR desde tu app bancaria o transfiere al número
            indicado. Luego registra tu número de operación y adjunta tu
            comprobante.
          </p>
        </div>

        {/* Columna derecha: validación del pago */}
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Medio de pago</label>
            <div className="flex flex-wrap gap-2">
              {methods.map((method) => {
                const active = method.value === paymentMethod;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => onChangePaymentMethod(method.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-[0.96] ${
                      active
                        ? "border-[#00C48C]/60 bg-[#00C48C]/15 text-white shadow-sm shadow-emerald-500/20"
                        : "border-wellness-border bg-wellness-card/60 text-slate-300 hover:border-[#00C48C]/40"
                    }`}
                  >
                    {method.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="bk-advance" className={labelClass}>
              Monto del adelanto (S/)
            </label>
            <input
              id="bk-advance"
              inputMode="decimal"
              value={advanceAmount}
              onChange={(event) =>
                onChangeAdvance(event.target.value.replace(/[^0-9.]/g, ""))
              }
              placeholder="0.00"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="bk-op" className={labelClass}>
              Número de operación <span className="text-red-300">*</span>
            </label>
            <input
              id="bk-op"
              inputMode="numeric"
              value={operationNumber}
              onChange={(event) =>
                onChangeOperationNumber(
                  event.target.value.replace(/[^0-9A-Za-z-]/g, "").slice(0, 20),
                )
              }
              placeholder="Ej: 01234567"
              className={inputClass}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Aparece en tu app de Yape/Plin o en la constancia de transferencia.
            </p>
          </div>

          <div>
            <label className={labelClass}>
              Comprobante / voucher (opcional pero recomendado)
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-wellness-darkBg px-4 py-5 text-center transition-colors hover:border-[#00C48C]/50">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) =>
                  onChangeVoucher(event.target.files?.[0] ?? null)
                }
              />
              {voucherPreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- preview local del voucher
                <img
                  src={voucherPreview}
                  alt="Vista previa del voucher"
                  className="h-28 rounded-lg border border-white/10 object-contain"
                />
              ) : (
                <>
                  <ImagePlus className="h-6 w-6 text-[#00C48C]" />
                  <span className="text-xs text-slate-300">
                    Adjunta la captura de tu pago
                  </span>
                </>
              )}
              {voucherFile ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <Upload className="h-3 w-3" />
                  {voucherFile.name}
                </span>
              ) : null}
            </label>
          </div>

          {paymentInfoError ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {paymentInfoError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SuccessStep({
  isPackage,
  operationNumber,
}: {
  isPackage: boolean;
  operationNumber: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <span className="animate-glow-pulse grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
        <CircleCheckBig className="h-8 w-8" />
      </span>
      <h4 className="text-xl font-bold text-white">
        {isPackage
          ? "¡Tu paquete ha sido solicitado!"
          : "¡Tu solicitud ha sido registrada!"}
      </h4>
      <p className="max-w-md text-sm leading-relaxed text-slate-300">
        {operationNumber
          ? `¡Reserva recibida! Registramos tu comprobante con N° de operación ${operationNumber}. `
          : ""}
        {isPackage
          ? "Nuestro equipo verificará tu pago y te confirmará por WhatsApp para coordinar la fecha de tu primera sesión."
          : "Nuestro equipo verificará tu pago y te confirmará por WhatsApp."}
      </p>
    </div>
  );
}
