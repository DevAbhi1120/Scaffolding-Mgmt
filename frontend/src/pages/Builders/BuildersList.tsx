import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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

import { TrashBinIcon, PencilIcon, PlusIcon, DownloadIcon } from "../../icons";
import { BASE_URL } from "../../components/BaseUrl/config";

type Builder = {
  id: string;
  businessName: string;
  businessAddress?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  config?: { leadDays?: number } | null;
  createdAt?: string;
  updatedAt?: string;
};

export default function BuildersList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Builder[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  // UI controls
  const [sortBy, setSortBy] = useState<"name" | "created">("created");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}builders`);
      // support both { items } and raw array
      const list: Builder[] = res.data?.items ?? res.data ?? [];
      setItems(list);
    } catch (err) {
      console.error("Failed to load builders", err);
      Swal.fire("Error", "Failed to load builders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleEdit = (id: string) => navigate(`/edit-builder/${id}`);

  const handleDelete = async (id: string) => {
    const r = await Swal.fire({
      title: "Delete builder?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    });
    if (!r.isConfirmed) return;

    try {
      const token = localStorage.getItem("token") ?? "";
      await axios.delete(`${BASE_URL}builders/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setItems((s) => s.filter((b) => b.id !== id));
      Swal.fire("Deleted", "Builder removed", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete builder", "error");
    }
  };

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let list = items.filter((b) =>
      qq
        ? `${b.businessName} ${b.contactEmail ?? ""} ${b.contactPhone ?? ""} ${
            b.businessAddress ?? ""
          }`
            .toLowerCase()
            .includes(qq)
        : true
    );

    list = list.sort((a, b) => {
      if (sortBy === "name") {
        const c = a.businessName.localeCompare(b.businessName);
        return sortDir === "asc" ? c : -c;
      } else {
        // created
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return sortDir === "asc" ? ta - tb : tb - ta;
      }
    });

    return list;
  }, [items, q, sortBy, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // CSV export
  const exportCSV = () => {
    if (!items.length) {
      Swal.fire("No data", "Nothing to export", "info");
      return;
    }
    const rows = [
      [
        "ID",
        "Business Name",
        "Address",
        "Email",
        "Phone",
        "Lead Days",
        "Created At",
      ],
      ...items.map((b) => [
        b.id,
        b.businessName,
        b.businessAddress ?? "",
        b.contactEmail ?? "",
        b.contactPhone ?? "",
        b.config?.leadDays ?? "",
        b.createdAt ?? "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `builders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageMeta title="Builders" />
      <PageBreadcrumb pageTitle="Builders" subName="Management" />

      <ComponentCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <input
                type="text"
                placeholder="Search builders by name / email / phone..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                className="w-full md:w-96 rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border rounded"
              >
                <option value="created">Sort: Newest</option>
                <option value="name">Sort: Name</option>
              </select>

              <button
                onClick={() =>
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                }
                className="px-3 py-2 border rounded"
                title="Toggle direction"
              >
                {sortDir === "asc" ? "Asc" : "Desc"}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="hidden md:inline-flex items-center gap-2 px-3 py-2 border rounded bg-white hover:bg-gray-50"
              title="Export CSV"
            >
              <DownloadIcon className="w-4 h-4" /> Export
            </button>

            <button
              onClick={() => navigate("/add-builder")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded shadow"
            >
              <PlusIcon className="w-4 h-4" /> Add Builder
            </button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell className="px-5 py-3 text-left font-medium text-sm text-gray-600">
                      Name
                    </TableCell>
                    <TableCell className="px-5 py-3 text-left font-medium text-sm text-gray-600">
                      Contact
                    </TableCell>
                    <TableCell className="px-5 py-3 text-left font-medium text-sm text-gray-600">
                      Address
                    </TableCell>
                    <TableCell className="px-5 py-3 text-center font-medium text-sm text-gray-600">
                      Lead Days
                    </TableCell>
                    <TableCell className="px-5 py-3 text-center font-medium text-sm text-gray-600">
                      Created
                    </TableCell>
                    <TableCell className="px-5 py-3 text-center font-medium text-sm text-gray-600">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6} className="p-6">
                          <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4 mb-2" />
                          <div className="animate-pulse h-3 bg-gray-200 rounded w-1/2" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : pageItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-gray-500"
                      >
                        No builders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageItems.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="px-5 py-4">
                          <div className="font-medium text-sm">
                            {b.businessName}
                          </div>
                          <div className="text-xs text-gray-500">{b.id}</div>
                        </TableCell>

                        <TableCell className="px-5 py-4">
                          <div className="text-sm">{b.contactEmail ?? "—"}</div>
                          <div className="text-xs text-gray-500">
                            {b.contactPhone ?? "—"}
                          </div>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-sm text-gray-700 max-w-xs line-clamp-2">
                          {b.businessAddress ?? "—"}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          {b.config?.leadDays ?? "—"}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center text-sm text-gray-500">
                          {b.createdAt
                            ? new Date(b.createdAt).toLocaleDateString()
                            : "—"}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(b.id)}
                              className="px-2 py-1 rounded bg-blue-50 text-blue-700"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(b.id)}
                              className="px-2 py-1 rounded bg-red-50 text-red-700"
                              title="Delete"
                            >
                              <TrashBinIcon className="w-4 h-4" />
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

          {/* pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {pageItems.length} of {filtered.length} builders
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 border rounded"
              >
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
              </select>
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <div className="px-3 py-1 border rounded">
                {page} / {Math.max(1, Math.ceil(filtered.length / pageSize))}
              </div>
              <button
                className="px-3 py-1 border rounded"
                onClick={() =>
                  setPage((p) =>
                    Math.min(Math.ceil(filtered.length / pageSize), p + 1)
                  )
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Mobile: stacked cards */}
        <div className="md:hidden grid gap-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 border rounded animate-pulse h-20" />
            ))
          ) : pageItems.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No builders found
            </div>
          ) : (
            pageItems.map((b) => (
              <div
                key={b.id}
                className="p-4 border rounded flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <div className="font-medium">{b.businessName}</div>
                  <div className="text-xs text-gray-500">
                    {b.contactEmail ?? "—"} • {b.contactPhone ?? "—"}
                  </div>
                  <div className="text-xs text-gray-400 mt-2 line-clamp-2">
                    {b.businessAddress ?? "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(b.id)}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="px-3 py-1 bg-red-50 text-red-700 rounded"
                  >
                    <TrashBinIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </ComponentCard>
    </>
  );
}
