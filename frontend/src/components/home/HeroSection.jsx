import { Link } from "react-router-dom";
import "../../styles/hero-section.css";

function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-copy">
        <span className="eyebrow"><span className="status-dot" /> Atendimento em Pernambuco</span>
        <h1>Seu ambiente fresco.<br /><em>Seu dia mais leve.</em></h1>
        <p>
          Instalação, manutenção e cuidado especializado para o seu ar-condicionado,
          com atendimento próximo e transparente.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/solicitar-orcamento">
            Pedir meu orçamento <span aria-hidden="true">→</span>
          </Link>
          <span className="hero-note">Sem compromisso · Resposta pelo WhatsApp</span>
        </div>
        <div className="hero-proof">
          <span className="proof-icon" aria-hidden="true">✓</span>
          <span><strong>Atendimento cuidadoso</strong><small>Do primeiro contato à conclusão</small></span>
        </div>
      </div>

      <div className="hero-art" role="img" aria-label="Ilustração de uma sala confortável e climatizada">
        <div className="sun-disc" />
        <div className="room-window"><span /><span /><span /><span /></div>
        <div className="air-unit"><span /><i /><i /><i /><i /></div>
        <div className="air-flow flow-one" /><div className="air-flow flow-two" /><div className="air-flow flow-three" />
        <div className="room-plant plant-one"><i /><i /><i /><b /></div>
        <div className="room-plant plant-two"><i /><i /><b /></div>
        <div className="room-floor" />
        <div className="room-sofa"><span /><i /></div>
        <div className="art-caption">
          <span className="caption-star" aria-hidden="true">✳</span>
          <span><strong>Bem-estar começa em casa</strong><small>Climatização feita com atenção</small></span>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
