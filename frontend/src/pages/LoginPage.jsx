import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import FeedbackMessage from "../components/FeedbackMessage.jsx";
import FormField from "../components/FormField.jsx";

function LoginPage() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
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
    <main className="page-content">
      <section className="panel-card auth-card">
        <span className="eyebrow">Acesso restrito</span>
        <h1>Bem-vindo de volta</h1>
        <p>Entre para acompanhar e organizar os atendimentos.</p>
        <FeedbackMessage>{erro}</FeedbackMessage>
        <form className="stacked-form" onSubmit={entrar}>
          <FormField
            id="email"
            label="E-mail"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <FormField
            id="senha"
            label="Senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            required
          />
          <button className="button button-primary form-submit" disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar no painel"}
          </button>
        </form>
        <Link className="back-link" to="/">← Voltar para o início</Link>
      </section>
    </main>
  );
}

export default LoginPage;
