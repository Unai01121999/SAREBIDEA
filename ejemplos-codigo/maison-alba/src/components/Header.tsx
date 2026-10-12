import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV, SALON } from "../data/site";
import { BookButton } from "../booking";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  // El header se vuelve sólido cuando el centinela superior sale del viewport.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menu]);

  const solid = scrolled || menu;

  return (
    <>
      <div ref={sentinel} aria-hidden className="absolute left-0 top-10 h-px w-px" />
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b transition-[background-color,border-color,color] duration-500 ${
          solid ? "border-ink/10 bg-ivory text-ink" : "border-transparent bg-transparent text-ivory"
        }`}
      >
        <div className="mx-auto flex h-[68px] max-w-[1480px] items-center justify-between px-5 md:px-10">
          <a href="#inicio" className="whitespace-nowrap font-serif text-[1.4rem] leading-none tracking-[0.02em] sm:text-[1.65rem]" aria-label={`${SALON.name}, inicio`}>
            {SALON.name}
          </a>

          <nav aria-label="Principal" className="hidden items-center gap-10 lg:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="link-line text-[0.8rem] uppercase tracking-[0.12em]">
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <BookButton className={`btn ${solid ? "btn-ink" : "btn-light"} !min-h-11 !px-5 max-sm:!px-3 max-sm:!tracking-[0.1em]`}>
              Reservar cita
            </BookButton>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center lg:hidden"
              aria-expanded={menu}
              aria-controls="menu-movil"
              aria-label={menu ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMenu((m) => !m)}
            >
              {menu ? <X strokeWidth={1.25} size={26} /> : <Menu strokeWidth={1.25} size={26} />}
            </button>
          </div>
        </div>
      </header>

      <div
        id="menu-movil"
        data-open={menu}
        aria-hidden={!menu}
        inert={!menu}
        className={`fixed inset-0 z-30 bg-ivory pt-[68px] transition-[opacity,visibility] duration-500 lg:hidden ${
          menu ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <nav aria-label="Menú móvil" className="flex h-full flex-col justify-between px-5 pb-10 pt-10">
          <ul>
            {NAV.map((n, i) => (
              <li key={n.href} className="menu-item border-b border-ink/10" style={{ ["--i" as string]: i }}>
                <a href={n.href} onClick={() => setMenu(false)} className="block py-5 font-serif text-[2.4rem] leading-none">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="menu-item text-sm text-ink/70" style={{ ["--i" as string]: NAV.length }}>
            {SALON.tagline}
          </p>
        </nav>
      </div>
    </>
  );
}
