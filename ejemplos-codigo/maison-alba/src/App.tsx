import { BookingProvider } from "./booking";
import { BookingDialog } from "./components/BookingDialog";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Intro } from "./components/Intro";
import { Services } from "./components/Services";
import { Salon } from "./components/Salon";
import { Gallery } from "./components/Gallery";
import { Team } from "./components/Team";
import { Testimonials } from "./components/Testimonials";
import { FinalCta } from "./components/FinalCta";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <BookingProvider>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-3 focus:text-ivory"
      >
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido">
        <Hero />
        <Intro />
        <Services />
        <Salon />
        <Gallery />
        <Team />
        <Testimonials />
        <FinalCta />
      </main>
      <Footer />
      <BookingDialog />
    </BookingProvider>
  );
}
