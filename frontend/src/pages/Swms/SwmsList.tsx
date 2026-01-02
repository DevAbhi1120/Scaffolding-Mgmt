import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import api from "../../api/axios";
import { BASE_URL, BASE_IMAGE_URL } from "../../components/BaseUrl/config";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { TrashBinIcon, PencilIcon, DownloadIcon } from "../../icons";

type SwmsEntity = {
  id: string;
  orderId?: string | null;
  swmsData?: any;
  highRiskTasks?: { name: string; highRisk?: boolean }[];
  attachments?: string[] | null;
  createdAt?: string;
};

export default function SwmsList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<SwmsEntity[]>([]);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "Pre" | "Post">("");
  const [orderFilter, setOrderFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const buildFileUrl = (key: string) => {
    if (!key) return "";
    if (key.startsWith("http://") || key.startsWith("https://")) return key;
    if (key.startsWith("/")) return `${window.location.origin}${key}`;
    if (BASE_IMAGE_URL)
      return `${BASE_IMAGE_URL.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
    return `${BASE_URL.replace(/\/$/, "")}/files/download/${encodeURIComponent(
      key
    )}`;
  };

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get("swms");
      const list: SwmsEntity[] = Array.isArray(res.data)
        ? res.data
        : res.data.items ?? res.data;
      setItems(list);
    } catch (err) {
      console.error("Failed to fetch SWMS", err);
      Swal.fire("Error", "Failed to load SWMS", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleDelete = async (id: string) => {
    const r = await Swal.fire({
      title: "Delete SWMS?",
      text: "This will permanently delete the record.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
    });
    if (!r.isConfirmed) return;
    try {
      await api.delete(`swms/${id}`);
      setItems((p) => p.filter((it) => it.id !== id));
      Swal.fire("Deleted", "SWMS removed", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete SWMS", "error");
    }
  };

  const filtered = items.filter((it) => {
    const type = it.swmsData?.type ?? "";
    const project = it.swmsData?.projectName ?? it.swmsData?.project_name ?? "";
    const date = it.swmsData?.dateOfCheck ?? it.createdAt ?? "";
    const hay = `${it.orderId ?? ""} ${project} ${type} ${date}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (typeFilter && type !== typeFilter) return false;
    if (orderFilter && it.orderId !== orderFilter) return false;
    if (dateFrom && new Date(date) < new Date(dateFrom)) return false;
    if (dateTo && new Date(date) > new Date(dateTo)) return false;
    return true;
  });

  return (
    <>
      <PageMeta title="SWMS" />
      <PageBreadcrumb pageTitle="SWMS" />
      <div className="space-y-6">
        <ComponentCard title="All SWMS">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by order, project or date..."
                className="px-3 py-2 border rounded w-full md:w-96"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="border rounded p-2"
              >
                <option value="">All types</option>
                <option value="Pre">Pre</option>
                <option value="Post">Post</option>
              </select>

              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border rounded p-2"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border rounded p-2"
              />

              <button
                onClick={() => fetch()}
                className="px-3 py-2 bg-gray-100 rounded"
              >
                Refresh
              </button>
              <button
                onClick={() => navigate("/add-Swms")}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                + Add SWMS
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100">
                  <TableRow>
                    <TableCell>Order</TableCell>
                    <TableCell>Project / Type</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Attachments</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100">
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
                        No SWMS found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((c) => {
                      const project =
                        c.swmsData?.projectName ??
                        c.swmsData?.project_name ??
                        "—";
                      const type = c.swmsData?.type ?? "—";
                      const date = c.swmsData?.dateOfCheck ?? c.createdAt ?? "";
                      const created = c.createdAt
                        ? new Date(c.createdAt).toLocaleString()
                        : "—";
                      return (
                        <TableRow key={c.id}>
                          <TableCell>{c.orderId ?? "—"}</TableCell>
                          <TableCell>
                            <div className="font-medium">{project}</div>
                            <div className="text-sm text-gray-500">{type}</div>
                          </TableCell>
                          <TableCell>
                            {date ? new Date(date).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              {c.attachments && c.attachments.length > 0 ? (
                                c.attachments.map((a, i) => (
                                  <a
                                    key={i}
                                    href={buildFileUrl(a)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm px-2 py-1 border rounded flex items-center gap-2 hover:bg-gray-50"
                                  >
                                    <DownloadIcon className="w-4 h-4" />
                                    <span className="truncate max-w-xs">
                                      {a.split("/").pop()}
                                    </span>
                                  </a>
                                ))
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{created}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/edit-Swms/${c.id}`)}
                                className="text-blue-600"
                                title="Edit"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="text-red-600"
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
