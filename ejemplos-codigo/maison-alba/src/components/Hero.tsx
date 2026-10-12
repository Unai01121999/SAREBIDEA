import { BookButton } from "../booking";
import { Photo } from "./Photo";

export function Hero() {
  return (
    <section id="inicio" className="relative isolate min-h-[100dvh] overflow-hidden bg-ink text-ivory">
      <div className="absolute inset-0 -z-10">
        <Photo name="hero" eager sizes="100vw" position="50% 28%" />
        {/* Velo plano para garantizar contraste del texto sobre la fotografía */}
        <div className="absolute inset-0 bg-ink/50" />
      </div>

      <div className="mx-auto flex min-h-[100dvh] max-w-[1480px] flex-col justify-end px-5 pb-12 pt-28 md:px-10 md:pb-16">
        <div className="grid items-end gap-10 md:grid-cols-12">
          <h1 className="text-[clamp(3.4rem,10.5vw,9.5rem)] leading-[0.92] md:col-span-7 lg:col-span-8">
            El arte de
            <br />
            sentirte <em className="pb-1 pr-1 italic">tú.</em>
          </h1>

          <div className="md:col-span-5 md:pb-3 lg:col-span-4">
            <p className="max-w-[34ch] text-[1.05rem] leading-relaxed text-ivory">
              Belleza, técnica y personalidad en una experiencia diseñada alrededor de ti.
            </p>
            <div className="mt-8 flex flex-col gap-3 xl:flex-row">
              <BookButton className="btn btn-light">Reservar experiencia</BookButton>
              <a href="#salon" className="btn btn-light-line">
                Descubrir el salón
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
