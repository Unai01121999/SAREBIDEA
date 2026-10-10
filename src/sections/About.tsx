import { Button } from '../components/ui/Button'
import { Reveal } from '../components/ui/Reveal'
import { TextReveal } from '../components/ui/TextReveal'

export function About() {
  return (
    <section id="quien-soy" className="relative bg-tone-services py-24 sm:py-32 lg:py-40" aria-labelledby="about-title">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <TextReveal id="about-title" as="h2" text="Quién soy" className="h-section" accent={[1]} />
        <div>
          <Reveal delay={0.1}>
            <p className="font-display text-[clamp(1.5rem,1.1rem+1.8vw,2.5rem)] leading-[1.2] font-medium tracking-[-0.025em] text-ink">
              Soy Unai, fundador de Sarebidea. Diseño páginas web que impulsan a los negocios locales a atraer más clientes. <span className="text-cobalt">Rápido, sencillo y sin rodeos.</span>
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
