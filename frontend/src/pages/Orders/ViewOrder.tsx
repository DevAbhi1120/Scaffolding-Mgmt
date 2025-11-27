// src/pages/orders/ViewOrder.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import api from "../../api/axios";

export default function ViewOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await api.get(`orders/${id}`);
        // depending on backend, res.data might be { items: [...] } or a single order object
        // try to normalize:
        const data = res.data;
        // If it's a list wrapper:
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          // try to find item with same id
          const found =
            data.items.find((it: any) => it.id === id) ?? data.items[0];
          setOrder(found);
        } else {
          // assume single order object
          setOrder(data);
        }
      } catch (err) {
        console.error("Error fetching order", err);
        Swal.fire("Error", "Failed to fetch order details", "error");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id]);

  if (loading) return <p className="text-center">Loading order details...</p>;
  if (!order)
    return <p className="text-center text-red-600">Order not found</p>;

  const items = order.items ?? []; // if your single-order response includes items

  return (
    <>
      <PageMeta title="View Order" />
      <PageBreadcrumb pageTitle="View Order" subName="Orders" />

      <ComponentCard>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Order ID</Label>
              <p className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
                {order.id}
              </p>
            </div>

            <div>
              <Label>Builder ID</Label>
              <p className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
                {order.builderId}
              </p>
            </div>

            <div>
              <Label>Start Date</Label>
              <p className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
                {order.startDate
                  ? new Date(order.startDate).toLocaleDateString()
                  : "-"}
              </p>
            </div>

            <div>
              <Label>Status</Label>
              <p className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
                {order.status}
              </p>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <p className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
              {order.notes || "-"}
            </p>
          </div>

          <div>
            <Label>Created At</Label>
            <p className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
              {order.createdAt
                ? new Date(order.createdAt).toLocaleString()
                : "-"}
            </p>
          </div>

          <div>
            <Label>Items</Label>
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              {items.length === 0 ? (
                <p>No items in this order.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                      <th className="border p-2 text-left">ID</th>
                      <th className="border p-2 text-left">Builder ID</th>
                      <th className="border p-2 text-left">Status</th>
                      <th className="border p-2 text-left">Start Date</th>
                      <th className="border p-2 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it: any) => (
                      <tr key={it.id}>
                        <td className="border p-2">{it.id}</td>
                        <td className="border p-2">{it.builderId}</td>
                        <td className="border p-2">{it.status}</td>
                        <td className="border p-2">
                          {it.startDate
                            ? new Date(it.startDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="border p-2">{it.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => navigate("/order-list")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </ComponentCard>
    </>
  );
}
