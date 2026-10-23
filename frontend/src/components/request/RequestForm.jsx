import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import FeedbackMessage from "../FeedbackMessage.jsx";
import FormField from "../FormField.jsx";

const initialForm = {
  nome: "",
  whatsapp: "",
  cidadeId: "",
  endereco: "",
  descricaoProblema: "",
  servicoId: "",
  dataPreferida: "",
  turnoPreferido: ""
};

function RequestForm({ onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [cidades, setCidades] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [carregandoCatalogo, setCarregandoCatalogo] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [dataMinima] = useState(() =>
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Recife" })
  );

  useEffect(() => {
    let active = true;

    Promise.all([api("/api/cidades"), api("/api/servicos")])
      .then(([resultadoCidades, resultadoServicos]) => {
        if (!active) return;
        setCidades(resultadoCidades.cidades);
        setServicos(resultadoServicos.servicos);
      })
      .catch((error) => {
        if (active) setErro(error.message);
      })
      .finally(() => {
        if (active) setCarregandoCatalogo(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const atualizar = (event) => {
    const { name, value } = event.target;
    setForm((atual) => ({ ...atual, [name]: value }));
  };

  const enviar = async (event) => {
    event.preventDefault();
    setErro("");
    setEnviando(true);

    try {
      const resultado = await api("/api/pedidos", {
        method: "POST",
        body: {
          nome: form.nome.trim(),
          whatsapp: form.whatsapp.trim(),
          cidadeId: Number(form.cidadeId),
          endereco: form.endereco.trim(),
          descricaoProblema: form.descricaoProblema.trim(),
          servicoId: Number(form.servicoId),
          dataPreferida: form.dataPreferida,
          turnoPreferido: form.turnoPreferido
        }
      });

      onCreated(resultado.pedido);
    } catch (error) {
      setErro(error.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="request-form" onSubmit={enviar}>
      <FeedbackMessage>{erro}</FeedbackMessage>
      <div className="request-grid">
        <FormField
          id="nome"
          label="Seu nome"
          autoComplete="name"
          placeholder="Como podemos chamar você?"
          maxLength={100}
          value={form.nome}
          onChange={atualizar}
          required
        />
        <FormField
          id="whatsapp"
          label="WhatsApp"
          type="tel"
          autoComplete="tel"
          placeholder="(81) 99999-9999"
          maxLength={20}
          value={form.whatsapp}
          onChange={atualizar}
          required
        />
        <div className="form-field">
          <label htmlFor="cidadeId">Cidade</label>
          <select
            id="cidadeId"
            name="cidadeId"
            value={form.cidadeId}
            onChange={atualizar}
            required
            disabled={carregandoCatalogo || cidades.length === 0}
          >
            <option value="">Selecione sua cidade</option>
            {cidades.map((cidade) => (
              <option key={cidade.id} value={cidade.id}>
                {cidade.nome}
              </option>
            ))}
          </select>
          {form.cidadeId && (
            <small>
              Taxa estimada de deslocamento:{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL"
              }).format(
                (cidades.find((cidade) => cidade.id === Number(form.cidadeId))
                  ?.taxaDeslocamento?.valor ?? 0) / 100
              )}
            </small>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="servicoId">Serviço</label>
          <select
            id="servicoId"
            name="servicoId"
            value={form.servicoId}
            onChange={atualizar}
            required
            disabled={carregandoCatalogo || servicos.length === 0}
          >
            <option value="">O que você precisa?</option>
            {servicos.map((servico) => (
              <option key={servico.id} value={servico.id}>
                {servico.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field request-wide">
          <label htmlFor="endereco">Endereço do atendimento</label>
          <input
            id="endereco"
            name="endereco"
            autoComplete="street-address"
            placeholder="Rua, número e complemento"
            maxLength={255}
            value={form.endereco}
            onChange={atualizar}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="dataPreferida">Data preferida</label>
          <input
            id="dataPreferida"
            name="dataPreferida"
            type="date"
            min={dataMinima}
            value={form.dataPreferida}
            onChange={atualizar}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="turnoPreferido">Turno</label>
          <select
            id="turnoPreferido"
            name="turnoPreferido"
            value={form.turnoPreferido}
            onChange={atualizar}
            required
          >
            <option value="">Selecione um turno</option>
            <option value="MANHA">Manhã</option>
            <option value="TARDE">Tarde</option>
          </select>
        </div>
        <div className="form-field request-wide">
          <label htmlFor="descricaoProblema">Conte um pouco sobre o que aconteceu</label>
          <textarea
            id="descricaoProblema"
            name="descricaoProblema"
            rows="4"
            maxLength={2000}
            placeholder="Ex.: o aparelho está fazendo barulho e não está gelando..."
            value={form.descricaoProblema}
            onChange={atualizar}
            required
          />
          <small>{form.descricaoProblema.length}/2000 caracteres</small>
        </div>
      </div>
      <div className="request-submit-row">
        <p>Seus dados são usados somente para responder à sua solicitação.</p>
        <button className="button button-primary" disabled={enviando || carregandoCatalogo}>
          {enviando ? "Enviando..." : "Enviar solicitação"} <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}

export default RequestForm;
