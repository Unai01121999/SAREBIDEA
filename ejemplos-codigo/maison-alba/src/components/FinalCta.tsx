import { BookButton } from "../booking";
import { Photo } from "./Photo";
import { Reveal } from "./Reveal";

export function FinalCta() {
  return (
    <section id="reservar" className="bg-ink text-ivory">
      <div className="mx-auto grid max-w-[1480px] md:grid-cols-12">
        <div className="flex flex-col justify-center px-5 py-24 md:col-span-7 md:px-10 md:py-40">
          <Reveal>
            <h2 className="text-[clamp(3rem,7.4vw,7rem)] leading-[0.96]">
              Tu próximo look <em className="pr-1 italic">empieza aquí.</em>
            </h2>
            <p className="mt-8 max-w-[36ch] text-lg text-ivory/80">
              Descubre una experiencia de belleza pensada para ti.
            </p>
            <div className="mt-12">
              <BookButton className="btn btn-light">Reservar cita</BookButton>
            </div>
          </Reveal>
        </div>

        <div className="relative min-h-[420px] md:col-span-5 md:min-h-full">
          <div className="absolute inset-0">
            <Photo name="cta" sizes="(min-width:768px) 40vw, 100vw" position="50% 30%" />
          </div>
        </div>
      </div>
    </section>
  );
}
