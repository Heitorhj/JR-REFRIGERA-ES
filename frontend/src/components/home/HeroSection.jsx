import { Link } from "react-router-dom";
import "../../styles/hero-section.css";

function scrollToSection(event, id) {
  const section = document.getElementById(id);
  if (!section) return;
  event.preventDefault();
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function HeroSection() {
  return (
    <section className="hero-band">
      <div className="hero-band-media" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2000&q=80"
          alt=""
        />
        <div className="hero-band-shade" />
      </div>

      <div className="hero-band-inner">
        <div className="hero-copy">
          <span className="hero-pill">
            <span className="status-dot" />
            Atendimento em Pernambuco
          </span>
          <h1>
            Seu ambiente fresco.
            <br />
            <em>Seu dia mais leve.</em>
          </h1>
          <p>
            Instalação, manutenção e cuidado para o ar-condicionado da sua casa,
            com conversa direta e um orçamento pensado para o seu espaço.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/solicitar-orcamento">
              Pedir meu orçamento <span aria-hidden="true">→</span>
            </Link>
            <a
              className="button button-ghost"
              href="#como-funciona"
              onClick={(event) => scrollToSection(event, "como-funciona")}
            >
              Como funciona
              <span className="button-arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <div className="hero-stage">
          <article className="float-card float-card-main">
            <header>
              <span className="float-mark" aria-hidden="true">❄</span>
              <span>
                <strong>Cuidado para o seu ar</strong>
                <small>Do primeiro contato à conclusão</small>
              </span>
            </header>
            <ul>
              <li>
                <em>Instalação</em>
                <span>Posicionamento e acabamento cuidadoso</span>
              </li>
              <li>
                <em>Manutenção</em>
                <span>Revisão para o equipamento seguir bem</span>
              </li>
              <li>
                <em>Reparo</em>
                <span>Diagnóstico claro antes de qualquer serviço</span>
              </li>
            </ul>
          </article>
          <article className="float-card float-card-note">
            <span className="note-sun" aria-hidden="true" />
            <span>
              <strong>Sem compromisso</strong>
              <small>A resposta chega pelo WhatsApp</small>
            </span>
          </article>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
