import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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

interface Order {
  id: number;
  order_date: string;
  user_name?: string;
  notes?: string;
  user_email: number;
  user_phonenumber: number;
  user_address: number;
  status: string;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  thumbnail_url?: string; // optional if you store job-site photo
}

export default function OrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/orders/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleEdit = (id: number) => {
    navigate(`/edit-order/${id}`);
  };

  const handleView = (id: number) => {
    navigate(`/view-order/${id}`);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:5000/api/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        Swal.fire("Deleted!", "Order has been deleted.", "success");
        setOrders(orders.filter((order) => order.id !== id));
      } catch (error) {
        console.error("Delete error:", error);
        Swal.fire("Error!", "Something went wrong.", "error");
      }
    }
  };

  const filteredOrders = orders.filter((order) =>
    `${order.order_date} ${order.user_name} ${order.notes} ${order.user_email} ${order.user_phonenumber} ${order.user_address} ${order.status} ${order.is_deleted}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.text("Order List", 14, 10);

    autoTable(doc, {
      head: [["Order Date", "User Name", "Email", "Phone", "Notes", "Status"]],
      body: orders.map((o) => [
        new Date(o.order_date).toLocaleDateString("en-GB").replace(/\//g, "-"),
        o.user_name || "-",
        o.user_email,
        o.user_phonenumber,
        o.notes,
        o.status,
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
              className="w-72 px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 
               placeholder-gray-400 dark:placeholder-gray-500
               text-gray-900 dark:text-gray-100
               bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Order Date</TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">User Name</TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">User Email</TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">User Phone Number</TableCell>
                    {/* <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">User Address</TableCell> */}
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Notes</TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Status</TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                        {new Date(order.order_date).toLocaleDateString('en-GB').replace(/\//g, '-')}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">{order.user_name || "-"}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">{order.user_email}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">{order.user_phonenumber}</TableCell>
                      {/* <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">{order.user_address}</TableCell> */}
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">{order.notes || "-"}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">{order.status}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                        <div className="flex items-center gap-3">
                          {/* <button
                            onClick={() => handleView(order.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button> */}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
