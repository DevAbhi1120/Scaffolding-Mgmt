// src/pages/Inventory/InventoryList.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Eye, Plus } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

import { TrashBinIcon, PencilIcon, EyeIcon, PlusIcon } from "../../icons";
import { BASE_URL, BASE_IMAGE_URL } from "../../components/BaseUrl/config";

/* Types */
type Product = {
  id: string;
  name: string;
  images?: string[];
  updatedAt?: string;
};
type Summary = {
  productId: string;
  productName: string;
  thumbnail?: string | null;
  availablePhysical: number;
  stockBalance: number;
  damaged?: number;
  lost?: number;
  assigned?: number;
  missing?: number;
  lastUpdated?: string;
};
type Batch = {
  id: string;
  quantity: number;
  status: string;
  referenceType?: string;
  referenceId?: string | null;
  created_at?: string;
};
type Item = {
  id: string;
  serialNumber?: string | null;
  status?: string;
  createdAt?: string;
};

/* Component */
export default function InventoryList() {
  const navigate = useNavigate();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const [products, setProducts] = useState<Product[]>([]);
  const [summaries, setSummaries] = useState<Record<string, Summary>>({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingSummaries, setLoadingSummaries] = useState(false);

  // UI state: filters, pagination
  const [q, setQ] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [sortBy, setSortBy] = useState<"available" | "balance" | "name">(
    "available"
  );
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // modal: manage batches & serial items
  const [showModal, setShowModal] = useState(false);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [batchForm, setBatchForm] = useState<{
    quantity: number | "";
    referenceType: string;
    referenceId: string;
  }>({
    quantity: "",
    referenceType: "SYSTEM",
    referenceId: "",
  });
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);

  /* ---------- fetch products & summaries ---------- */
  useEffect(() => {
    (async () => {
      setLoadingProducts(true);
      try {
        const res = await axios.get(`${BASE_URL}products`, {
          headers: authHeaders,
        });
        const items = res.data?.items ?? res.data?.data ?? [];
        setProducts(items);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, []);

  // fetch summaries for visible products in small batches
  useEffect(() => {
    if (!products.length) return;
    setLoadingSummaries(true);

    const BATCH = 8;
    const acc: Record<string, Summary> = {};

    (async () => {
      try {
        for (let i = 0; i < products.length; i += BATCH) {
          const group = products.slice(i, i + BATCH);
          await Promise.all(
            group.map(async (p) => {
              try {
                const s = (
                  await axios.get(`${BASE_URL}inventories/summary/${p.id}`, {
                    headers: authHeaders,
                  })
                ).data;
                acc[p.id] = {
                  productId: p.id,
                  productName: p.name,
                  thumbnail: p.images?.[0] ?? null,
                  availablePhysical: s.availablePhysical ?? 0,
                  stockBalance: s.stockBalance ?? 0,
                  damaged: s.damaged ?? 0,
                  lost: s.lost ?? 0,
                  assigned: s.assigned ?? 0,
                  missing: s.missing ?? 0,
                  lastUpdated: p.updatedAt ?? s.updatedAt,
                };
              } catch {
                acc[p.id] = {
                  productId: p.id,
                  productName: p.name,
                  thumbnail: p.images?.[0] ?? null,
                  availablePhysical: 0,
                  stockBalance: 0,
                  damaged: 0,
                  lost: 0,
                  assigned: 0,
                  missing: 0,
                  lastUpdated: p.updatedAt,
                };
              }
            })
          );
        }
        setSummaries(acc);
      } finally {
        setLoadingSummaries(false);
      }
    })();
  }, [products]);

  /* derive rows */
  const rows = useMemo(
    () =>
      products.map(
        (p) =>
          summaries[p.id] ?? {
            productId: p.id,
            productName: p.name,
            thumbnail: p.images?.[0] ?? null,
            availablePhysical: 0,
            stockBalance: 0,
            damaged: 0,
            lost: 0,
            assigned: 0,
            missing: 0,
            lastUpdated: p.updatedAt,
          }
      ),
    [products, summaries]
  );

  /* filtering / sorting / pagination */
  const filtered = useMemo(() => {
    let list = rows.filter((r) => {
      if (q.trim()) {
        const qq = q.trim().toLowerCase();
        if (!`${r.productName} ${r.productId}`.toLowerCase().includes(qq))
          return false;
      }
      if (lowStockOnly && (r.availablePhysical ?? 0) > lowStockThreshold)
        return false;
      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "available")
        cmp = (a.availablePhysical ?? 0) - (b.availablePhysical ?? 0);
      if (sortBy === "balance")
        cmp = (a.stockBalance ?? 0) - (b.stockBalance ?? 0);
      if (sortBy === "name") cmp = a.productName.localeCompare(b.productName);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [rows, q, lowStockOnly, lowStockThreshold, sortBy, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  /* ---------- modal actions: open, load batches & items ---------- */
  const openModal = async (p: Product) => {
    setModalProduct(p);
    setShowModal(true);
    await loadModalData(p.id);
  };

  const loadModalData = async (productId: string) => {
    setModalLoading(true);
    try {
      const [bRes, iRes] = await Promise.all([
        axios.get(`${BASE_URL}inventories/batches?productId=${productId}`, {
          headers: authHeaders,
        }),
        axios.get(`${BASE_URL}inventories/items?productId=${productId}`, {
          headers: authHeaders,
        }),
      ]);
      setBatches(Array.isArray(bRes.data) ? bRes.data : bRes.data.items ?? []);
      setItems(Array.isArray(iRes.data) ? iRes.data : iRes.data.items ?? []);
    } catch (err) {
      console.error("Failed to load modal data", err);
      setBatches([]);
      setItems([]);
    } finally {
      setModalLoading(false);
    }
  };

  /* create / update batch */
  const saveBatch = async () => {
    if (!modalProduct) return;
    const qty = Number(batchForm.quantity || 0);
    if (!qty || qty <= 0) {
      Swal.fire("Validation", "Quantity must be > 0", "warning");
      return;
    }
    try {
      if (editingBatchId) {
        await axios.put(
          `${BASE_URL}inventories/batches/${editingBatchId}`,
          {
            quantity: qty,
            referenceType: batchForm.referenceType,
            referenceId: batchForm.referenceId || null,
          },
          { headers: authHeaders }
        );
        Swal.fire("Updated", "Batch updated", "success");
      } else {
        await axios.post(
          `${BASE_URL}inventories/batches`,
          {
            productId: modalProduct.id,
            quantity: qty,
            referenceType: batchForm.referenceType,
            referenceId: batchForm.referenceId || undefined,
          },
          { headers: authHeaders }
        );
        Swal.fire("Created", "Batch created", "success");
      }
      await loadModalData(modalProduct.id);
      // refresh summary for this product
      const sRes = await axios.get(
        `${BASE_URL}inventories/summary/${modalProduct.id}`,
        { headers: authHeaders }
      );
      setSummaries((prev) => ({
        ...prev,
        [modalProduct.id]: { ...prev[modalProduct.id], ...sRes.data },
      }));
      setBatchForm({ quantity: "", referenceType: "SYSTEM", referenceId: "" });
      setEditingBatchId(null);
    } catch (err: any) {
      console.error(err);
      Swal.fire(
        "Error",
        err?.response?.data?.message ?? "Failed to save batch",
        "error"
      );
    }
  };

  /* delete batch */
  const deleteBatch = async (b: Batch) => {
    if (!modalProduct) return;
    const ok = await Swal.fire({
      title: "Delete batch?",
      text: `Qty: ${b.quantity}`,
      icon: "warning",
      showCancelButton: true,
    });
    if (!ok.isConfirmed) return;
    try {
      await axios.delete(`${BASE_URL}inventories/batches/${b.id}`, {
        headers: authHeaders,
      });
      Swal.fire("Deleted", "Batch deleted", "success");
      await loadModalData(modalProduct.id);
      const sRes = await axios.get(
        `${BASE_URL}inventories/summary/${modalProduct.id}`,
        { headers: authHeaders }
      );
      setSummaries((prev) => ({
        ...prev,
        [modalProduct.id]: { ...prev[modalProduct.id], ...sRes.data },
      }));
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete batch", "error");
    }
  };

  /* delete serial item */
  const deleteItem = async (it: Item) => {
    if (!modalProduct) return;
    const ok = await Swal.fire({
      title: "Delete serial item?",
      text: `This deletes the physical serial row.`,
      icon: "warning",
      showCancelButton: true,
    });
    if (!ok.isConfirmed) return;
    try {
      await axios.delete(`${BASE_URL}inventories/items/${it.id}`, {
        headers: authHeaders,
      });
      Swal.fire("Deleted", "Serial item deleted", "success");
      await loadModalData(modalProduct.id);
      const sRes = await axios.get(
        `${BASE_URL}inventories/summary/${modalProduct.id}`,
        { headers: authHeaders }
      );
      setSummaries((prev) => ({
        ...prev,
        [modalProduct.id]: { ...prev[modalProduct.id], ...sRes.data },
      }));
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete item", "error");
    }
  };

  /* delete all inventory for product */
  const deleteAllForProduct = async (productId: string) => {
    const ok = await Swal.fire({
      title: "Delete ALL inventory for this product?",
      text: "This removes batches and serial items. This is destructive.",
      icon: "warning",
      showCancelButton: true,
    });
    if (!ok.isConfirmed) return;
    try {
      await axios.delete(`${BASE_URL}inventories/product/${productId}`, {
        headers: authHeaders,
      });
      Swal.fire("Deleted", "All inventory removed", "success");
      // remove product summary from UI
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setSummaries((prev) => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete product inventory", "error");
    }
  };

  /* small UI helpers */
  const toggleSort = (by: typeof sortBy) => {
    if (sortBy === by) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(by);
      setSortDir("desc");
    }
    setPage(1);
  };

  /* render responsive rows: cards on mobile, table on desktop */
  return (
    <>
      <PageMeta title="Inventory" />
      <PageBreadcrumb pageTitle="Inventory" />

      <ComponentCard title="Inventory Overview">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex gap-3 w-full md:w-auto">
            <input
              className="flex-1 md:flex-none px-3 py-2 border rounded-md"
              placeholder="Search product name or id..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
            <button
              className="px-3 py-2 border rounded-md bg-white"
              onClick={() => {
                setQ("");
                setPage(1);
              }}
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
              />
              Low stock only
            </label>
            <input
              className="w-16 px-2 py-1 border rounded-md"
              type="number"
              value={lowStockThreshold}
              onChange={(e) =>
                setLowStockThreshold(Math.max(0, Number(e.target.value || 0)))
              }
            />
            <div className="hidden md:flex items-center gap-2">
              <button
                title="Sort by available"
                onClick={() => toggleSort("available")}
                className="px-2 py-1 border rounded-md"
              >
                Available
              </button>
              <button
                title="Sort by balance"
                onClick={() => toggleSort("balance")}
                className="px-2 py-1 border rounded-md"
              >
                Balance
              </button>
              <button
                title="Sort by name"
                onClick={() => toggleSort("name")}
                className="px-2 py-1 border rounded-md"
              >
                Name
              </button>
            </div>
            <button
              className="px-4 py-[6px] bg-blue-600 text-white rounded-md flex items-center gap-2"
              onClick={() => navigate("/inventory/add")}
            >
              <Plus  className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="py-3 pl-4 w-auto">Product</TableCell>
                  <TableCell className="py-3 text-center">Available</TableCell>
                  <TableCell className="py-3 text-center">Balance</TableCell>
                  <TableCell className="py-3 text-center">Assigned</TableCell>
                  <TableCell className="py-3 text-center">Damaged</TableCell>
                  <TableCell className="py-3 text-center">Missing</TableCell>
                  <TableCell className="py-3 text-center">Updated</TableCell>
                  <TableCell className="py-3 text-center">Actions</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loadingProducts || loadingSummaries ? (

                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-4 bg-gray-200 rounded w-12 mx-auto animate-pulse" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-4 bg-gray-200 rounded w-12 mx-auto animate-pulse" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-4 bg-gray-200 rounded w-12 mx-auto animate-pulse" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-4 bg-gray-200 rounded w-12 mx-auto animate-pulse" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-4 bg-gray-200 rounded w-12 mx-auto animate-pulse" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-4 bg-gray-200 rounded w-24 mx-auto animate-pulse" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-4 bg-gray-200 rounded w-24 mx-auto animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : pageItems.length ? (
                  pageItems.map((r) => (
                    <TableRow key={r.productId}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3 mb-4">
                          {r.thumbnail ? (
                            <img
                              src={`${BASE_IMAGE_URL}${r.thumbnail}`}
                              alt={r.productName}
                              className="w-10 h-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-sm text-gray-400">
                              No
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{r.productName}</div>
                            {/* <div className="font-[500] text-[12px] text-[rgba(0,0,0,0.5)]">{r.productId}</div> */}
                            
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="font-semibold">
                          {r.availablePhysical}
                        </div>
                        {r.availablePhysical <= lowStockThreshold &&
                          r.availablePhysical > 0 && (
                            <div className="text-xs text-yellow-700">Low</div>
                          )}
                        {r.availablePhysical === 0 && (
                          <div className="text-xs text-red-700">Out</div>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        {r.stockBalance}
                      </TableCell>
                      <TableCell className="text-center">
                        {r.assigned ?? 0}
                      </TableCell>
                      <TableCell className="text-center text-red-600">
                        {r.damaged ?? 0}
                      </TableCell>
                      <TableCell className="text-center text-yellow-600">
                        {r.missing ?? 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {r.lastUpdated
                          ? new Date(r.lastUpdated).toLocaleDateString()
                          : "—"}
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            className="px-2 py-2 rounded bg-blue-50 text-blue-700"
                            title="Manage"
                            onClick={() =>
                              openModal(
                                products.find((p) => p.id === r.productId)!
                              )
                            }
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="px-2 py-2 rounded bg-gray-50 text-gray-700"
                            title="Edit product"
                            onClick={() => navigate(`/edit-product/${r.productId}`)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="px-2 py-1 rounded bg-red-50 text-red-700"
                            title="Delete inventory"
                            onClick={() => deleteAllForProduct(r.productId)}
                          >
                            <TrashBinIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      No products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {page} / {pageCount}
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Mobile: cards */}
        <div className="md:hidden grid gap-3">
          {loadingProducts || loadingSummaries ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-3 border rounded animate-pulse" />
            ))
          ) : pageItems.length ? (
            pageItems.map((r) => (
              <div
                key={r.productId}
                className="p-3 border rounded flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {r.thumbnail ? (
                    <img
                      src={`${BASE_IMAGE_URL}${r.thumbnail}`}
                      alt={r.productName}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-gray-100" />
                  )}
                  <div>
                    <div className="font-medium">{r.productName}</div>
                    <div className="text-xs text-gray-500">
                      {r.availablePhysical} available • {r.stockBalance} balance
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <div className="flex gap-2">
                    <button
                      className="px-2 py-1 rounded bg-blue-50 text-blue-700"
                      onClick={() =>
                        openModal(products.find((p) => p.id === r.productId)!)
                      }
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-red-50 text-red-700"
                      onClick={() => deleteAllForProduct(r.productId)}
                    >
                      <TrashBinIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {r.lastUpdated
                      ? new Date(r.lastUpdated).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">No products</div>
          )}
        </div>
      </ComponentCard>

      {/* Modal (batches + items) */}
      {showModal && modalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-auto max-h-[75vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <div className="font-semibold">{modalProduct.name}</div>
                <div className="text-xs text-gray-500">{modalProduct.id}</div>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  className="px-3 py-1 border rounded"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={() => navigate(`/edit-product/${modalProduct.id}`)}
                >
                  Edit product
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 p-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium">Batches ({batches.length})</div>
                </div>

                {modalLoading ? (
                  <div className="text-sm text-gray-500">Loading…</div>
                ) : batches.length === 0 ? (
                  <div className="text-sm text-gray-500">No batches</div>
                ) : (
                  <div className="space-y-3">
                    {batches.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between border rounded p-3"
                      >
                        <div>
                          <div className="font-medium">Qty: {b.quantity}</div>
                          <div className="text-xs text-gray-500">
                            Status: {b.status}
                          </div>
                          {b.referenceType && (
                            <div className="text-xs text-gray-400">
                              Ref: {b.referenceType} {b.referenceId ?? ""}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded"
                            onClick={() => {
                              setEditingBatchId(b.id);
                              setBatchForm({
                                quantity: b.quantity,
                                referenceType: b.referenceType ?? "SYSTEM",
                                referenceId: b.referenceId ?? "",
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="px-2 py-1 bg-red-50 text-red-700 rounded"
                            onClick={() => deleteBatch(b)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 border-t pt-3">
                  <div className="text-sm font-medium mb-2">
                    {editingBatchId ? "Edit batch" : "Create batch"}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={batchForm.quantity as any}
                      onChange={(e) =>
                        setBatchForm((s) => ({
                          ...s,
                          quantity:
                            e.target.value === ""
                              ? ""
                              : Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="px-3 py-2 border rounded"
                    />
                    <select
                      value={batchForm.referenceType}
                      onChange={(e) =>
                        setBatchForm((s) => ({
                          ...s,
                          referenceType: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border rounded"
                    >
                      <option value="SYSTEM">SYSTEM</option>
                      <option value="PURCHASE">PURCHASE</option>
                      <option value="ORDER">ORDER</option>
                    </select>
                    <input
                      placeholder="Reference ID (optional)"
                      value={batchForm.referenceId}
                      onChange={(e) =>
                        setBatchForm((s) => ({
                          ...s,
                          referenceId: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border rounded"
                    />
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded"
                        onClick={saveBatch}
                      >
                        {editingBatchId ? "Save" : "Create"}
                      </button>
                      {editingBatchId && (
                        <button
                          className="px-4 py-2 border rounded"
                          onClick={() => {
                            setEditingBatchId(null);
                            setBatchForm({
                              quantity: "",
                              referenceType: "SYSTEM",
                              referenceId: "",
                            });
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium">
                    Serialized Items ({items.length})
                  </div>
                </div>

                {modalLoading ? (
                  <div className="text-sm text-gray-500">Loading…</div>
                ) : items.length === 0 ? (
                  <div className="text-sm text-gray-500">No serial items</div>
                ) : (
                  <div className="space-y-2">
                    {items.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between border rounded p-2"
                      >
                        <div>
                          <div className="font-medium">
                            {it.serialNumber ?? "(no serial)"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Status: {it.status ?? "IN_STORE"}
                          </div>
                        </div>
                        <div>
                          <button
                            className="px-2 py-1 bg-red-50 text-red-700 rounded"
                            onClick={() => deleteItem(it)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 text-sm text-gray-500">
                  Tip: to create serial items use the Add Inventory form (serial
                  input).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
