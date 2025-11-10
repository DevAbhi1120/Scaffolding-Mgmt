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

interface SafetyChecklist {
  id: number;
  order_id: number;
  type: "Pre" | "Post";
  check_date: string;
  photo_url?: string;
  items?: string; 
  created_at: string;
  updated_at: string;
}

export default function SafetyChecklistList() {
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState<SafetyChecklist[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchChecklists = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/safety-checklists/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        setChecklists(res.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch safety checklists", error);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  const handleEdit = (id: number) => {
    navigate(`/edit-safety-checklists/${id}`);
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
        await axios.delete(`http://localhost:5000/api/safety-checklists/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        Swal.fire("Deleted!", "Checklist has been deleted.", "success");
        setChecklists(checklists.filter((c) => c.id !== id));
      } catch (error) {
        console.error("Delete error:", error);
        Swal.fire("Error!", "Something went wrong.", "error");
      }
    }
  };

  const filteredChecklists = checklists.filter((c) =>
    `${c.type} ${c.order_id} ${c.check_date}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <PageMeta
        title="Safety Checklist List | Scaffolding Management"
        description="All safety checklists"
      />
      <PageBreadcrumb pageTitle="Safety Checklists" />
      <div className="space-y-6">
        <ComponentCard title="All Safety Checklists">
          <div className="flex justify-end items-center mb-4 gap-3">
            <input
              type="text"
              placeholder="Search checklist..."
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
                      Order ID
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Type
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Date
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Photo
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Items
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChecklists.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">{c.order_id}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">{c.type}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">{c.check_date ? c.check_date.split("T")[0].split("-").reverse().join("-") : "—"}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                        <div className="w-12 h-12 rounded overflow-hidden bg-gray-100">
                          <img
                            src={c.photo_url ? `${c.photo_url}` : "/images/no-image.png"}
                            alt="Photo"
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                        {(() => {
                          try {
                            if (!c.items) return "—";
                            const parsed = typeof c.items === "string" ? JSON.parse(c.items) : c.items;
                            return Array.isArray(parsed) ? parsed.join(", ") : String(parsed);
                          } catch (err) {
                            console.error("Invalid items JSON:", c.items, err);
                            return String(c.items);
                          }
                        })()}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEdit(c.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-red-600 hover:text-red-800"
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
