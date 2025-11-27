// src/pages/SafetyChecklist/SafetyChecklistList.tsx
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

import { TrashBinIcon, PencilIcon, DownloadIcon } from "../../icons";
import { BASE_URL, BASE_IMAGE_URL } from "../../components/BaseUrl/config";

type ChecklistEntity = {
  id: string;
  orderId?: string | null;
  checklistData?: any;
  dateOfCheck?: string;
  attachments?: string[] | null;
  preserved?: boolean;
  createdAt?: string;
};

export default function SafetyChecklistList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ChecklistEntity[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}checklists`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      // backend returns array or object — handle both shapes
      const list: ChecklistEntity[] = Array.isArray(res.data)
        ? res.data
        : res.data.items ?? res.data;
      setItems(list);
    } catch (err) {
      console.error("Failed to load checklists", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleEdit = (id: string) => navigate(`/edit-safety-checklist/${id}`);

  const handleDelete = async (id: string) => {
    const r = await Swal.fire({
      title: "Delete checklist?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
    });
    if (!r.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}checklists/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      Swal.fire("Deleted", "Checklist removed", "success");
      setItems((s) => s.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete checklist", "error");
    }
  };

  // Smart function to build a usable URL for an attachment key
  const buildFileUrl = (key: string) => {
    if (!key) return "";
    // If key is an absolute URL already
    if (key.startsWith("http://") || key.startsWith("https://")) return key;
    // Local uploads usually store "/uploads/..." paths — make absolute
    if (key.startsWith("/")) return `${window.location.origin}${key}`;
    // s3-like or other keys: route through our files download endpoint
    return `${BASE_URL}files/download/${encodeURIComponent(key)}`;
  };

  // Search filter
  const filtered = items.filter((c) => {
    const type = c.checklistData?.type ?? "";
    const orderId = c.orderId ?? "";
    const date = c.dateOfCheck ?? c.createdAt ?? "";
    return `${type} ${orderId} ${date}`.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <>
      <PageMeta title="Safety Checklists" />
      <PageBreadcrumb pageTitle="Safety Checklists" />
      <div className="space-y-6">
        <ComponentCard title="All Safety Checklists">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search by order, type or date..."
                className="px-3 py-2 border rounded w-full md:w-96 focus:ring focus:ring-blue-300"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/add-safety-checklists")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Add Checklist
              </button>
              <button
                onClick={() => fetch()}
                className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Order
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Type
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Date
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Attachments
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Created
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-6 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="p-6 text-center text-gray-500"
                      >
                        No checklists found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((c) => {
                      const type = c.checklistData?.type ?? "—";
                      const items = Array.isArray(c.checklistData?.items)
                        ? c.checklistData.items.join(", ")
                        : c.checklistData?.items ?? "—";
                      const date = c.dateOfCheck
                        ? new Date(c.dateOfCheck).toLocaleDateString()
                        : "—";
                      const created = c.createdAt
                        ? new Date(c.createdAt).toLocaleString()
                        : "—";
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="px-5 py-4 text-start">
                            {c.orderId ?? "—"}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start">
                            {type}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start">
                            {date}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start">
                            <div className="flex flex-wrap gap-2">
                              {c.attachments && c.attachments.length > 0 ? (
                                c.attachments.map((a, i) => (
                                  <>
                                    <img
                                      src={BASE_IMAGE_URL + a}
                                      alt={a}
                                      className="object-cover w-16 h-16 rounded"
                                    />
                                    {/* <a
                                      key={i}
                                      href={buildFileUrl(BASE_IMAGE_URL + a)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sm px-2 py-1 border rounded flex items-center gap-2 hover:bg-gray-50"
                                      title={a.split("/").pop()}
                                    >
                                      <DownloadIcon className="w-4 h-4" />
                                    </a> */}
                                  </>
                                ))
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start">
                            {created}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(c.id)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <TrashBinIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
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
