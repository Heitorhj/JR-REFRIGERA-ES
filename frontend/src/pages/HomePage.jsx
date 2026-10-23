import { Link } from "react-router-dom";
import HeroSection from "../components/home/HeroSection.jsx";
import ServiceHighlights from "../components/home/ServiceHighlights.jsx";
import "../styles/home-cta.css";
import "../styles/home-responsive.css";

function HomePage() {
  return (
    <main>
      <HeroSection />
      <ServiceHighlights />
      <section className="home-cta">
        <div>
          <span className="eyebrow">Sem compromisso</span>
          <h2>Vamos deixar seu ambiente mais confortável?</h2>
          <p>Conte o que você precisa. A gente prepara uma proposta feita para o seu caso.</p>
        </div>
        <Link className="button button-primary" to="/solicitar-orcamento">
          Pedir meu orçamento <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}

export default HomePage;
