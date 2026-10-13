import { Button } from '../components/ui/Button'
import { Reveal } from '../components/ui/Reveal'
import { TextReveal } from '../components/ui/TextReveal'

export function About() {
  return (
    <section id="quien-soy" className="relative bg-tone-services section-y" aria-labelledby="about-title">
      <div className="container-x grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:items-start lg:gap-20">
        <TextReveal id="about-title" as="h2" text="Quién soy" className="h-section" accent={[1]} />
        <div>
          <Reveal delay={0.1}>
            <p className="font-head text-[clamp(1.9rem,1.3rem+2.4vw,3.25rem)] max-w-[28ch] leading-[1.1] text-ink sm:max-w-[32ch]">
              Soy Unai, fundador de Sarebidea. Diseño páginas web que impulsan a los negocios locales a atraer más clientes. <span className="accent-word">Rápido, sencillo y sin rodeos.</span>
            </p>
          </Reveal>
          <Reveal delay={0.2} className="mt-10">
            <Button href="#contacto">Hablemos de tu web</Button>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
