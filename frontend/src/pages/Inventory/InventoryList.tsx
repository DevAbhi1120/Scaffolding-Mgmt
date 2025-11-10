import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

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

interface Inventory {
  id: number;
  product_id: number;
  product_name: string;   // ✅ new
  opening_stock: number;
  stock_in: number;
  stock_out: number;
  // assigned: number;
  missing: number;
  damaged: number;
  balance: number;
  thumbnail_url?: string; // ✅ optional image
}

export default function InventoryList() {
  const navigate = useNavigate();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchInventories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/inventories/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        setInventories(res.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch inventories", error);
    }
  };

  useEffect(() => {
    fetchInventories();
  }, []);

  const handleEdit = (id: number) => {
    navigate(`/edit-inventory/${id}`);
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
        await axios.delete(`http://localhost:5000/api/inventories/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        Swal.fire("Deleted!", "Inventory has been deleted.", "success");
        setInventories(inventories.filter((inv) => inv.id !== id));
      } catch (error) {
        console.error("Delete error:", error);
        Swal.fire("Error!", "Something went wrong.", "error");
      }
    }
  };

  // search filter
  const filteredInventories = inventories.filter((inv) =>
    `${inv.product_name} ${inv.balance}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <PageMeta
        title="Inventory List | Scaffolding Management"
        description="All inventories"
      />
      <PageBreadcrumb pageTitle="Inventory List" />
      <div className="space-y-6">
        <ComponentCard title="All Inventories">
          <div className="flex justify-end items-center mb-4 gap-3">
            <input
              type="text"
              placeholder="Search inventory..."
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
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Product
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Opening Stock
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Stock In
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Stock Out
                    </TableCell>
                    {/* <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Assigned
                    </TableCell> */}
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Missing
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Damaged
                    </TableCell>
                    {/* <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Balance
                    </TableCell> */}
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {filteredInventories.map((inv) => (
                    <TableRow key={inv.id}>
                      {/* 👇 product_name instead of product_id */}
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90 flex items-center gap-2">
                        {inv.thumbnail_url && (
                          <img
                            src={inv.thumbnail_url}
                            alt={inv.product_name}
                            className="w-8 h-8 rounded-md object-cover"
                          />
                        )}
                        {inv.product_name}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">{inv.opening_stock}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">{inv.stock_in}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">{inv.stock_out}</TableCell>
                      {/* <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">{inv.assigned}</TableCell> */}
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">{inv.missing}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">{inv.damaged}</TableCell>
                      {/* <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90 font-bold">
                        {inv.balance}
                      </TableCell> */}

                      {/* Actions */}
                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEdit(inv.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
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
