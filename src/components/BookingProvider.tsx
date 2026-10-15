"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import BookingModal from "@/components/BookingModal";
import type { BookingTarget } from "@/types/wellness";

interface BookingContextValue {
  /** Abre el modal de reserva. Acepta:
   *  - ``serviceId`` (number): preselecciona el servicio y salta al paso de fecha.
   *  - ``BookingTarget`` (``{ type, id }``): reserva de servicio o de paquete.
   *  - sin argumento: inicia el flujo genérico de servicios. */
  openBookingModal: (target?: number | BookingTarget | null) => void;
  closeBookingModal: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function useBooking(): BookingContextValue {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking debe usarse dentro de <BookingProvider>");
  }
  return context;
}

interface Preselection {
  serviceId: number | null;
  packageId: number | null;
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [preselection, setPreselection] = useState<Preselection>({
    serviceId: null,
    packageId: null,
  });
  // Remonta el modal en cada apertura para reiniciar su estado interno.
  const [sessionKey, setSessionKey] = useState(0);

  const openBookingModal = useCallback(
    (target?: number | BookingTarget | null) => {
      if (typeof target === "number") {
        setPreselection({ serviceId: target, packageId: null });
      } else if (target && typeof target === "object") {
        setPreselection({
          serviceId: target.type === "SERVICE" ? target.id : null,
          packageId: target.type === "PACKAGE" ? target.id : null,
        });
      } else {
        setPreselection({ serviceId: null, packageId: null });
      }
      setSessionKey((key) => key + 1);
      setOpen(true);
    },
    [],
  );

  const closeBookingModal = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ openBookingModal, closeBookingModal }),
    [openBookingModal, closeBookingModal],
  );

  return (
    <BookingContext.Provider value={value}>
      {children}
      {open ? (
        <BookingModal
          key={sessionKey}
          initialServiceId={preselection.serviceId}
          initialPackageId={preselection.packageId}
          onClose={closeBookingModal}
        />
      ) : null}
    </BookingContext.Provider>
  );
}
