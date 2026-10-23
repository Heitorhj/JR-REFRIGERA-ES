import { useEffect, useState } from "react";
import {
  createCity,
  createFee,
  createService,
  deactivateCity,
  deactivateService,
  listCities,
  listFees,
  listServices,
  reactivateCity,
  reactivateService,
  updateCity,
  updateFee,
  updateService
} from "../../api/adminCatalog.js";
import FeedbackMessage from "../FeedbackMessage.jsx";
import FormField from "../FormField.jsx";
import "../../styles/admin-catalog.css";

const defaultServiceForm = { nome: "", slug: "", descricao: "" };
const defaultCityForm = { nome: "", nivel: "", regiao: "" };
const defaultFeeForm = { nivel: "", valor: "" };

const formatMoney = (valorEmCentavos) => {
  if (valorEmCentavos === null || valorEmCentavos === undefined || Number.isNaN(Number(valorEmCentavos))) {
    return "R$ 0,00";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(valorEmCentavos) / 100);
};

function AdminCatalogPanel({ token }) {
  const [activeTab, setActiveTab] = useState("services");
  const [services, setServices] = useState([]);
  const [cities, setCities] = useState([]);
  const [fees, setFees] = useState([]);
  const [serviceForm, setServiceForm] = useState(defaultServiceForm);
  const [cityForm, setCityForm] = useState(defaultCityForm);
  const [feeForm, setFeeForm] = useState(defaultFeeForm);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingCityId, setEditingCityId] = useState(null);
  const [editingFeeNivel, setEditingFeeNivel] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  const loadCatalogs = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const [servicosResult, cidadesResult, taxasResult] = await Promise.all([
        listServices(token),
        listCities(token),
        listFees(token)
      ]);

      setServices(servicosResult.servicos ?? []);
      setCities(cidadesResult.cidades ?? []);
      setFees(taxasResult.taxas ?? []);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadCatalogs();
    }
  }, [token]);

  const handleServiceSubmit = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        nome: serviceForm.nome.trim(),
        slug: serviceForm.slug.trim(),
        descricao: serviceForm.descricao.trim()
      };

      if (editingServiceId) {
        await updateService(token, editingServiceId, payload);
        setMessage({ type: "success", text: "Serviço atualizado com sucesso." });
      } else {
        await createService(token, payload);
        setMessage({ type: "success", text: "Serviço cadastrado com sucesso." });
      }

      setServiceForm(defaultServiceForm);
      setEditingServiceId(null);
      await loadCatalogs();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleCitySubmit = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        nome: cityForm.nome.trim(),
        nivel: Number(cityForm.nivel),
        regiao: cityForm.regiao.trim()
      };

      if (editingCityId) {
        await updateCity(token, editingCityId, payload);
        setMessage({ type: "success", text: "Cidade atualizada com sucesso." });
      } else {
        await createCity(token, payload);
        setMessage({ type: "success", text: "Cidade cadastrada com sucesso." });
      }

      setCityForm(defaultCityForm);
      setEditingCityId(null);
      await loadCatalogs();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleFeeSubmit = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        nivel: Number(feeForm.nivel),
        valor: Math.round(Number(feeForm.valor) * 100)
      };

      if (editingFeeNivel !== null) {
        await updateFee(token, editingFeeNivel, payload);
        setMessage({ type: "success", text: "Taxa atualizada com sucesso." });
      } else {
        await createFee(token, payload);
        setMessage({ type: "success", text: "Taxa cadastrada com sucesso." });
      }

      setFeeForm(defaultFeeForm);
      setEditingFeeNivel(null);
      await loadCatalogs();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const toggleServiceStatus = async (service) => {
    try {
      if (service.ativo) {
        await deactivateService(token, service.id);
        setMessage({ type: "success", text: `Serviço ${service.nome} desativado.` });
      } else {
        await reactivateService(token, service.id);
        setMessage({ type: "success", text: `Serviço ${service.nome} reativado.` });
      }
      await loadCatalogs();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const toggleCityStatus = async (city) => {
    try {
      if (city.ativa) {
        await deactivateCity(token, city.id);
        setMessage({ type: "success", text: `Cidade ${city.nome} desativada.` });
      } else {
        await reactivateCity(token, city.id);
        setMessage({ type: "success", text: `Cidade ${city.nome} reativada.` });
      }
      await loadCatalogs();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const editService = (service) => {
    setServiceForm({
      nome: service.nome,
      slug: service.slug,
      descricao: service.descricao
    });
    setEditingServiceId(service.id);
    setActiveTab("services");
  };

  const editCity = (city) => {
    setCityForm({
      nome: city.nome,
      nivel: String(city.nivel),
      regiao: city.regiao
    });
    setEditingCityId(city.id);
    setActiveTab("cities");
  };

  const editFee = (fee) => {
    setFeeForm({
      nivel: String(fee.nivel),
      valor: (Number(fee.valor) / 100).toFixed(2)
    });
    setEditingFeeNivel(fee.nivel);
    setActiveTab("fees");
  };

  return (
    <section className="admin-catalog-panel">
      <div className="admin-tab-bar" role="tablist" aria-label="Administração de catálogo">
        <button
          type="button"
          className={activeTab === "services" ? "is-active" : ""}
          onClick={() => setActiveTab("services")}
        >
          Serviços
        </button>
        <button
          type="button"
          className={activeTab === "cities" ? "is-active" : ""}
          onClick={() => setActiveTab("cities")}
        >
          Cidades
        </button>
        <button
          type="button"
          className={activeTab === "fees" ? "is-active" : ""}
          onClick={() => setActiveTab("fees")}
        >
          Taxas
        </button>
      </div>

      <FeedbackMessage type={message.type === "success" ? "success" : "error"}>{message.text}</FeedbackMessage>

      {loading && <p className="catalog-loading">Carregando cadastros...</p>}

      {!loading && activeTab === "services" && (
        <div className="catalog-grid">
          <form className="catalog-form" onSubmit={handleServiceSubmit}>
            <h3>{editingServiceId ? "Editar serviço" : "Novo serviço"}</h3>
            <FormField
              id="serviceNome"
              label="Nome"
              value={serviceForm.nome}
              onChange={(event) => setServiceForm({ ...serviceForm, nome: event.target.value })}
              required
            />
            <FormField
              id="serviceSlug"
              label="Slug"
              value={serviceForm.slug}
              onChange={(event) => setServiceForm({ ...serviceForm, slug: event.target.value })}
              required
            />
            <label className="form-field">
              <span>Descrição</span>
              <textarea
                value={serviceForm.descricao}
                onChange={(event) => setServiceForm({ ...serviceForm, descricao: event.target.value })}
                rows="4"
                required
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="button button-primary">
                {editingServiceId ? "Salvar alterações" : "Cadastrar serviço"}
              </button>
              {editingServiceId && (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setEditingServiceId(null);
                    setServiceForm(defaultServiceForm);
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="catalog-list-panel">
            <h3>Serviços cadastrados</h3>
            <div className="catalog-list">
              {services.map((service) => (
                <article key={service.id} className={`catalog-card ${service.ativo ? "" : "is-inactive"}`}>
                  <div>
                    <strong>{service.nome}</strong>
                    <span className="catalog-meta">/{service.slug}</span>
                  </div>
                  <p>{service.descricao}</p>
                  <div className="card-actions">
                    <button type="button" className="button button-secondary" onClick={() => editService(service)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className={service.ativo ? "button button-danger" : "button button-primary"}
                      onClick={() => toggleServiceStatus(service)}
                    >
                      {service.ativo ? "Desativar" : "Reativar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === "cities" && (
        <div className="catalog-grid">
          <form className="catalog-form" onSubmit={handleCitySubmit}>
            <h3>{editingCityId ? "Editar cidade" : "Nova cidade"}</h3>
            <FormField
              id="cityNome"
              label="Nome da cidade"
              value={cityForm.nome}
              onChange={(event) => setCityForm({ ...cityForm, nome: event.target.value })}
              required
            />
            <FormField
              id="cityNivel"
              label="Nível de deslocamento"
              type="number"
              min="0"
              max="4"
              value={cityForm.nivel}
              onChange={(event) => setCityForm({ ...cityForm, nivel: event.target.value })}
              required
            />
            <FormField
              id="cityRegiao"
              label="Região"
              value={cityForm.regiao}
              onChange={(event) => setCityForm({ ...cityForm, regiao: event.target.value })}
              required
            />
            <div className="form-actions">
              <button type="submit" className="button button-primary">
                {editingCityId ? "Salvar cidade" : "Cadastrar cidade"}
              </button>
              {editingCityId && (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setEditingCityId(null);
                    setCityForm(defaultCityForm);
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="catalog-list-panel">
            <h3>Cidades atendidas</h3>
            <div className="catalog-list">
              {cities.map((city) => (
                <article key={city.id} className={`catalog-card ${city.ativa ? "" : "is-inactive"}`}>
                  <div>
                    <strong>{city.nome}</strong>
                    <span className="catalog-meta">Nível {city.nivel}</span>
                  </div>
                  <p>{city.regiao}</p>
                  <small>{formatMoney(city.taxaDeslocamento?.valor ?? 0)}</small>
                  <div className="card-actions">
                    <button type="button" className="button button-secondary" onClick={() => editCity(city)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className={city.ativa ? "button button-danger" : "button button-primary"}
                      onClick={() => toggleCityStatus(city)}
                    >
                      {city.ativa ? "Desativar" : "Reativar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === "fees" && (
        <div className="catalog-grid">
          <form className="catalog-form" onSubmit={handleFeeSubmit}>
            <h3>{editingFeeNivel !== null ? "Editar taxa" : "Nova taxa"}</h3>
            <FormField
              id="feeNivel"
              label="Nível"
              type="number"
              min="0"
              max="4"
              value={feeForm.nivel}
              onChange={(event) => setFeeForm({ ...feeForm, nivel: event.target.value })}
              required
            />
            <FormField
              id="feeValor"
              label="Valor em reais"
              type="number"
              min="0"
              step="0.01"
              value={feeForm.valor}
              onChange={(event) => setFeeForm({ ...feeForm, valor: event.target.value })}
              required
            />
            <div className="form-actions">
              <button type="submit" className="button button-primary">
                {editingFeeNivel !== null ? "Salvar taxa" : "Cadastrar taxa"}
              </button>
              {editingFeeNivel !== null && (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setEditingFeeNivel(null);
                    setFeeForm(defaultFeeForm);
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="catalog-list-panel">
            <h3>Taxas de deslocamento</h3>
            <div className="catalog-list">
              {fees.map((fee) => (
                <article key={fee.id} className="catalog-card">
                  <div>
                    <strong>Nível {fee.nivel}</strong>
                    <span className="catalog-meta">{formatMoney(fee.valor)}</span>
                  </div>
                  <div className="card-actions">
                    <button type="button" className="button button-secondary" onClick={() => editFee(fee)}>
                      Editar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminCatalogPanel;
