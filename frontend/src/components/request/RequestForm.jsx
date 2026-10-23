import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import FeedbackMessage from "../FeedbackMessage.jsx";
import FormField from "../FormField.jsx";
import DateField from "../DateField.jsx";
import SelectField from "../SelectField.jsx";

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
  const [errosCampo, setErrosCampo] = useState({});
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
    setErrosCampo((atual) => ({ ...atual, [name]: "" }));
  };

  const definirErro = (campo, mensagem) => {
    setErrosCampo((atual) => ({ ...atual, [campo]: mensagem }));
  };

  const enviar = async (event) => {
    event.preventDefault();
    setErro("");

    const pendencias = {};
    if (!form.cidadeId) pendencias.cidadeId = "Selecione sua cidade.";
    if (!form.servicoId) pendencias.servicoId = "Selecione o serviço.";
    if (!form.dataPreferida) {
      pendencias.dataPreferida = errosCampo.dataPreferida || "Informe a data preferida.";
    }
    if (!form.turnoPreferido) pendencias.turnoPreferido = "Selecione um turno.";
    setErrosCampo(pendencias);
    if (Object.keys(pendencias).length > 0) return;

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
        <div className={`form-field${errosCampo.cidadeId ? " field-invalid" : ""}`}>
          <label htmlFor="cidadeId">Cidade</label>
          <SelectField
            id="cidadeId"
            name="cidadeId"
            value={form.cidadeId}
            placeholder={carregandoCatalogo ? "Carregando cidades..." : "Selecione sua cidade"}
            disabled={carregandoCatalogo || cidades.length === 0}
            invalid={Boolean(errosCampo.cidadeId)}
            options={cidades.map((cidade) => ({ value: String(cidade.id), label: cidade.nome }))}
            onChange={atualizar}
          />
          {errosCampo.cidadeId && <small className="field-error">{errosCampo.cidadeId}</small>}
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
        <div className={`form-field${errosCampo.servicoId ? " field-invalid" : ""}`}>
          <label htmlFor="servicoId">Serviço</label>
          <SelectField
            id="servicoId"
            name="servicoId"
            value={form.servicoId}
            placeholder={carregandoCatalogo ? "Carregando serviços..." : "O que você precisa?"}
            disabled={carregandoCatalogo || servicos.length === 0}
            invalid={Boolean(errosCampo.servicoId)}
            options={servicos.map((servico) => ({ value: String(servico.id), label: servico.nome }))}
            onChange={atualizar}
          />
          {errosCampo.servicoId && <small className="field-error">{errosCampo.servicoId}</small>}
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
        <div className={`form-field${errosCampo.dataPreferida ? " field-invalid" : ""}`}>
          <label htmlFor="dataPreferida">Data preferida</label>
          <DateField
            id="dataPreferida"
            name="dataPreferida"
            value={form.dataPreferida}
            min={dataMinima}
            invalid={Boolean(errosCampo.dataPreferida)}
            onChange={atualizar}
            onError={(mensagem) => definirErro("dataPreferida", mensagem)}
          />
          {errosCampo.dataPreferida && (
            <small id="dataPreferida-erro" className="field-error">{errosCampo.dataPreferida}</small>
          )}
        </div>
        <div className={`form-field${errosCampo.turnoPreferido ? " field-invalid" : ""}`}>
          <label htmlFor="turnoPreferido">Turno</label>
          <SelectField
            id="turnoPreferido"
            name="turnoPreferido"
            value={form.turnoPreferido}
            placeholder="Selecione um turno"
            invalid={Boolean(errosCampo.turnoPreferido)}
            options={[
              { value: "MANHA", label: "Manhã" },
              { value: "TARDE", label: "Tarde" }
            ]}
            onChange={atualizar}
          />
          {errosCampo.turnoPreferido && <small className="field-error">{errosCampo.turnoPreferido}</small>}
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
