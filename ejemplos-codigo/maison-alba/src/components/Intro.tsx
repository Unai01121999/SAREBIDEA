import { Reveal } from "./Reveal";
import { Photo } from "./Photo";

const PILLARS = [
  ["Atención personalizada", "Una consulta sin prisa antes de tocar tu cabello."],
  ["Dominio técnico", "Corte, color y luz ejecutados con precisión."],
  ["Cuidado del cabello", "Productos y procesos elegidos para proteger la fibra."],
  ["Belleza natural", "Resultados que se ven bien también mañana por la mañana."],
];

export function Intro() {
  return (
    <section id="filosofia" className="px-5 py-28 md:px-10 md:py-44">
      <div className="mx-auto grid max-w-[1480px] gap-16 md:grid-cols-12 md:gap-x-10">
        <div className="md:col-span-7 md:pr-10">
          <Reveal as="h2" className="text-[clamp(2.5rem,5.6vw,5.2rem)] leading-[1.04]">
            Un salón donde el cabello se trata como <em className="pr-1 italic">una obra</em> y la persona como protagonista.
          </Reveal>

          <dl className="mt-16 grid gap-x-10 gap-y-10 sm:grid-cols-2 md:mt-24">
            {PILLARS.map(([t, d], i) => (
              <Reveal key={t} delay={i * 90} className="border-t border-ink/15 pt-5">
                <dt className="font-serif text-2xl leading-tight">{t}</dt>
                <dd className="mt-2 max-w-[32ch] text-[0.95rem] text-ink/70">{d}</dd>
              </Reveal>
            ))}
          </dl>
        </div>

        <div className="relative md:col-span-5 md:pt-24">
          <Reveal variant="img" className="zoom-img aspect-[4/5] overflow-hidden bg-sand">
            <Photo name="intro" sizes="(min-width:768px) 40vw, 90vw" position="50% 40%" />
          </Reveal>
          <Reveal
            variant="img"
            delay={200}
            className="zoom-img absolute -bottom-10 -left-4 hidden aspect-[3/4] w-[38%] overflow-hidden border-[10px] border-ivory bg-sand md:block lg:-left-16"
          >
            <Photo name="introDetail" sizes="20vw" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
