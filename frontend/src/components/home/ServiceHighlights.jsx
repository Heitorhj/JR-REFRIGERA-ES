import "../../styles/service-highlights.css";

function ServiceHighlights() {
  return (
    <>
      <section className="trust-strip" aria-label="Diferenciais">
        <div><span>01</span><p><strong>Orçamento claro</strong><small>Valores apresentados antes do serviço</small></p></div>
        <div><span>02</span><p><strong>Atendimento próximo</strong><small>Conversa direta com quem executa</small></p></div>
        <div><span>03</span><p><strong>Na sua região</strong><small>Consulte as cidades atendidas</small></p></div>
      </section>

      <section className="services-section" id="servicos">
        <div className="services-heading">
          <span className="eyebrow">Como podemos ajudar</span>
          <h2>Cuidado completo para o seu ar</h2>
          <p>Conte o que está acontecendo. A gente entende sua necessidade e prepara uma proposta para você.</p>
        </div>
        <div className="service-cards">
          <article className="service-card">
            <span className="service-icon" aria-hidden="true">❄</span>
            <h3>Instalação</h3>
            <p>Instalação planejada para seu espaço, com segurança e acabamento cuidadoso.</p>
          </article>
          <article className="service-card">
            <span className="service-icon" aria-hidden="true">✳</span>
            <h3>Manutenção</h3>
            <p>Revisão e limpeza para manter o equipamento funcionando bem.</p>
          </article>
          <article className="service-card">
            <span className="service-icon" aria-hidden="true">⌁</span>
            <h3>Reparo</h3>
            <p>Avaliação de falhas e orientação clara sobre o que precisa ser feito.</p>
          </article>
        </div>
      </section>
    </>
  );
}

export default ServiceHighlights;
