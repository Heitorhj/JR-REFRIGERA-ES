import { useCallback, useEffect, useState } from "react";
import { getOrder, listOrders } from "../api/adminOrders.js";

function useAdminOrders(token) {
  const [status, setStatus] = useState("");
  const [trash, setTrash] = useState(false);
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    setError("");

    try {
      const result = await listOrders(token, {
        status,
        page,
        limit: 10,
        trash
      });

      setOrders(result.pedidos);
      setPagination(result.paginacao);

      if (
        selectedId !== null &&
        !result.pedidos.some((order) => order.id === selectedId)
      ) {
        setSelectedId(null);
        setSelectedOrder(null);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingOrders(false);
    }
  }, [token, status, page, trash, selectedId]);

  useEffect(() => {
    const requestId = window.setTimeout(loadOrders, 0);

    return () => {
      window.clearTimeout(requestId);
    };
  }, [loadOrders]);

  const openOrder = useCallback(async (id) => {
    setSelectedId(id);
    setLoadingDetail(true);
    setError("");

    try {
      setSelectedOrder(await getOrder(token, id));
    } catch (requestError) {
      setError(requestError.message);
      setSelectedOrder(null);
    } finally {
      setLoadingDetail(false);
    }
  }, [token]);

  const refreshSelectedOrder = useCallback(async () => {
    if (selectedId === null) return;
    await openOrder(selectedId);
  }, [selectedId, openOrder]);

  const closeOrder = () => {
    setSelectedId(null);
    setSelectedOrder(null);
  };

  const refresh = useCallback(async () => {
    await loadOrders();
    await refreshSelectedOrder();
  }, [loadOrders, refreshSelectedOrder]);

  const changeStatus = (value) => {
    setStatus(value);
    setPage(1);
  };

  const changeTrash = (value) => {
    setTrash(value);
    setStatus("");
    setPage(1);
    setSelectedId(null);
    setSelectedOrder(null);
  };

  return {
    status,
    trash,
    page,
    orders,
    pagination,
    selectedOrder,
    selectedId,
    loadingOrders,
    loadingDetail,
    error,
    setError,
    setPage,
    changeStatus,
    changeTrash,
    openOrder,
    closeOrder,
    refresh
  };
}

export default useAdminOrders;
