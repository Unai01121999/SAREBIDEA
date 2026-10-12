import { TEAM } from "../data/site";
import { Photo } from "./Photo";
import { Reveal } from "./Reveal";

export function Team() {
  return (
    <section id="equipo" className="border-t border-ink/10 px-5 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-[1480px]">
        <Reveal className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-ink/70">Equipo</p>
          <h2 className="mt-5 text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.04]">Manos que escuchan antes de cortar.</h2>
        </Reveal>

        <ul className="mt-16 grid gap-14 md:mt-24 md:grid-cols-3 md:gap-8">
          {TEAM.map((m, i) => (
            <li key={i} className={i === 1 ? "md:mt-20" : i === 2 ? "md:mt-8" : ""}>
              <Reveal delay={i * 120}>
                <div className="zoom-img aspect-[4/5] overflow-hidden bg-sand">
                  <Photo name={m.image} sizes="(min-width:768px) 32vw, 100vw" position="50% 30%" />
                </div>
                <h3 className="mt-6 font-serif text-3xl leading-tight">{m.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink/70">{m.role}</p>
                <p className="mt-4 max-w-[36ch] text-[0.95rem] text-ink/70">{m.bio}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
