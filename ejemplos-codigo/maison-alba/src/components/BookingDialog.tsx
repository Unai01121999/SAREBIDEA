import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { BOOKING, PROFESSIONALS, SALON, SERVICES } from "../data/site";
import { useBooking } from "../booking";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" } // El servidor guardó la solicitud
  | { kind: "mailto" } // Se abrió el correo; aún no hay confirmación del salón
  | { kind: "error"; message: string }
  | { kind: "unconfigured" };

const STEPS = ["Servicio", "Profesional", "Fecha", "Tus datos"] as const;

const today = () => new Date().toISOString().slice(0, 10);

const optionClass = (selected: boolean) =>
  `w-full border px-5 py-4 text-left transition-colors duration-300 ${
    selected ? "border-ink bg-ink text-ivory" : "border-ink/25 hover:border-ink"
  }`;

export function BookingDialog() {
  const { isOpen, close, serviceId } = useBooking();
  const ref = useRef<HTMLDialogElement>(null);

  const [step, setStep] = useState(0);
  const [service, setService] = useState("");
  const [pro, setPro] = useState("cualquiera");
  const [date, setDate] = useState("");
  const [window_, setWindow] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (isOpen && !d.open) {
      setStep(serviceId ? 1 : 0);
      setService(serviceId ?? "");
      setStatus({ kind: "idle" });
      setErrors({});
      d.showModal();
      document.body.style.overflow = "hidden";
    }
    if (!isOpen && d.open) {
      d.close();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, serviceId]);

  const serviceObj = SERVICES.find((s) => s.id === service);
  const proObj = PROFESSIONALS.find((p) => p.id === pro);
  const windowObj = BOOKING.timeWindows.find((w) => w.id === window_);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 0 && !service) e.service = "Elige un servicio para continuar.";
    if (step === 2) {
      if (!date) e.date = "Indica la fecha que prefieres.";
      else if (date < today()) e.date = "La fecha debe ser posterior a hoy.";
      if (!window_) e.window = "Elige una franja horaria.";
    }
    if (step === 3) {
      if (name.trim().length < 2) e.name = "Escribe tu nombre.";
      if (!/^[+\d][\d\s().-]{7,}$/.test(phone.trim())) e.phone = "Introduce un teléfono válido.";
      if (email && !/^\S+@\S+\.\S+$/.test(email)) e.email = "El email no parece válido.";
      if (!consent) e.consent = "Necesitamos tu consentimiento para gestionar la solicitud.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => validate() && setStep((s) => Math.min(s + 1, 3));

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    const payload = {
      service: serviceObj?.name,
      professional: proObj?.label,
      date,
      timeWindow: windowObj ? `${windowObj.label} (${windowObj.hint})` : "",
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      notes: notes.trim(),
    };

    if (BOOKING.endpoint) {
      setStatus({ kind: "sending" });
      try {
        const res = await fetch(BOOKING.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setStatus({ kind: "sent" });
      } catch {
        setStatus({
          kind: "error",
          message: "No hemos podido enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo.",
        });
      }
      return;
    }

    if (SALON.email) {
      const body = [
        `Servicio: ${payload.service}`,
        `Profesional: ${payload.professional}`,
        `Fecha preferida: ${payload.date}`,
        `Franja: ${payload.timeWindow}`,
        `Nombre: ${payload.name}`,
        `Teléfono: ${payload.phone}`,
        payload.email && `Email: ${payload.email}`,
        payload.notes && `Notas: ${payload.notes}`,
      ]
        .filter(Boolean)
        .join("\n");
      window.location.href = `mailto:${SALON.email}?subject=${encodeURIComponent(
        "Solicitud de cita",
      )}&body=${encodeURIComponent(body)}`;
      setStatus({ kind: "mailto" });
      return;
    }

    setStatus({ kind: "unconfigured" });
  };

  const done = status.kind === "sent" || status.kind === "mailto" || status.kind === "unconfigured";

  return (
    <dialog
      ref={ref}
      onClose={close}
      onClick={(e) => e.target === ref.current && close()}
      aria-labelledby="booking-title"
      className="m-auto h-full max-h-none w-full max-w-none bg-ivory p-0 text-ink backdrop:bg-ink/55 md:h-auto md:max-h-[92dvh] md:max-w-[760px]"
    >
      <div className="flex max-h-[100dvh] flex-col md:max-h-[92dvh]">
        <div className="flex items-center justify-between border-b border-ink/15 px-5 py-4 md:px-10">
          <p className="text-xs uppercase tracking-[0.2em] text-ink/70">
            {done ? "Solicitud" : `Paso ${step + 1} de ${STEPS.length}`}
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar reserva"
            className="-mr-3 grid h-11 w-11 place-items-center"
          >
            <X size={24} strokeWidth={1.25} />
          </button>
        </div>

        <form onSubmit={submit} noValidate className="flex-1 overflow-y-auto px-5 py-8 md:px-10 md:py-10">
          <h2 id="booking-title" className="font-serif text-[clamp(2rem,4vw,2.8rem)] leading-[1.05]">
            {done
              ? status.kind === "sent"
                ? "Solicitud recibida"
                : status.kind === "mailto"
                  ? "Falta un último paso"
                  : "Reservas online no disponibles"
              : ["¿Qué te gustaría hacerte?", "¿Con quién prefieres?", "¿Cuándo te viene bien?", "¿Cómo te contactamos?"][step]}
          </h2>

          {/* RESULTADO */}
          {status.kind === "sent" && (
            <p className="mt-6 max-w-[48ch] text-ink/80" role="status">
              Hemos recibido tu solicitud para {serviceObj?.name?.toLowerCase()}. El salón te contactará para confirmar la
              cita; hasta entonces la fecha no está reservada.
            </p>
          )}
          {status.kind === "mailto" && (
            <p className="mt-6 max-w-[48ch] text-ink/80" role="status">
              Hemos abierto tu aplicación de correo con la solicitud preparada. Envíala para que el salón la reciba. La
              cita no queda confirmada hasta que respondan.
            </p>
          )}
          {status.kind === "unconfigured" && (
            <p className="mt-6 max-w-[48ch] text-ink/80" role="status">
              Este salón todavía no tiene configurado un sistema de reservas.
              {SALON.phone ? ` Puedes llamarnos al ${SALON.phone}.` : " Los datos de contacto estarán disponibles pronto."}
            </p>
          )}

          {!done && step === 0 && (
            <fieldset className="mt-8">
              <legend className="sr-only">Servicio</legend>
              <div className="grid gap-3">
                {SERVICES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={service === s.id}
                    onClick={() => setService(s.id)}
                    className={optionClass(service === s.id)}
                  >
                    <span className="block font-serif text-2xl leading-tight">{s.name}</span>
                    <span className={`block text-sm ${service === s.id ? "text-ivory/80" : "text-ink/70"}`}>
                      {s.duration} · {s.price}
                    </span>
                  </button>
                ))}
              </div>
              {errors.service && <p className="mt-3 text-sm text-[#8a2b1d]" role="alert">{errors.service}</p>}
            </fieldset>
          )}

          {!done && step === 1 && (
            <fieldset className="mt-8">
              <legend className="sr-only">Profesional</legend>
              <div className="grid gap-3">
                {PROFESSIONALS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={pro === p.id}
                    onClick={() => setPro(p.id)}
                    className={optionClass(pro === p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {!done && step === 2 && (
            <div className="mt-8 grid gap-8">
              <div>
                <label htmlFor="b-date" className="block text-sm">Fecha preferida</label>
                <input
                  id="b-date"
                  type="date"
                  min={today()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  aria-invalid={!!errors.date}
                  aria-describedby={errors.date ? "b-date-err" : undefined}
                  className="mt-2 h-14 w-full border border-ink/40 bg-ivory px-4"
                />
                {errors.date && <p id="b-date-err" className="mt-2 text-sm text-[#8a2b1d]" role="alert">{errors.date}</p>}
              </div>

              <fieldset>
                <legend className="text-sm">Franja horaria</legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  {BOOKING.timeWindows.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      aria-pressed={window_ === w.id}
                      onClick={() => setWindow(w.id)}
                      className={optionClass(window_ === w.id)}
                    >
                      <span className="block">{w.label}</span>
                      <span className={`block text-sm ${window_ === w.id ? "text-ivory/80" : "text-ink/70"}`}>{w.hint}</span>
                    </button>
                  ))}
                </div>
                {errors.window && <p className="mt-3 text-sm text-[#8a2b1d]" role="alert">{errors.window}</p>}
              </fieldset>
              <p className="text-sm text-ink/70">
                Es una preferencia: el salón confirmará la hora exacta según su disponibilidad.
              </p>
            </div>
          )}

          {!done && step === 3 && (
            <div className="mt-8 grid gap-6">
              <Field id="b-name" label="Nombre" error={errors.name}>
                <input id="b-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="h-14 w-full border border-ink/40 bg-ivory px-4" aria-invalid={!!errors.name} aria-describedby={errors.name ? "b-name-err" : undefined} />
              </Field>
              <Field id="b-phone" label="Teléfono" error={errors.phone}>
                <input id="b-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-14 w-full border border-ink/40 bg-ivory px-4" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "b-phone-err" : undefined} />
              </Field>
              <Field id="b-email" label="Email (opcional)" error={errors.email}>
                <input id="b-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 w-full border border-ink/40 bg-ivory px-4" aria-invalid={!!errors.email} aria-describedby={errors.email ? "b-email-err" : undefined} />
              </Field>
              <Field id="b-notes" label="Algo que debamos saber (opcional)">
                <textarea id="b-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-ink/40 bg-ivory px-4 py-3" />
              </Field>

              <div>
                <label className="flex items-start gap-3 text-sm">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 accent-ink" aria-invalid={!!errors.consent} />
                  <span>
                    Acepto que el salón use mis datos para gestionar esta solicitud. Consulta la{" "}
                    <a href={SALON.legal.privacidad} className="link-line">política de privacidad</a>.
                  </span>
                </label>
                {errors.consent && <p className="mt-2 text-sm text-[#8a2b1d]" role="alert">{errors.consent}</p>}
              </div>

              <dl className="border-t border-ink/15 pt-5 text-sm text-ink/80">
                <dt className="sr-only">Resumen</dt>
                <dd>{serviceObj?.name} · {proObj?.label}</dd>
                <dd>{date} · {windowObj?.label}</dd>
              </dl>

              {status.kind === "error" && <p className="text-sm text-[#8a2b1d]" role="alert">{status.message}</p>}
            </div>
          )}

          {/* NAVEGACIÓN */}
          <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            {done ? (
              <button type="button" onClick={close} className="btn btn-ink sm:ml-auto">Cerrar</button>
            ) : (
              <>
                {step > 0 ? (
                  <button type="button" onClick={() => setStep((s) => s - 1)} className="btn btn-line">Atrás</button>
                ) : (
                  <span />
                )}
                {step < 3 ? (
                  <button type="button" onClick={next} className="btn btn-ink">Continuar</button>
                ) : (
                  <button type="submit" disabled={status.kind === "sending"} className="btn btn-ink disabled:opacity-60">
                    {status.kind === "sending" ? "Enviando..." : "Enviar solicitud"}
                  </button>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    </dialog>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm">{label}</label>
      <div className="mt-2">{children}</div>
      {error && <p id={`${id}-err`} className="mt-2 text-sm text-[#8a2b1d]" role="alert">{error}</p>}
    </div>
  );
}
