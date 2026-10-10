import { m } from 'motion/react'
import { useEffect, type ReactNode } from 'react'
import { brand, legal } from '../../data/site'
import { legalPages, type LegalPageId } from '../../hooks/useLegalRoute'
import { easeOut } from '../../lib/motion'
import { openPreferences } from '../../lib/consent'
import { Icon } from '../ui/Icon'
import { Logo } from '../ui/Logo'

const A = 'font-medium text-ink underline underline-offset-2 hover:text-cobalt'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-[1.35rem] font-semibold tracking-[-0.02em]">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-ink-2">{children}</div>
    </section>
  )
}

const Dl = ({ rows }: { rows: [string, ReactNode][] }) => (
  <dl className="divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
    {rows.map(([k, v]) => (
      <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
        <dt className="text-[0.9rem] text-mute">{k}</dt>
        <dd className="break-words">{v}</dd>
      </div>
    ))}
  </dl>
)

const Ul = ({ items }: { items: ReactNode[] }) => (
  <ul className="list-disc space-y-1.5 pl-5">
    {items.map((i, n) => (
      <li key={n}>{i}</li>
    ))}
  </ul>
)

const mail = <a href={`mailto:${brand.email}`} className={A}>{brand.email}</a>

function AvisoLegal() {
  return (
    <>
      <p className="leading-relaxed text-ink-2">
        En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se facilitan los datos identificativos del titular de este sitio web.
      </p>

      <Section title="1. Datos identificativos">
        <Dl
          rows={[
            ['Titular', legal.owner],
            ['NIF / CIF', legal.taxId],
            ['Domicilio', legal.address],
            ['Correo electrónico', mail],
            ['Sitio web', legal.url],
            ...(legal.registry ? ([['Registro Mercantil', legal.registry]] as [string, ReactNode][]) : []),
          ]}
        />
        <p>
          Nombre comercial: {brand.name}. Actividad: diseño, desarrollo y publicación de páginas web para comercios y pequeños negocios.
        </p>
      </Section>

      <Section title="2. Objeto y condiciones de uso">
        <p>
          Este aviso regula el acceso y el uso del sitio web {legal.domain}. Navegar por el sitio atribuye la condición de usuario e implica la aceptación de estas condiciones. Si no estás de acuerdo con ellas, debes abandonar el sitio.
        </p>
        <p>
          El usuario se compromete a hacer un uso adecuado de los contenidos y servicios, conforme a la ley, a la buena fe y al orden público, y a no emplearlos para actividades ilícitas, para dañar o sobrecargar el sitio, ni para introducir datos falsos o de terceros sin su autorización en los formularios.
        </p>
      </Section>

      <Section title="3. Propiedad intelectual e industrial">
        <p>
          Los textos, imágenes, diseños, logotipos, marca, código y demás contenidos de este sitio son titularidad de {legal.owner} o se utilizan con la debida autorización, y están protegidos por la normativa de propiedad intelectual e industrial. Queda prohibida su reproducción, distribución, comunicación pública o transformación, total o parcial, sin autorización expresa y por escrito.
        </p>
        <p>
          Los ejemplos de páginas web mostrados son demostrativos. Las marcas y nombres de terceros que pudieran aparecer pertenecen a sus respectivos propietarios.
        </p>
      </Section>

      <Section title="4. Responsabilidad">
        <Ul
          items={[
            'Nos esforzamos por mantener la información actualizada y el sitio disponible, pero no garantizamos la ausencia de errores ni la disponibilidad continuada, y podemos modificar o retirar contenidos sin previo aviso.',
            'No respondemos de los daños derivados de interrupciones del servicio, fallos técnicos ajenos a nuestro control o del uso indebido del sitio por terceros.',
            'Los contenidos son informativos. Una propuesta o presupuesto solo nos vincula cuando se formaliza por escrito.',
          ]}
        />
      </Section>

      <Section title="5. Enlaces">
        <p>
          El sitio puede contener enlaces a páginas de terceros. No controlamos sus contenidos ni sus políticas y no asumimos responsabilidad por ellos. Si detectas un enlace ilícito o inadecuado, avísanos en {mail}.
        </p>
      </Section>

      <Section title="6. Protección de datos y cookies">
        <p>
          El tratamiento de datos personales se describe en la <a href="#politica-de-privacidad" className={A}>Política de privacidad</a> y el uso de cookies y almacenamiento en la <a href="#politica-de-cookies" className={A}>Política de cookies</a>.
        </p>
      </Section>

      <Section title="7. Comunicaciones comerciales">
        <p>
          No enviamos comunicaciones comerciales por correo electrónico o medios equivalentes sin tu consentimiento previo, conforme al artículo 21 de la LSSI-CE. Los datos que nos facilitas en el formulario se usan únicamente para responder a tu solicitud.
        </p>
      </Section>

      <Section title="8. Legislación aplicable y jurisdicción">
        <p>
          Este aviso se rige por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales que resulten competentes conforme a la normativa vigente; si eres consumidor o usuario, los de tu domicilio.
        </p>
      </Section>
    </>
  )
}

