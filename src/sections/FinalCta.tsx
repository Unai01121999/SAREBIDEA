import { AnimatePresence, m } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { createLead, validateLead, type LeadFormErrors } from '../lib/leads'
import { brand, businessTypes } from '../data/site'
import { easeOut } from '../lib/motion'
import { Icon } from '../components/ui/Icon'
import { Reveal } from '../components/ui/Reveal'
import { TextReveal } from '../components/ui/TextReveal'

const field =
  'h-13 w-full rounded-2xl bg-white/[0.06] px-4 text-[1rem] text-paper ring-1 ring-white/12 transition-[box-shadow,background-color] duration-200 placeholder:text-white/40 hover:bg-white/[0.08] focus:bg-white/[0.09] focus:ring-2 focus:ring-lilac focus:outline-none'

export function FinalCta() {
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState<LeadFormErrors>({})
  const [failed, setFailed] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const d = new FormData(form)
    const v = {
      company: String(d.get('company') ?? ''),
      name: String(d.get('name') ?? ''),
      phone: String(d.get('phone') ?? ''),
      email: String(d.get('email') ?? ''),
      businessType: String(d.get('businessType') ?? ''),
      description: String(d.get('description') ?? ''),
    }
    const errs = validateLead(v)
    setErrors(errs)
    setFailed('')
    const first = Object.keys(errs)[0]
    if (first) {
      ;(form.elements.namedItem(first) as HTMLElement | null)?.focus()
      return
    }
    setLoading(true)
    try {
      await createLead({ ...v, company: v.company.trim(), name: v.name.trim(), email: v.email.trim(), description: v.description.trim(), source: 'web' })
      setSent(true)
    } catch (e) {
      if ((e as { code?: string })?.code === 'invalid_argument') {
        setFailed('Esta vista previa solo guarda solicitudes enviadas por el equipo de SAREBIDEA. En la web publicada, el formulario funcionará para cualquier visitante.')
        return
      }
      setFailed(`No hemos podido enviar tu solicitud. Inténtalo de nuevo o escríbenos a ${brand.email}.`)
    } finally {
      setLoading(false)
    }
  }

  const err = (k: keyof LeadFormErrors) =>
    errors[k] ? (
      <p id={`${k}-error`} className="mt-1.5 text-[13px] text-[#ffb4b4]">
        {errors[k]}
      </p>
    ) : null
  const aria = (k: keyof LeadFormErrors) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${k}-error` : undefined })

  return (
    <section id="contacto" className="on-dark relative isolate overflow-hidden bg-night py-24 text-paper sm:py-32 lg:py-40" aria-labelledby="cta-title">
      {/* Glow animado: dos luces que derivan muy despacio (CSS, fuera del hilo principal) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="anim-drift absolute top-[-30%] left-[-10%] h-[90%] w-[70%] rounded-full bg-[radial-gradient(closest-side,rgb(58_63_242/0.55),transparent)]" />
        <div className="anim-drift absolute right-[-15%] bottom-[-35%] h-[90%] w-[70%] rounded-full bg-[radial-gradient(closest-side,rgb(185_180_255/0.28),transparent)] [animation-delay:-13s]" />
        <div className="absolute inset-0 [background-image:radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(60%_60%_at_50%_40%,#000,transparent)]" />
      </div>

      <div className="container-x grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-20">
        <div>
          <TextReveal
            as="h2"
            text="Tu próxima web empieza aquí."
            className="display text-[clamp(2.75rem,1.4rem+5.4vw,5.6rem)] text-paper"
            accent={[3]}
          />
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-[30rem] text-[1.15rem] leading-relaxed text-white/65">
              Cuéntanos qué haces y te enseñaremos cómo podría verse tu negocio online. Sin compromiso.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <ul className="mt-10 space-y-3 text-white/75">
              {['Te respondemos en menos de 24 h laborables', 'Propuesta visual gratuita', 'Sin permanencia ni letra pequeña'].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <Icon name="check" size={18} className="text-lilac" strokeWidth={2} />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="relative rounded-[30px] bg-white/[0.04] p-6 shadow-[0_1px_0_rgb(255_255_255/0.08)_inset,0_40px_80px_-30px_rgb(0_0_0/0.6)] ring-1 ring-white/10 backdrop-blur-xl sm:p-9">
            <AnimatePresence mode="wait" initial={false}>
              {sent ? (
                <m.div
                  key="ok"
                  className="flex min-h-[380px] flex-col items-center justify-center text-center"
                  initial={{ opacity: 0, transform: 'scale(0.96)' }}
                  animate={{ opacity: 1, transform: 'scale(1)' }}
                  transition={{ duration: 0.5, ease: easeOut }}
                  role="status"
                >
                  <span className="flex size-16 items-center justify-center rounded-full bg-lilac text-night">
                    <Icon name="check" size={30} strokeWidth={2.2} />
                  </span>
                  <h3 className="mt-6 font-display text-[1.9rem] font-semibold tracking-[-0.03em]">¡Recibido!</h3>
                  <p className="mt-3 max-w-[22rem] text-white/65">Te escribimos muy pronto para conocer tu negocio y preparar tu propuesta.</p>
                </m.div>
              ) : (
                <m.form
                  key="form"
                  onSubmit={onSubmit}
                  noValidate
                  className="grid gap-4 sm:grid-cols-2"
                  exit={{ opacity: 0, transform: 'scale(0.98)' }}
                  transition={{ duration: 0.2, ease: easeOut }}
                  aria-label="Solicitar propuesta"
                >
                  <div>
                    <label htmlFor="company" className="mb-2 block text-sm text-white/70">
                      Nombre de la empresa
                    </label>
                    <input id="company" name="company" autoComplete="organization" placeholder="Panadería Urrutia" className={field} {...aria('company')} />
                    {err('company')}
                  </div>
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm text-white/70">
                      Persona de contacto
                    </label>
                    <input id="name" name="name" autoComplete="name" placeholder="Ane Etxeberria Goñi" className={field} {...aria('name')} />
                    {err('name')}
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm text-white/70">
                      Teléfono
                    </label>
                    <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="600 000 000" className={field} {...aria('phone')} />
                    {err('phone')}
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm text-white/70">
                      Correo electrónico
                    </label>
                    <input id="email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="tu@negocio.com" className={field} {...aria('email')} />
                    {err('email')}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="businessType" className="mb-2 block text-sm text-white/70">
                      Tipo de negocio
                    </label>
                    <div className="relative">
                      <select id="businessType" name="businessType" defaultValue="" className={`${field} appearance-none pr-10`} {...aria('businessType')}>
                        <option value="" disabled className="text-ink">
                          Elige una opción
                        </option>
                        {businessTypes.map((b) => (
                          <option key={b} className="text-ink">
                            {b}
                          </option>
                        ))}
                      </select>
                      <Icon name="chevron" size={18} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-white/50" />
                    </div>
                    {err('businessType')}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="description" className="mb-2 block text-sm text-white/70">
                      Breve descripción
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      maxLength={600}
                      placeholder="Qué hace tu negocio y qué te gustaría conseguir con la web."
                      className={`${field} h-auto resize-none py-3.5 leading-relaxed`}
                      {...aria('description')}
                    />
                    {err('description')}
                  </div>
                  {failed && (
                    <p role="alert" className="text-sm text-[#ffb4b4] sm:col-span-2">
                      {failed}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group mt-2 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-paper text-[1.0625rem] font-medium text-ink shadow-[0_10px_30px_-10px_rgb(185_180_255/0.6)] transition-[background-color,scale,opacity] duration-200 ease-[var(--ease-out-strong)] hover:bg-white active:scale-[0.98] disabled:opacity-70 sm:col-span-2"
                  >
                    {loading ? (
                      <span className="size-5 animate-spin rounded-full border-2 border-ink/20 border-t-ink" aria-label="Enviando" />
                    ) : (
                      <>
                        Quiero mi web
                        <Icon name="arrow" size={18} className="transition-transform duration-300 ease-[var(--ease-out-strong)] group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </m.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
