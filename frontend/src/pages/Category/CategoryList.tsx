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
import { BASE_URL, BASE_IMAGE_URL } from "../../components/BaseUrl/config";

import { TrashBinIcon, PencilIcon } from "../../icons";

interface Category {
  id: string; // UUID from backend
  name: string;
  description?: string;
  thumbnailImage?: string | null; // matches entity field
}

export default function CategoryList() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${BASE_URL}categories`, {
        // if you need auth:
        // headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      // service returns: { items, total, page, limit }
      const items: Category[] = res.data.items || [];
      setCategories(items);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEdit = (id: string) => {
    navigate(`/edit-category/${id}`);
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
      const token = localStorage.getItem("token");

      await axios.delete(`${BASE_URL}categories/${id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      await Swal.fire("Deleted!", "Category has been deleted.", "success");

      // update list
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
      Swal.fire("Error!", "Something went wrong.", "error");
    }
  };

  const filteredCategories = categories.filter((c) =>
    `${c.name} ${c.description ?? ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getThumbnailSrc = (cat: Category) => {
    if (!cat.thumbnailImage) return "/images/no-image.png";
    // if backend already returns full URL, use that; otherwise prefix with BASE_IMAGE_URL
    if (cat.thumbnailImage.startsWith("http")) return cat.thumbnailImage;
    return `${BASE_IMAGE_URL}${cat.thumbnailImage}`;
  };

  return (
    <>
      <PageMeta
        title="Category List | Scaffolding Management"
        description="All categories"
      />
      <PageBreadcrumb pageTitle="Category List" />
      <div className="space-y-6">
        <ComponentCard title="All Categories">
          <div className="flex justify-end items-center mb-4 gap-3">
            <input
              type="text"
              placeholder="Search category..."
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
                      Thumbnail
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Name
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {filteredCategories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="w-20 h-20 rounded overflow-hidden bg-gray-100">
                          <img
                            src={getThumbnailSrc(cat)}
                            alt={cat.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                        <div className="flex flex-col">
                          <span>{cat.name}</span>
                          {cat.description && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {cat.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEdit(cat.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <TrashBinIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredCategories.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No categories found.
                      </TableCell>
                    </TableRow>
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
