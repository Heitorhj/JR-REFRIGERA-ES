import { Link } from "react-router-dom";

function HomePage() {
  return (
    <main className="page-content">
      <section className="section-heading">
        <span className="eyebrow"><span className="status-dot" /> Atendimento em Pernambuco</span>
        <h1>Conforto em cada ambiente.</h1>
        <p>Instalação, manutenção e cuidado especializado para o seu ar-condicionado.</p>
        <Link className="button button-primary" to="/solicitar-orcamento">Solicitar orçamento</Link>
      </section>
    </main>
  );
}

export default HomePage;
