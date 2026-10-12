import { useState } from "react";
import { TESTIMONIALS } from "../data/site";
import { Reveal } from "./Reveal";

export function Testimonials() {
  const [i, setI] = useState(0);
  const t = TESTIMONIALS[i];

  return (
    <section id="opiniones" className="bg-sand/40 px-5 py-28 md:px-10 md:py-40">
      <Reveal className="mx-auto max-w-[1100px]">
        <h2 className="sr-only">Opiniones de clientas</h2>
        <figure aria-live="polite" className="min-h-[15rem]">
          <blockquote className="font-serif text-[clamp(2rem,4.4vw,3.8rem)] leading-[1.12]">
            &ldquo;{t.quote}&rdquo;
          </blockquote>
          <figcaption className="mt-10 text-sm">
            <span className="block">{t.author}</span>
            <span className="block text-ink/70">{t.role}</span>
          </figcaption>
        </figure>

        <div className="mt-10 flex items-center justify-between gap-6 border-t border-ink/15 pt-6">
          <div className="flex gap-1" role="group" aria-label="Elegir opinión">
            {TESTIMONIALS.map((_, n) => (
              <button
                key={n}
                type="button"
                onClick={() => setI(n)}
                aria-label={`Opinión ${n + 1} de ${TESTIMONIALS.length}`}
                aria-current={n === i}
                className="grid h-11 w-11 place-items-center"
              >
                <span className={`block h-px transition-all duration-500 ${n === i ? "w-8 bg-ink" : "w-4 bg-ink/40"}`} />
              </button>
            ))}
          </div>
          <p className="text-xs text-ink/70">Contenido de demostración, pendiente de reseñas reales.</p>
        </div>
      </Reveal>
    </section>
  );
}
