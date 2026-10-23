import { Link } from "react-router-dom";

function RequestConfirmation({ pedido }) {
  return (
    <section className="request-confirmation" role="status">
      <span className="confirmation-check" aria-hidden="true">✓</span>
      <span className="eyebrow">Solicitação enviada</span>
      <h2>Obrigado, {pedido.cliente?.nome?.split(" ")[0] ?? "tudo certo"}!</h2>
      <p>
        Seu pedido <strong>#{pedido.id}</strong> foi recebido. Nossa equipe vai
        analisar as informações e entrar em contato pelo WhatsApp.
      </p>
      <div className="confirmation-status">
        <span className="status-dot" /> Pedido recebido · aguardando análise
      </div>
      <Link className="button button-primary" to="/">Voltar ao início</Link>
    </section>
  );
}

export default RequestConfirmation;
