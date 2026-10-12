import { SALON } from "../data/site";

const PENDING = "Pendiente de configurar";

export function Footer() {
  const instagramHandle = SALON.instagram ? SALON.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@").replace(/\/$/, "") : "";

  return (
    <footer id="contacto" className="px-5 pb-10 pt-24 md:px-10 md:pt-32">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid gap-14 md:grid-cols-12 md:gap-x-10">
          <div className="md:col-span-4">
            <p className="font-serif text-4xl leading-none">{SALON.name}</p>
            <p className="mt-3 text-sm text-ink/70">{SALON.tagline}</p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 md:col-span-8 md:grid-cols-3">
            <div>
              <h2 className="text-xs uppercase tracking-[0.2em] text-ink/70">Visítanos</h2>
              <address className="mt-4 text-[0.95rem] not-italic leading-relaxed">
                {SALON.address ? (
                  <>
                    {SALON.address}
                    {SALON.city ? <><br />{SALON.city}</> : null}
                  </>
                ) : (
                  <span className="text-ink/70">Dirección: {PENDING}</span>
                )}
              </address>
              {SALON.mapsUrl ? (
                <a href={SALON.mapsUrl} target="_blank" rel="noopener noreferrer" className="link-line mt-4 inline-block text-sm">
                  Cómo llegar
                </a>
              ) : null}
            </div>

            <div>
              <h2 className="text-xs uppercase tracking-[0.2em] text-ink/70">Horarios</h2>
              <ul className="mt-4 space-y-2 text-[0.95rem]">
                {SALON.hours.map((h) => (
                  <li key={h.days}>
                    <span className="block">{h.days}</span>
                    <span className="block text-ink/70">{h.time}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xs uppercase tracking-[0.2em] text-ink/70">Contacto</h2>
              <ul className="mt-4 space-y-2 text-[0.95rem]">
                <li>
                  {SALON.phone ? (
                    <a href={`tel:${SALON.phone.replace(/\s/g, "")}`} className="link-line">
                      {SALON.phone}
                    </a>
                  ) : (
                    <span className="text-ink/70">Teléfono: {PENDING}</span>
                  )}
                </li>
                <li>
                  {SALON.email ? (
                    <a href={`mailto:${SALON.email}`} className="link-line">
                      {SALON.email}
                    </a>
                  ) : (
                    <span className="text-ink/70">Email: {PENDING}</span>
                  )}
                </li>
                <li>
                  {SALON.instagram ? (
                    <a href={SALON.instagram} target="_blank" rel="noopener noreferrer" className="link-line">
                      {instagramHandle || "Instagram"}
                    </a>
                  ) : (
                    <span className="text-ink/70">Instagram: {PENDING}</span>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-ink/15 pt-6 text-xs text-ink/70 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} {SALON.name}. Todos los derechos reservados.</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            <a href={SALON.legal.aviso} className="link-line">Aviso legal</a>
            <a href={SALON.legal.privacidad} className="link-line">Política de privacidad</a>
            <a href={SALON.legal.cookies} className="link-line">Política de cookies</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
