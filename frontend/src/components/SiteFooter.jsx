import { Link } from "react-router-dom";
import "../styles/site-footer.css";

function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link className="brand brand-footer" to="/">
        <span className="brand-mark" aria-hidden="true">JR</span>
        <span className="brand-copy">
          <strong>JR Refrigerações</strong>
          <small>Conforto em cada ambiente</small>
        </span>
      </Link>
      <span className="footer-tagline">Atendimento com cuidado, do início ao fim.</span>
      <Link className="footer-admin" to="/admin/login">Acesso administrativo</Link>
    </footer>
  );
}

export default SiteFooter;
