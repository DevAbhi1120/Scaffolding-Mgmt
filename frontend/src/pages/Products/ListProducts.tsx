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

interface Product {
  id: number;
  category_id: number;
  category_name?: string; // backend se join karke bhejna best hoga
  name: string;
  unit: string;
  stock_quantity: number;
  thumbnail_image?: string;
  status: number;
}

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Products from API:", res.data.products);
      if (res.data.success) {
        setProducts(res.data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (id: number) => {
    navigate(`/edit-product/${id}`);
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
      console.log("Deleting product with ID:", result);
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:5000/api/products/${id}/permanentDelete`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        Swal.fire("Deleted!", "Product has been deleted.", "success");
        setProducts(products.filter((p) => p.id !== id));
      } catch (error) {
        console.error("Delete error:", error);
        Swal.fire("Error!", "Something went wrong.", "error");
      }
    }
  };

  const filteredProducts = products.filter((p) =>
    `${p.name} ${p.category_name || ""} ${p.unit}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <>
    
      <PageMeta
        title="Product List | Scaffolding Management"
        description="All products"
      />
      <PageBreadcrumb pageTitle="Product List" />
      <div className="space-y-6">
        <ComponentCard title="All Products">
          <div className="flex justify-end items-center mb-4 gap-3">
            <input
              type="text"
              placeholder="Search products..."
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
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Image</TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Name</TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Category</TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Unit</TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Stock Qty</TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Status</TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {filteredProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                        <div className="w-12 h-12 rounded overflow-hidden bg-gray-100">
                          <img
                            src={p.thumbnail_image || "/images/no-image.png"}
                            alt={p.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                        {p.name}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                        {p.category_name || p.category_id}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                        {p.unit}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                        {p.stock_quantity}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                        {p.status === 1 ? (
                          <span className="text-green-600 font-semibold">Active</span>
                        ) : (
                          <span className="text-red-600 font-semibold">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEdit(p.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
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
