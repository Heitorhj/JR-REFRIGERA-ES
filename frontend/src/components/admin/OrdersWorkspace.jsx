import OrderDetails from "./OrderDetails.jsx";
import OrderFilters from "./OrderFilters.jsx";
import OrderTable from "./OrderTable.jsx";
import "../../styles/orders-workspace.css";

function OrdersWorkspace({
  orders,
  status,
  trash,
  selectedOrder,
  selectedId,
  pagination,
  loadingOrders,
  loadingDetail,
  token,
  onUpdated,
  onStatusChange,
  onTrashChange,
  onSelect,
  onCloseDetails,
  onPreviousPage,
  onNextPage
}) {
  return (
    <div className={`orders-workspace${selectedOrder || loadingDetail ? " has-details" : ""}`}>
      <section className="orders-column">
        <OrderFilters
          status={status}
          trash={trash}
          onStatusChange={onStatusChange}
          onTrashChange={onTrashChange}
        />
        <OrderTable
          orders={orders}
          selectedId={selectedId}
          onSelect={onSelect}
          loading={loadingOrders}
          trash={trash}
        />
        {pagination && pagination.totalPaginas > 1 && (
          <nav className="orders-pagination" aria-label="Paginação de pedidos">
            <span>
              Página {pagination.paginaAtual} de {pagination.totalPaginas}
              <small>{pagination.total} pedidos</small>
            </span>
            <div>
              <button type="button" onClick={onPreviousPage} disabled={pagination.paginaAtual <= 1}>
                Anterior
              </button>
              <button type="button" onClick={onNextPage} disabled={pagination.paginaAtual >= pagination.totalPaginas}>
                Próxima
              </button>
            </div>
          </nav>
        )}
      </section>
      {(selectedOrder || loadingDetail) && (
        <OrderDetails
          order={selectedOrder}
          loading={loadingDetail}
          onClose={onCloseDetails}
          token={token}
          onUpdated={onUpdated}
        />
      )}
    </div>
  );
}

export default OrdersWorkspace;
