import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";

export default function ViewOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const order = res.data;
        setFormData(order);
        setOrderItems(order.items || []);
      } catch (err) {
        console.error("Error fetching order", err);
        Swal.fire("Error", "Failed to fetch order details", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, token]);

  if (loading) {
    return <p className="text-center">Loading order details...</p>;
  }

  if (!formData) {
    return <p className="text-center text-red-600">Order not found</p>;
  }

  return (
    <>
      <PageMeta title="View Order" />
      <PageBreadcrumb title="View Order" subName="Orders" />

      <ComponentCard>
        <div className="space-y-6">
          {/* User Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>User Name</Label>
              <p className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
                {formData.user_name}
              </p>
            </div>

            <div>
              <Label>User Email</Label>
              <p className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
                {formData.user_email}
              </p>
            </div>

            <div>
              <Label>Phone</Label>
              <p className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
                {formData.user_phonenumber}
              </p>
            </div>

            <div>
              <Label>Address</Label>
              <p className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
                {formData.user_address}
              </p>
            </div>
          </div>

          {/* Order Info */}
          <div>
            <Label>Order Date</Label>
            <p className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
              {new Date(formData.order_date).toLocaleDateString()}
            </p>
          </div>

          <div>
            <Label>Notes</Label>
            <p className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
              {formData.notes || "-"}
            </p>
          </div>

          <div>
            <Label>Status</Label>
            <p className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
              {formData.status}
            </p>
          </div>

          {/* Products */}
          <div>
            <Label>Products</Label>
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              {orderItems.length === 0 ? (
                <p>No products in this order.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                      <th className="border p-2 text-left">Product</th>
                      <th className="border p-2 text-left">Quantity</th>
                      <th className="border p-2 text-left">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item, index) => (
                      <tr key={index}>
                        <td className="border p-2">{item.product_name || item.product_id}</td>
                        <td className="border p-2">{item.order_qty}</td>
                        <td className="border p-2">{item.price || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Back Button */}
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
