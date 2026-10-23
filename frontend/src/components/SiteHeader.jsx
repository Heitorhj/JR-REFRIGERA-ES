import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import BrandLogo from "./BrandLogo.jsx";
import "../styles/site-header.css";

function SiteHeader() {
  const { token, usuario, logout } = useAuth();
  const location = useLocation();
  const onHome = location.pathname === "/";

  function goToSection(event, id) {
    if (!onHome) return;
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <header className={onHome ? "site-header site-header--overlay" : "site-header"}>
      <Link className="brand" to="/" aria-label="JR Refrigerações, início">
        <BrandLogo />
        <span className="brand-copy">
          <strong>JR Refrigerações</strong>
          <small>Conforto em cada ambiente</small>
        </span>
      </Link>
      <nav className="header-actions" aria-label="Navegação principal">
        <Link className="header-link" to="/#servicos" onClick={(event) => goToSection(event, "servicos")}>
          Serviços
        </Link>
        <Link className="header-link" to="/#como-funciona" onClick={(event) => goToSection(event, "como-funciona")}>
          Como funciona
        </Link>
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
              <span className="cta-full">Solicitar orçamento</span>
              <span className="cta-short">Orçamento</span>
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default SiteHeader;
