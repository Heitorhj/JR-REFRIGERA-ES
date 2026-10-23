import { useState } from "react";
import RequestConfirmation from "../components/request/RequestConfirmation.jsx";
import RequestForm from "../components/request/RequestForm.jsx";
import "../styles/request.css";

function RequestPage() {
  const [pedido, setPedido] = useState(null);

  return (
    <main className="request-page">
      <div className="request-heading">
        <span className="eyebrow">Orçamento sem compromisso</span>
        <h1>Vamos cuidar do seu ar?</h1>
        <p>Preencha os dados abaixo. Nosso atendimento é feito com atenção e sem surpresas.</p>
      </div>
      <section className="request-card">
        {pedido ? (
          <RequestConfirmation pedido={pedido} />
        ) : (
          <>
            <div className="request-card-heading">
              <span className="step-number">01</span>
              <div>
                <h2>Sobre o atendimento</h2>
                <p>Quanto mais detalhes, melhor podemos ajudar.</p>
              </div>
            </div>
            <RequestForm onCreated={setPedido} />
          </>
        )}
      </section>
      {!pedido && (
        <p className="request-privacy">
          Ao enviar, você solicita um contato da JR Refrigerações. Ainda não é um agendamento confirmado.
        </p>
      )}
    </main>
  );
}

export default RequestPage;