function Privacidad() {
  return (
    <>
      <p className="leading-relaxed text-ink-2">
        Esta política explica cómo tratamos tus datos personales cuando usas este sitio web y nos escribes a través del formulario, conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018 (LOPDGDD).
      </p>

      <Section title="1. Responsable del tratamiento">
        <Dl
          rows={[
            ['Responsable', legal.owner],
            ['NIF / CIF', legal.taxId],
            ['Domicilio', legal.address],
            ['Contacto', mail],
          ]}
        />
      </Section>

      <Section title="2. Qué datos tratamos">
        <p>Los que nos facilitas tú mismo en el formulario de contacto:</p>
        <Ul items={['Nombre y apellidos.', 'Teléfono.', 'Correo electrónico.', 'Tipo de negocio.', 'El texto de la breve descripción que escribas.']} />
        <p>
          Además, el servidor que aloja la web registra de forma automática datos técnicos mínimos de la conexión (como la dirección IP y la fecha y hora de acceso) por motivos de seguridad y funcionamiento. No elaboramos perfiles ni tomamos decisiones automatizadas.
        </p>
      </Section>

      <Section title="3. Para qué y con qué base jurídica">
        <Dl
          rows={[
            ['Atender tu solicitud', 'Responder a tu consulta y preparar la propuesta que pides. Base: aplicación de medidas precontractuales a petición tuya (art. 6.1.b RGPD).'],
            ['Gestionar el servicio', 'Si contratas, mantener la relación y prestar el servicio. Base: ejecución del contrato (art. 6.1.b RGPD).'],
            ['Obligaciones legales', 'Conservar la documentación fiscal y contable. Base: cumplimiento de obligaciones legales (art. 6.1.c RGPD).'],
            ['Seguridad del sitio', 'Mantener la seguridad y evitar abusos. Base: interés legítimo (art. 6.1.f RGPD).'],
          ]}
        />
        <p>No usamos tus datos para enviarte publicidad ni boletines. Si algún día lo hiciéramos, te pediríamos antes tu consentimiento.</p>
        <p>
          Los campos del formulario son necesarios para poder contestarte. Si no los facilitas, no podremos atender la solicitud.
        </p>
      </Section>

      <Section title="4. Cuánto tiempo los conservamos">
        <Ul
          items={[
            'Si tu solicitud no se convierte en un contrato: durante el tiempo necesario para atenderla y, como máximo, 12 meses desde el último contacto.',
            'Si contratas: mientras dure la relación y, después, durante los plazos legales aplicables (mercantiles y tributarios), bloqueados y solo a disposición de las autoridades.',
          ]}
        />
        <p>Pasado ese tiempo, los datos se suprimen o se anonimizan.</p>
      </Section>

      <Section title="5. A quién se los comunicamos">
        <p>No vendemos ni cedemos tus datos. Solo acceden proveedores que los tratan por encargo nuestro, con contrato de encargo de tratamiento (art. 28 RGPD):</p>
        <Ul
          items={[
            'Supabase: base de datos donde se guardan las solicitudes (servidores en la Unión Europea).',
            'Resend: envío del aviso interno por correo electrónico cuando recibimos una solicitud (proveedor con sede en EE. UU.).',
            'Hostinger: alojamiento web y servicios de correo asociados al dominio.',
            'Google (Google Analytics): solo si aceptas las cookies de analítica; mide el uso de la web de forma agregada (ver Política de cookies).',
          ]}
        />
        <p>
          Cuando un proveedor trate datos fuera del Espacio Económico Europeo, lo hará con garantías adecuadas, como las cláusulas contractuales tipo de la Comisión Europea o la certificación del Marco de Privacidad de Datos UE-EE. UU. También podremos comunicar datos a autoridades cuando la ley lo exija.
        </p>
      </Section>

      <Section title="6. Tus derechos">
        <p>Puedes ejercer en cualquier momento los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, escribiéndonos a {mail} e indicando el derecho que ejerces. Podemos pedirte que acredites tu identidad. Respondemos en el plazo máximo de un mes.</p>
        <p>
          Si crees que no hemos tratado bien tus datos, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className={A}>www.aepd.es</a>).
        </p>
      </Section>

      <Section title="7. Seguridad">
        <p>
          Aplicamos medidas técnicas y organizativas adecuadas: conexión cifrada (HTTPS), acceso a las solicitudes restringido a la persona responsable mediante autenticación en dos pasos, y reglas en la base de datos que impiden que cualquier visitante pueda leer lo que otros han enviado.
        </p>
      </Section>

      <Section title="8. Cambios en esta política">
        <p>Si cambiamos algo relevante, actualizaremos esta página y la fecha de abajo.</p>
      </Section>
    </>
  )
}

