import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import "../styles/site-header.css";

function SiteHeader() {
  const { token, usuario, logout } = useAuth();

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="JR Refrigerações, início">
        <span className="brand-mark" aria-hidden="true">JR</span>
        <span className="brand-copy">
          <strong>JR Refrigerações</strong>
          <small>Conforto em cada ambiente</small>
        </span>
      </Link>
      <nav className="header-actions" aria-label="Navegação principal">
        {token ? (
          <>
            <NavLink className="user-greeting" to="/admin">
              Olá, {usuario?.nome?.split(" ")[0]}
            </NavLink>
            <button className="button button-quiet" onClick={logout}>Sair</button>
          </>
        ) : (
          <>
            <Link className="button button-quiet admin-link" to="/admin/login">
              Área administrativa
            </Link>
            <Link className="button button-primary button-small" to="/solicitar-orcamento">
              Solicitar orçamento
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default SiteHeader;
