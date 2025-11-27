// src/pages/orders/OrderList.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

import { TrashBinIcon, PencilIcon } from "../../icons";
import api from "../../api/axios"; // centralized axios instance with token
import { Eye } from "lucide-react";

interface OrderItem {
  id: string;
  builderId?: string;
  status?: string;
  startDate?: string | null;
  closeDate?: string | null;
  extendedUntil?: string | null;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function OrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("orders");
      // API returns { items: [], total, page, limit }
      const items: OrderItem[] = res.data.items ?? [];
      setOrders(items);
    } catch (error) {
      console.error("Failed to fetch orders", error);
      Swal.fire("Error", "Failed to fetch orders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleEdit = (id: string) => {
    navigate(`/edit-order/${id}`);
  };

  const handleView = (id: string) => {
    navigate(`/view-order/${id}`);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`orders/${id}`);
      Swal.fire("Deleted!", "Order has been deleted.", "success");
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
      Swal.fire("Error!", "Something went wrong.", "error");
    }
  };

  const filteredOrders = orders.filter((o) => {
    const haystack = [
      o.id,
      o.builderId,
      o.status,
      o.notes,
      o.startDate,
      o.createdAt,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Order List", 14, 10);

    autoTable(doc, {
      head: [["Start Date", "Builder ID", "Status", "Notes", "Created At"]],
      body: orders.map((o) => [
        o.startDate ? new Date(o.startDate).toLocaleDateString() : "-",
        o.builderId ?? "-",
        o.status ?? "-",
        o.notes ?? "-",
        o.createdAt ? new Date(o.createdAt).toLocaleString() : "-",
      ]),
    });

    doc.save("orders.pdf");
  };

  return (
    <>
      <PageMeta
        title="Order List | Scaffolding Management"
        description="All Orders"
      />
      <PageBreadcrumb pageTitle="Order List" />
      <div className="space-y-6">
        <ComponentCard title="All Orders">
          <div className="flex justify-end items-center mb-4 gap-3">
            <button
              onClick={downloadPDF}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Download PDF
            </button>
            <input
              type="text"
              placeholder="Search Order..."
              className="w-72 px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Start Date
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Builder ID
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Notes
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-5 py-4 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-5 py-4 text-center">
                        No orders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                          {order.startDate
                            ? new Date(order.startDate).toLocaleDateString()
                            : "-"}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                          {order.builderId ?? "-"}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                          {order.notes ?? "-"}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                          {order.status ?? "-"}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleView(order.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="View"
                            >
                              <Eye className="w-5 h-5" />
                            </button>

                            <button
                              onClick={() => handleEdit(order.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>

                            <button
                              onClick={() => handleDelete(order.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <TrashBinIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