function Cookies() {
  const th = 'px-3 py-2.5 text-left text-[0.8rem] font-medium text-mute'
  const td = 'px-3 py-3 align-top text-[0.9rem]'
  const optional: [string, string, string, string][] = [
    ['_ga', 'Distinguir visitantes y medir el uso de la web. Google Analytics (Google Ireland Ltd. / Google LLC), cookie de terceros.', '13 meses', 'Analítica'],
    ['_ga_9VQM7EP390', 'Mantener el estado de la sesión de visita. Google Analytics, cookie de terceros.', '13 meses', 'Analítica'],
  ]
  const rows: [string, string, string, string][] = [
    ['sarebidea-consent', 'Recordar tu elección sobre cookies. Propia, localStorage.', '12 meses', 'Técnica'],
    ['sb-…-auth-token', 'Mantener la sesión en el panel privado (solo la usa la persona administradora). Supabase, localStorage.', 'Hasta cerrar sesión', 'Técnica'],
  ]
  return (
    <>
      <p className="leading-relaxed text-ink-2">
        Esta política cumple el artículo 22.2 de la LSSI-CE, el RGPD y la guía sobre el uso de cookies de la Agencia Española de Protección de Datos. Las cookies y tecnologías similares (como el almacenamiento local del navegador) son pequeños archivos o datos que una web guarda en tu dispositivo.
      </p>

      <Section title="1. Qué usamos hoy">
        <p>
          Al abrirse, esta web <strong className="font-semibold">no carga servicios de terceros ni crea cookies de analítica o publicidad</strong> (las tipografías se sirven desde nuestro propio sitio, sin contactar con otros servidores). Solo usa almacenamiento técnico imprescindible, que no requiere consentimiento:
        </p>
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
          <table className="w-full min-w-[34rem] border-collapse">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>Nombre</th>
                <th className={th}>Finalidad y titular</th>
                <th className={th}>Duración</th>
                <th className={th}>Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(([n, f, d, t]) => (
                <tr key={n}>
                  <td className={`${td} font-mono text-[0.82rem]`}>{n}</td>
                  <td className={td}>{f}</td>
                  <td className={td}>{d}</td>
                  <td className={td}>{t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="2. Cookies opcionales (solo si las aceptas)">
        <p>
          Usamos <strong className="font-semibold">Google Analytics</strong> para conocer, de forma agregada, cómo se usa la web. Está <strong className="font-semibold">desactivado por defecto</strong>: no se carga nada de Google ni se crea ninguna cookie hasta que aceptas la categoría «Analítica». Si la rechazas, o la retiras después, se detiene y se borran sus cookies. Rechazar es tan fácil como aceptar: el banner ofrece los botones «Rechazar todo» y «Aceptar todo» al mismo nivel. No usamos cookies de marketing.
        </p>
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
          <table className="w-full min-w-[34rem] border-collapse">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>Nombre</th>
                <th className={th}>Finalidad y titular</th>
                <th className={th}>Duración</th>
                <th className={th}>Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {optional.map(([n, f, d, t]) => (
                <tr key={n}>
                  <td className={`${td} font-mono text-[0.82rem]`}>{n}</td>
                  <td className={td}>{f}</td>
                  <td className={td}>{d}</td>
                  <td className={td}>{t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Al aceptar, Google puede tratar datos como tu dirección IP y datos de uso, y transferirlos fuera del Espacio Económico Europeo con las garantías que ofrece (cláusulas contractuales tipo y Marco de Privacidad de Datos UE-EE. UU.). Más información en la <a href="https://policies.google.com/technologies/partner-sites?hl=es" target="_blank" rel="noopener noreferrer" className={A}>política de Google sobre el uso de datos</a>. Si cambiamos las categorías, te volveremos a preguntar.
        </p>
      </Section>

      <Section title="3. Cambiar o retirar tu elección">
        <p>Puedes modificar tu decisión en cualquier momento. Retirarla es tan sencillo como darla.</p>
        <button
          type="button"
          onClick={openPreferences}
          className="inline-flex h-12 items-center rounded-full bg-ink px-6 font-medium text-paper transition-[background-color,scale] hover:bg-[#1c1e26] active:scale-[0.97]"
        >
          Configurar cookies
        </button>
        <p>
          También puedes borrar los datos de este sitio desde los ajustes de tu navegador (Chrome, Firefox, Safari, Edge…), en el apartado de privacidad o cookies.
        </p>
      </Section>

      <Section title="4. Más información">
        <p>
          Para cualquier duda, escríbenos a {mail}. Consulta también la <a href="#politica-de-privacidad" className={A}>Política de privacidad</a>.
        </p>
      </Section>
    </>
  )
}

const bodies: Record<LegalPageId, () => ReactNode> = {
  'aviso-legal': AvisoLegal,
  'politica-de-privacidad': Privacidad,
  'politica-de-cookies': Cookies,
}

export function LegalPage({ page, onClose }: { page: LegalPageId; onClose: () => void }) {
  const Body = bodies[page]

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <m.div
      data-lenis-prevent
      className="on-light fixed inset-0 z-[70] overflow-y-auto bg-paper"
      initial={{ opacity: 0, transform: 'translate3d(0,16px,0)' }}
      animate={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
      exit={{ opacity: 0, transform: 'translate3d(0,16px,0)' }}
      transition={{ duration: 0.3, ease: easeOut }}
      role="region"
      aria-label={legalPages[page]}
    >
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center justify-between gap-3">
          <Logo />
          <button type="button" onClick={onClose} className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-[0.94rem] ring-1 ring-line transition-colors hover:bg-ink/[0.05]">
            <Icon name="arrow" size={16} className="rotate-180" /> <span className="hidden sm:inline">Volver a la web</span>
            <span className="sm:hidden">Volver</span>
          </button>
        </div>
      </header>

      <main className="container-x pt-10 pb-24 sm:pt-14">
        <article className="mx-auto max-w-[46rem]">
          <h1 className="font-display text-[clamp(2rem,1.4rem+2.4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.035em]">{legalPages[page]}</h1>
          <p className="mt-3 text-[0.9rem] text-mute">Última actualización: {legal.updated}</p>
          <div className="mt-8">
            <Body />
          </div>
          <nav aria-label="Otras páginas legales" className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-[0.95rem]">
            {(Object.keys(legalPages) as LegalPageId[])
              .filter((k) => k !== page)
              .map((k) => (
                <a key={k} href={`#${k}`} className={A}>
                  {legalPages[k]}
                </a>
              ))}
          </nav>
        </article>
      </main>
    </m.div>
  )
}
