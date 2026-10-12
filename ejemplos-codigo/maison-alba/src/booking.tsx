import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { BOOKING } from "./data/site";

type Ctx = { open: (serviceId?: string) => void; close: () => void; isOpen: boolean; serviceId?: string };

const BookingCtx = createContext<Ctx | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState<string | undefined>();

  const open = useCallback((id?: string) => {
    setServiceId(id);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ open, close, isOpen, serviceId }), [open, close, isOpen, serviceId]);
  return <BookingCtx.Provider value={value}>{children}</BookingCtx.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingCtx);
  if (!ctx) throw new Error("useBooking must be used inside BookingProvider");
  return ctx;
}

type BookProps = {
  className?: string;
  serviceId?: string;
  children: ReactNode;
};

/**
 * Booking call to action. If the salon configured an external platform
 * (BOOKING.externalUrl) it is a real link; otherwise it opens the request flow.
 */
export function BookButton({ className = "", serviceId, children }: BookProps) {
  const { open } = useBooking();
  if (BOOKING.externalUrl) {
    return (
      <a href={BOOKING.externalUrl} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={() => open(serviceId)} className={className} aria-haspopup="dialog">
      {children}
    </button>
  );
}
