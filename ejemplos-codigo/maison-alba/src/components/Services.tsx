import { useState } from "react";
import { SERVICES } from "../data/site";
import { BookButton } from "../booking";
import { Reveal } from "./Reveal";
import { Photo } from "./Photo";

export function Services() {
  const [active, setActive] = useState(0);

  return (
    <section id="servicios" className="border-t border-ink/10 px-5 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-[1480px]">
        <Reveal className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.22em] text-ink/70">Servicios</p>
          <h2 className="mt-5 text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.04]">Cada servicio empieza con una consulta.</h2>
        </Reveal>

        <div className="mt-16 grid gap-12 md:mt-24 lg:grid-cols-12 lg:gap-x-16">
          <ul className="lg:col-span-7">
            {SERVICES.map((s, i) => (
              <li
                key={s.id}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className="border-t border-ink/15 py-8 last:border-b md:py-10"
              >
                <Reveal delay={i * 60}>
                  <div className="flex items-baseline justify-between gap-6">
                    <h3
                      className={`font-serif text-[clamp(1.9rem,3.2vw,3rem)] leading-[1.05] transition-opacity duration-500 ${
                        active === i ? "opacity-100" : "lg:opacity-45"
                      }`}
                    >
                      {s.name}
                    </h3>
                    <p className="shrink-0 text-sm tabular-nums text-ink/70">{s.price}</p>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                    <p className="max-w-[48ch] text-[0.95rem] text-ink/70">{s.description}</p>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-ink/70">{s.duration}</span>
                      <BookButton serviceId={s.id} className="link-line text-xs uppercase tracking-[0.18em]">
                        Reservar
                      </BookButton>
                    </div>
                  </div>

                  <div className="zoom-img mt-6 aspect-[16/10] overflow-hidden bg-sand lg:hidden">
                    <Photo name={s.image} sizes="90vw" />
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>

          <div className="relative hidden lg:col-span-5 lg:block">
            <div className="sticky top-24 aspect-[4/5] overflow-hidden bg-sand" aria-hidden>
              {SERVICES.map((s, i) => (
                <div
                  key={s.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${active === i ? "opacity-100" : "opacity-0"}`}
                >
                  <Photo name={s.image} sizes="40vw" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-10 text-xs text-ink/70">
          Precios orientativos. El importe final se confirma en la consulta según largo, densidad y estado del cabello.
        </p>
      </div>
    </section>
  );
}
