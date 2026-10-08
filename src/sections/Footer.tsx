import { brand } from '../data/site'
import { Icon } from '../components/ui/Icon'
import { openPreferences } from '../lib/consent'
import { Logo } from '../components/ui/Logo'

const cols = [
  {
    title: 'Navegación',
    links: [
      ['Servicios', '#servicios'],
      ['Ejemplos', '#ejemplos'],
      ['FAQ', '#faq'],
      ['Contacto', '#contacto'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['Aviso legal', '#aviso-legal'],
      ['Política de privacidad', '#politica-de-privacidad'],
      ['Política de cookies', '#politica-de-cookies'],
    ],
  },
]

export function Footer() {
  return (
    <footer className="on-dark relative overflow-hidden bg-night text-paper">
      <div className="container-x border-t border-white/10 pt-16 pb-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="paper" size={30} tagline />
            <p className="mt-6 max-w-[20rem] text-white/55">Webs profesionales para comercios y pequeños negocios que quieren más clientes.</p>
          </div>
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="text-sm text-white/40">{c.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {c.links.map(([l, h]) => (
                  <li key={l}>
                    <a href={h} className="text-white/80 transition-colors hover:text-white">
                      {l}
                    </a>
                  </li>
                ))}
                {c.title === 'Legal' && (
                  <li>
                    <button type="button" onClick={openPreferences} className="text-white/80 transition-colors hover:text-white">
                      Configurar cookies
                    </button>
                  </li>
                )}
              </ul>
            </nav>
          ))}
          <div>
            <h2 className="text-sm text-white/40">Contacto</h2>
            <ul className="mt-4 space-y-2.5 text-white/80">
              <li>
                <a href={`mailto:${brand.email}`} className="hover:text-white">
                  {brand.email}
                </a>
              </li>
            </ul>
            <div className="mt-5 flex gap-2">
              {(['instagram', 'linkedin'] as const).map((n) => (
                <a
                  key={n}
                  href="#"
                  aria-label={n === 'instagram' ? 'Instagram' : 'LinkedIn'}
                  className="flex size-10 items-center justify-center rounded-full ring-1 ring-white/15 transition-colors hover:bg-white/10"
                >
                  <Icon name={n} size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Firma tipográfica gigante, recortada por el borde inferior */}
      <div aria-hidden="true" className="container-x select-none">
        <div className="font-brand text-[clamp(3rem,14vw,13rem)] leading-[0.78] font-extrabold tracking-[-0.02em] whitespace-nowrap text-white/[0.06]">SAREBIDEA</div>
      </div>
      <div className="container-x flex flex-col gap-2 border-t border-white/10 py-6 text-sm text-white/40 sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} SAREBIDEA. Todos los derechos reservados.</span>
        <a href="#top" className="hover:text-white/80">
          Volver arriba ↑
        </a>
      </div>
    </footer>
  )
}
