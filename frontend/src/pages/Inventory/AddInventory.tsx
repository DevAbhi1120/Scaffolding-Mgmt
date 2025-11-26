import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { BASE_URL } from "../../components/BaseUrl/config";

type Product = {
  id: string;
  name: string;
  stockQuantity?: number;
};

export default function AddInventory() {
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState("");
  const [globalType, setGlobalType] = useState<"success" | "error" | "">("");
  const navigate = useNavigate();

  // mode: 'batch' | 'form'
  const [mode, setMode] = useState<"batch" | "form">("form");

  // Products (for select)
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<string>("");

  // Product summary (from backend)
  const [summary, setSummary] = useState<{
    availablePhysical?: number;
    stockBalance?: number;
  } | null>(null);

  // Form state (form-mode)
  const [openingStock, setOpeningStock] = useState<number | "">("");
  const [stockIn, setStockIn] = useState<number | "">("");
  const [stockOut, setStockOut] = useState<number | "">("");
  const [missing, setMissing] = useState<number | "">("");
  const [damaged, setDamaged] = useState<number | "">("");

  // Batch state (batch-mode)
  const [batchQuantity, setBatchQuantity] = useState<number | "">("");
  const [batchReferenceType, setBatchReferenceType] = useState<
    "SYSTEM" | "PURCHASE" | "ORDER"
  >("SYSTEM");
  const [batchReferenceId, setBatchReferenceId] = useState<string>("");

  // Serial numbers textarea (optional). If provided, create per-serial items instead of batch.
  const [serialsText, setSerialsText] = useState<string>("");

  // errors state (per field)
  const [errors, setErrors] = useState<Record<string, string>>({});

  // helper to parse numbers
  const parseNum = (v: number | "" | string | undefined) => {
    if (v === "" || v === undefined || v === null) return 0;
    return Number(v);
  };

  useEffect(() => {
    // fetch products for select
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${BASE_URL}products`);
        const items = res?.data?.items ?? res?.data?.data ?? [];
        setProducts(items);
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    // fetch product summary on change
    const fetchSummary = async () => {
      setSummary(null);
      if (!productId) return;
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${BASE_URL}inventories/summary/${productId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );
        setSummary({
          availablePhysical: res.data?.availablePhysical ?? 0,
          stockBalance: res.data?.stockBalance ?? 0,
        });
      } catch (err) {
        console.warn("Failed to fetch product summary", err);
      }
    };
    fetchSummary();
  }, [productId]);

  // clear a field-specific error when user starts typing
  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateBatch = () => {
    const newErrors: Record<string, string> = {};
    if (!productId) newErrors.productId = "Please select a product.";
    if (!serialsText) {
      // For batch mode without serials, require quantity
      if (batchQuantity === "" || parseNum(batchQuantity) <= 0)
        newErrors.batchQuantity = "Quantity is required and must be > 0.";
    } else {
      // If serials provided, validate at least one serial
      const serials = serialsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      if (serials.length === 0)
        newErrors.serialsText =
          "Please provide at least one serial (one per line).";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!productId) newErrors.productId = "Please select a product.";
    if (openingStock === "")
      newErrors.openingStock = "Opening stock is required.";
    // stockIn can be 0 — optional, but non-empty in your previous UI; keep similar rule
    if (stockIn === "")
      newErrors.stockIn = "Stock In is required (use 0 if none).";

    // Ensure totals don't exceed openingStock if you want that enforced client-side
    const os = parseNum(openingStock);
    const si = parseNum(stockIn);
    const so = parseNum(stockOut);
    const mi = parseNum(missing);
    const da = parseNum(damaged);
    if (si + so + mi + da > os && os > 0) {
      newErrors.total =
        "Total of in/out/missing/damaged cannot exceed opening stock + stock in.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit for batch mode
  const handleBatchSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setGlobalMessage("");
    setGlobalType("");
    if (!validateBatch()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");

      const trimmedSerials = serialsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      if (trimmedSerials.length > 0) {
        // Create via items endpoint with serialNumbers -> will create per-serial InventoryItem rows
        const payload = {
          product_id: productId,
          opening_stock: 0, // we won't add opening if serial-only; if you want opening, allow user to enter as well
          stock_in: trimmedSerials.length,
          stock_out: 0,
          missing: 0,
          damaged: 0,
          serialNumbers: trimmedSerials,
        };
        await axios.post(`${BASE_URL}inventories/items`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Create a single batch via /inventories/batches
        const payload = {
          productId,
          quantity: Number(batchQuantity),
          referenceType: batchReferenceType,
          referenceId: batchReferenceId || undefined,
        };
        await axios.post(`${BASE_URL}inventories/batches`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setGlobalMessage("Batch / serial items created successfully.");
      setGlobalType("success");
      // reset
      setProductId("");
      setBatchQuantity("");
      setBatchReferenceId("");
      setSerialsText("");
      setErrors({});
      setTimeout(() => navigate("/inventory-list"), 1200);
    } catch (err: any) {
      console.error(err);
      setGlobalMessage(
        err?.response?.data?.message ?? "Failed to create batch/inventory."
      );
      setGlobalType("error");
    } finally {
      setLoading(false);
    }
  };

  // Submit for form mode (opening stock + in/out)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalMessage("");
    setGlobalType("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");

      const payload = {
        product_id: productId,
        opening_stock: parseNum(openingStock),
        stock_in: parseNum(stockIn),
        stock_out: parseNum(stockOut),
        missing: parseNum(missing),
        damaged: parseNum(damaged),
      };

      await axios.post(`${BASE_URL}inventories/items`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setGlobalMessage("Inventory (form) created successfully.");
      setGlobalType("success");
      // reset
      setProductId("");
      setOpeningStock("");
      setStockIn("");
      setStockOut("");
      setMissing("");
      setDamaged("");
      setErrors({});
      setTimeout(() => navigate("/inventory-list"), 1200);
    } catch (err: any) {
      console.error(err);
      setGlobalMessage(
        err?.response?.data?.message ?? "Failed to create inventory."
      );
      setGlobalType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Add Inventory" />
      <ComponentCard title="Inventory — create batch or form">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setMode("form")}
            className={`px-4 py-2 rounded ${
              mode === "form" ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            Create Inventory (Form)
          </button>
          <button
            onClick={() => setMode("batch")}
            className={`px-4 py-2 rounded ${
              mode === "batch" ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            Create Batch / Serials
          </button>
        </div>

        {/* Common: product select & summary */}
        <div className="mb-4">
          <Label>
            Select Product <span style={{ color: "red" }}> *</span>
          </Label>
          <select
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              clearError("productId");
            }}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">-- Select Product --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {errors.productId && (
            <p className="text-red-600 text-sm mt-1">{errors.productId}</p>
          )}

          {/* product summary */}
          {productId && (
            <div className="mt-2 text-sm text-gray-700">
              <div>Available physical: {summary?.availablePhysical ?? "—"}</div>
              <div>Stock balance: {summary?.stockBalance ?? "—"}</div>
            </div>
          )}
        </div>

        {mode === "form" && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label>Opening Stock *</Label>
              <Input
                type="number"
                value={openingStock}
                onChange={(e) => {
                  clearError("openingStock");
                  const val = e.target.value;
                  setOpeningStock(val === "" ? "" : Math.max(0, Number(val)));
                }}
              />
              {errors.openingStock && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.openingStock}
                </p>
              )}
            </div>

            <div>
              <Label>Stock In *</Label>
              <Input
                type="number"
                value={stockIn}
                onChange={(e) => {
                  clearError("stockIn");
                  const val = e.target.value;
                  setStockIn(val === "" ? "" : Math.max(0, Number(val)));
                }}
              />
              {errors.stockIn && (
                <p className="text-red-600 text-sm mt-1">{errors.stockIn}</p>
              )}
            </div>

            <div>
              <Label>Stock Out</Label>
              <Input
                type="number"
                value={stockOut}
                onChange={(e) =>
                  setStockOut(
                    e.target.value === ""
                      ? ""
                      : Math.max(0, Number(e.target.value))
                  )
                }
              />
            </div>

            <div>
              <Label>Missing</Label>
              <Input
                type="number"
                value={missing}
                onChange={(e) =>
                  setMissing(
                    e.target.value === ""
                      ? ""
                      : Math.max(0, Number(e.target.value))
                  )
                }
              />
            </div>

            <div>
              <Label>Damaged</Label>
              <Input
                type="number"
                value={damaged}
                onChange={(e) =>
                  setDamaged(
                    e.target.value === ""
                      ? ""
                      : Math.max(0, Number(e.target.value))
                  )
                }
              />
            </div>

            {errors.total && (
              <p className="text-red-600 text-sm mt-1">{errors.total}</p>
            )}

            <div>
              <button
                type="submit"
                className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Create Inventory"}
              </button>
            </div>
          </form>
        )}

        {mode === "batch" && (
          <form onSubmit={handleBatchSubmit} className="space-y-4">
            <div>
              <Label>Batch Quantity (if not using serials)</Label>
              <Input
                type="number"
                value={batchQuantity}
                onChange={(e) =>
                  setBatchQuantity(
                    e.target.value === ""
                      ? ""
                      : Math.max(0, Number(e.target.value))
                  )
                }
              />
              {errors.batchQuantity && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.batchQuantity}
                </p>
              )}
            </div>

            <div>
              <Label>Reference Type</Label>
              <select
                value={batchReferenceType}
                onChange={(e) => setBatchReferenceType(e.target.value as any)}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="SYSTEM">SYSTEM</option>
                <option value="PURCHASE">PURCHASE</option>
                <option value="ORDER">ORDER</option>
              </select>
            </div>

            <div>
              <Label>Reference ID (optional)</Label>
              <Input
                value={batchReferenceId}
                onChange={(e) => setBatchReferenceId(e.target.value)}
              />
            </div>

            <div>
              <Label>Serial Numbers (optional — one per line)</Label>
              <textarea
                value={serialsText}
                onChange={(e) => {
                  clearError("serialsText");
                  setSerialsText(e.target.value);
                }}
                rows={6}
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="ABC12345&#10;XYZ98765"
              />
              {errors.serialsText && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.serialsText}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                If serial numbers are provided, per-serial inventory items will
                be created instead of a batch.
              </p>
            </div>

            <div>
              <button
                type="submit"
                className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Create Batch / Serials"}
              </button>
            </div>
          </form>
        )}

        {globalMessage && (
          <p
            className={`text-sm ${
              globalType === "success" ? "text-green-600" : "text-red-600"
            } mt-4`}
          >
            {globalMessage}
          </p>
        )}
      </ComponentCard>
    </>
  );
}
