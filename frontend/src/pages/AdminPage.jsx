import { useAuth } from "../context/AuthContext.jsx";

function AdminPage() {
  const { usuario } = useAuth();

  return (
    <main className="page-content">
      <section className="panel-card">
        <span className="eyebrow">Painel administrativo</span>
        <h1>Olá, {usuario?.nome?.split(" ")[0] ?? "Júnior"}</h1>
        <p>Seu painel de pedidos está sendo preparado.</p>
      </section>
    </main>
  );
}

export default AdminPage;
