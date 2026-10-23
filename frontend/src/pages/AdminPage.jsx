import { useAuth } from "../context/useAuth.js";
import FeedbackMessage from "../components/FeedbackMessage.jsx";
import OrdersWorkspace from "../components/admin/OrdersWorkspace.jsx";
import useAdminOrders from "../hooks/useAdminOrders.js";
import "../styles/admin-page.css";

function AdminPage() {
  const { token, usuario } = useAuth();
  const orders = useAdminOrders(token);

  const totalPages = orders.pagination?.totalPaginas ?? 1;

  return (
    <main className="admin-page">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Painel administrativo</span>
          <h1>Olá, {usuario?.nome?.split(" ")[0] ?? "Júnior"}</h1>
          <p>Acompanhe solicitações e organize seus atendimentos.</p>
        </div>
        <button className="button button-secondary refresh-button" onClick={orders.refresh}>
          <span aria-hidden="true">↻</span> Atualizar
        </button>
      </div>

      <FeedbackMessage>{orders.error}</FeedbackMessage>

      <OrdersWorkspace
        token={token}
        orders={orders.orders}
        status={orders.status}
        trash={orders.trash}
        selectedOrder={orders.selectedOrder}
        selectedId={orders.selectedId}
        pagination={orders.pagination}
        loadingOrders={orders.loadingOrders}
        loadingDetail={orders.loadingDetail}
        onStatusChange={orders.changeStatus}
        onTrashChange={orders.changeTrash}
        onSelect={orders.openOrder}
        onCloseDetails={orders.closeOrder}
        onUpdated={orders.refresh}
        onPreviousPage={() => orders.setPage(Math.max(1, orders.page - 1))}
        onNextPage={() => orders.setPage(Math.min(totalPages, orders.page + 1))}
      />
    </main>
  );
}

export default AdminPage;
