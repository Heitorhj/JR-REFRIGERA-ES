import { Link } from "react-router-dom";
import HeroSection from "../components/home/HeroSection.jsx";
import ServiceHighlights from "../components/home/ServiceHighlights.jsx";
import "../styles/home-cta.css";
import "../styles/home-responsive.css";
import "../styles/home-landing.css";

const services = [
  {
    title: "Instalação",
    description: "Montagem segura e cuidada, com orientação para o melhor posicionamento do equipamento.",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Manutenção",
    description: "Limpeza, ajustes e revisão para manter o desempenho e a vida útil do sistema.",
    image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Reparo",
    description: "Diagnóstico de falhas e solução prática para recuperar conforto e funcionalidade.",
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80"
  }
];

const reasons = [
  "Atendimento direto e objetivo.",
  "Proposta pensada para o seu ambiente.",
  "Trabalho com foco em conforto e economia.",
  "Resposta prática para agendamento e manutenção."
];

function HomePage() {
  return (
    <main className="home-page-shell">
      <HeroSection />
      <ServiceHighlights />

      <section className="home-story">
        <div className="story-copy">
          <span className="eyebrow">JR Refrigerações</span>
          <h2>Atendimento profissional para manter seu ambiente sempre em equilíbrio.</h2>
          <p>
            A JR Refrigerações cuida de instalação, manutenção e suporte para ambientes residenciais
            e comerciais com foco em conforto, durabilidade e bom atendimento.
          </p>
          <ol className="story-list">
            <li>Diagnóstico e orientação clara.</li>
            <li>Execução com cuidado e organização.</li>
            <li>Solicite seu orçamento com rapidez.</li>
          </ol>
        </div>
        <div className="story-visual" aria-label="Equipe trabalhando com climatização">
          <img
            src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80"
            alt="Técnico trabalhando com instalação de ar-condicionado"
          />
        </div>
      </section>

      <section className="home-showcase">
        <div className="services-heading">
          <span className="eyebrow">Serviços</span>
          <h2>Soluções para manter seu espaço confortável.</h2>
        </div>
        <div className="service-photo-grid">
          {services.map((service) => (
            <article key={service.title} className="photo-service-card">
              <img src={service.image} alt={service.title} />
              <div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-benefits">
        <div className="services-heading">
          <span className="eyebrow">Por que escolher a JR</span>
          <h2>Confiança e atenção em cada etapa.</h2>
        </div>
        <div className="benefits-grid">
          {reasons.map((reason, index) => (
            <div key={reason} className="benefit-item">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{reason}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <div>
          <span className="eyebrow">Sem compromisso</span>
          <h2>Vamos deixar seu ambiente mais confortável?</h2>
          <p>Conte o que você precisa e receba uma proposta pensada para o seu caso.</p>
        </div>
        <Link className="button button-primary" to="/solicitar-orcamento">
          Pedir meu orçamento <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}

export default HomePage;
