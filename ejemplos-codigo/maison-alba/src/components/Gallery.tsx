import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { IMAGES } from "../data/site";
import { Photo } from "./Photo";
import { Reveal } from "./Reveal";

const WORKS: { name: keyof typeof IMAGES; caption: string; ratio: string }[] = [
  { name: "g1", caption: "Rubio luminoso, ondas suaves", ratio: "aspect-[4/5]" },
  { name: "g2", caption: "Castaño con reflejos cobrizos", ratio: "aspect-[3/4]" },
  { name: "g3", caption: "Ondas naturales en tono miel", ratio: "aspect-[4/5]" },
];

export function Gallery() {
  const track = useRef<HTMLUListElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const step = el.querySelector("li")?.getBoundingClientRect().width ?? 400;
    el.scrollBy({ left: dir * (step + 24), behavior: "smooth" });
  };

  return (
    <section id="trabajo" className="overflow-hidden px-5 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-[1480px]">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <Reveal className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-ink/70">Nuestro trabajo</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.04]">Resultados que hablan en silencio.</h2>
          </Reveal>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Trabajos anteriores"
              className="grid h-12 w-12 place-items-center border border-ink transition-colors duration-300 hover:bg-ink hover:text-ivory"
            >
              <ArrowLeft size={20} strokeWidth={1.25} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Siguientes trabajos"
              className="grid h-12 w-12 place-items-center border border-ink transition-colors duration-300 hover:bg-ink hover:text-ivory"
            >
              <ArrowRight size={20} strokeWidth={1.25} />
            </button>
          </div>
        </div>
      </div>

      <ul
        ref={track}
        tabIndex={0}
        aria-label="Galería de trabajos, desplazable"
        className="no-scrollbar -mx-5 mt-14 flex scroll-pl-5 snap-x snap-mandatory items-end gap-6 overflow-x-auto px-5 pb-2 md:-mx-10 md:mt-20 md:scroll-pl-10 md:px-10"
      >
        {WORKS.map((w) => (
          <li key={w.name} className="w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw] xl:w-[26vw]">
            <figure>
              <div className={`zoom-img overflow-hidden bg-sand ${w.ratio}`}>
                <Photo name={w.name} sizes="(min-width:1024px) 30vw, 78vw" />
              </div>
              <figcaption className="mt-4 text-sm text-ink/70">{w.caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
