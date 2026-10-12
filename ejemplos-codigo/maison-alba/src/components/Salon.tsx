import { Reveal } from "./Reveal";
import { Photo } from "./Photo";

export function Salon() {
  return (
    <section id="salon" className="bg-sand/40 px-5 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid gap-5 md:grid-cols-12 md:gap-6">
          <Reveal variant="img" className="zoom-img aspect-[4/3] overflow-hidden bg-sand md:col-span-8">
            <Photo name="salon1" sizes="(min-width:768px) 66vw, 100vw" />
          </Reveal>

          <Reveal className="flex flex-col justify-end md:col-span-4 md:pl-6">
            <h2 className="text-[clamp(2.2rem,3.8vw,3.6rem)] leading-[1.06]">Un espacio pensado para que bajes el ritmo.</h2>
            <p className="mt-6 max-w-[38ch] text-[0.98rem] text-ink/75">
              Luz natural, materiales nobles y un trato cercano. Aquí cada visita es tuya, de principio a fin.
            </p>
          </Reveal>

          <Reveal variant="img" delay={80} className="zoom-img aspect-[3/4] overflow-hidden bg-sand md:col-span-3 md:mt-16">
            <Photo name="salon2" sizes="(min-width:768px) 25vw, 100vw" />
          </Reveal>
          <Reveal variant="img" delay={160} className="zoom-img aspect-[4/5] overflow-hidden bg-sand md:col-span-5">
            <Photo name="salon4" sizes="(min-width:768px) 42vw, 100vw" />
          </Reveal>
          <Reveal variant="img" delay={240} className="zoom-img aspect-square overflow-hidden bg-sand md:col-span-4 md:mt-28">
            <Photo name="salon3" sizes="(min-width:768px) 33vw, 100vw" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
