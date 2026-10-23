import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import BrandLogo from "../components/BrandLogo.jsx";
import FeedbackMessage from "../components/FeedbackMessage.jsx";
import FormField from "../components/FormField.jsx";
import "../styles/site-header.css";
import "../styles/login.css";

const pontos = [
  "Pedidos organizados por etapa",
  "Proposta e WhatsApp no mesmo fluxo",
  "Serviços e cidades sob controle"
];

function LoginPage() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (token) return <Navigate to="/admin" replace />;

  const entrar = async (event) => {
    event.preventDefault();
    setErro("");
    setEnviando(true);

    try {
      await login(email, senha);
      navigate("/admin", { replace: true });
    } catch (error) {
      setErro(error.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="login-screen">
      <section className="login-brand">
        <Link className="brand brand-on-dark" to="/" aria-label="JR Refrigerações, início">
          <BrandLogo />
          <span className="brand-copy">
            <strong>JR Refrigerações</strong>
            <small>Conforto em cada ambiente</small>
          </span>
        </Link>

        <div className="login-brand-copy">
          <span className="login-kicker">Painel de atendimentos</span>
          <h1>Seus atendimentos. <em>Tudo no mesmo cuidado.</em></h1>
          <p>Acompanhe pedidos, propostas e o histórico de cada cliente sem perder o fio da conversa.</p>
          <div className="login-highlight">
            <span className="login-highlight-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5 7.5h14M5 12h14M5 16.5h9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </span>
            <span>
              <strong>Um só fluxo</strong>
              <small>Do primeiro contato à conclusão</small>
            </span>
          </div>
          <ul className="login-points">
            {pontos.map((ponto) => <li key={ponto}>{ponto}</li>)}
          </ul>
        </div>

        <p className="login-brand-note">Acesso exclusivo de quem administra os atendimentos.</p>
      </section>

      <section className="login-panel">
        <Link className="login-back" to="/">← Voltar ao site</Link>
        <div className="login-form-wrap">
          <span className="login-kicker">Acesso restrito</span>
          <h2>Entrar no painel</h2>
          <p>Continue de onde parou e organize os atendimentos do dia.</p>
          <FeedbackMessage>{erro}</FeedbackMessage>
          <form className="stacked-form" onSubmit={entrar}>
            <FormField
              id="email"
              label="E-mail"
              type="email"
              autoComplete="username"
              placeholder="voce@jrrefrigeracoes.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <div className="form-field">
              <label htmlFor="senha">Senha</label>
              <div className="login-password">
                <input
                  id="senha"
                  type={senhaVisivel ? "text" : "password"}
                  autoComplete="current-password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  required
                />
                <button
                  type="button"
                  aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={senhaVisivel}
                  onClick={() => setSenhaVisivel((atual) => !atual)}
                >
                  {senhaVisivel ? <OlhoFechado /> : <OlhoAberto />}
                </button>
              </div>
            </div>
            <button className="button button-primary form-submit" disabled={enviando}>
              {enviando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function OlhoAberto() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function OlhoFechado() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.5 19 18.5M9.2 8.2A7 7 0 0 1 12 7.5c6 0 9.5 4.5 9.5 4.5a16 16 0 0 1-3.1 3.2M6.2 9.3A16 16 0 0 0 2.5 12S6 17.5 12 17.5a7 7 0 0 0 2.6-.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default LoginPage;
