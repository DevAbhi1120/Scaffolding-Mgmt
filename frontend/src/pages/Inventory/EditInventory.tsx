import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { BASE_URL, BASE_IMAGE_URL } from "../../components/BaseUrl/config";

type Product = {
  id: string;
  name: string;
  images?: string[];
};

export default function EditInventory() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // inventory id

  // Dropdown data
  const [products, setProducts] = useState<Product[]>([]);

  // Inventory fields (productId must be string UUID)
  const [productId, setProductId] = useState<string>("");
  const [openingStock, setOpeningStock] = useState<number | "">("");
  const [stockIn, setStockIn] = useState<number | "">("");
  const [stockOut, setStockOut] = useState<number | "">("");
  const [missing, setMissing] = useState<number | "">("");
  const [damaged, setDamaged] = useState<number | "">("");

  // errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const parseNum = (val: any) =>
    val === "" || val === null || typeof val === "undefined" ? 0 : Number(val);

  useEffect(() => {
    // load products + inventory
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${BASE_URL}products`, {
          headers: authHeaders,
        });
        const items = res.data?.items ?? res.data?.data ?? [];
        setProducts(items);
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };

    const fetchInventory = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}inventories/${id}`, {
          headers: authHeaders,
        });
        const inv = res.data;
        // adapt to common shapes
        // server may return { data: inv } or inv directly — handle both.
        const payload = inv?.data ?? inv;
        setProductId(payload?.product_id ?? payload?.productId ?? "");
        setOpeningStock(payload?.opening_stock ?? payload?.openingStock ?? "");
        setStockIn(payload?.stock_in ?? payload?.stockIn ?? "");
        setStockOut(payload?.stock_out ?? payload?.stockOut ?? "");
        setMissing(payload?.missing ?? "");
        setDamaged(payload?.damaged ?? "");
      } catch (err) {
        console.error("Failed to fetch inventory", err);
        setMessage("Failed to load inventory.");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!productId) newErrors.productId = "Please select a product.";
    if (openingStock === "")
      newErrors.openingStock = "Opening stock is required.";
    if (stockIn === "") newErrors.stockIn = "Stock In is required.";
    // optional: you may require stockOut/missing/damaged depending on business logic

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    if (!validateForm()) return;

    if (!id) {
      setMessage("Missing inventory id.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      if (!token) {
        setMessage("Authentication token not found.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      const payload = {
        product_id: productId,
        opening_stock: parseNum(openingStock),
        stock_in: parseNum(stockIn),
        stock_out: parseNum(stockOut),
        missing: parseNum(missing),
        damaged: parseNum(damaged),
      };

      await axios.put(`${BASE_URL}inventories/${id}`, payload, {
        headers: authHeaders,
      });

      setMessage("Inventory updated successfully!");
      setMessageType("success");
      setTimeout(() => navigate("/inventory-list"), 1000);
    } catch (err: any) {
      console.error("Update failed:", err);
      setMessage(err?.response?.data?.message ?? "Failed to update inventory.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === productId);

  return (
    <>
      <PageBreadcrumb pageTitle="Edit Inventory" />
      <ComponentCard title="Update inventory">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product select (locked) */}
          <div>
            <Label>
              Product <span className="text-red-600">*</span>
            </Label>

            <div className="flex items-center gap-3">
              {selectedProduct?.images?.[0] ? (
                <img
                  src={`${BASE_IMAGE_URL}${selectedProduct.images[0]}`}
                  alt={selectedProduct.name}
                  className="w-14 h-14 rounded object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                  No
                </div>
              )}

              <div className="flex-1">
                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    clearError("productId");
                  }}
                  className="w-full border rounded-md p-2 bg-white"
                >
                  <option value="">-- Select Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.productId && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.productId}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label>
              Opening Stock <span className="text-red-600">*</span>
            </Label>
            <Input
              type="number"
              value={openingStock}
              onChange={(e) => {
                clearError("openingStock");
                const v = e.target.value;
                setOpeningStock(v === "" ? "" : Math.max(0, Number(v)));
              }}
            />
            {errors.openingStock && (
              <p className="text-red-600 text-sm">{errors.openingStock}</p>
            )}
          </div>

          <div>
            <Label>
              Stock In <span className="text-red-600">*</span>
            </Label>
            <Input
              type="number"
              value={stockIn}
              onChange={(e) => {
                clearError("stockIn");
                const val = e.target.value;
                if (val === "") return setStockIn("");
                const newVal = Number(val);
                const total =
                  newVal +
                  parseNum(stockOut) +
                  parseNum(missing) +
                  parseNum(damaged);
                if (total <= parseNum(openingStock))
                  setStockIn(Math.max(0, newVal));
              }}
            />
            {errors.stockIn && (
              <p className="text-red-600 text-sm">{errors.stockIn}</p>
            )}
          </div>

          <div>
            <Label>Stock Out</Label>
            <Input
              type="number"
              value={stockOut}
              onChange={(e) => {
                clearError("stockOut");
                const val = e.target.value;
                if (val === "") return setStockOut("");
                const newVal = Number(val);
                const total =
                  parseNum(stockIn) +
                  newVal +
                  parseNum(missing) +
                  parseNum(damaged);
                if (total <= parseNum(openingStock))
                  setStockOut(Math.max(0, newVal));
              }}
            />
            {errors.stockOut && (
              <p className="text-red-600 text-sm">{errors.stockOut}</p>
            )}
          </div>

          <div>
            <Label>Missing</Label>
            <Input
              type="number"
              value={missing}
              onChange={(e) => {
                clearError("missing");
                const val = e.target.value;
                if (val === "") return setMissing("");
                const newVal = Number(val);
                const total =
                  parseNum(stockIn) +
                  parseNum(stockOut) +
                  newVal +
                  parseNum(damaged);
                if (total <= parseNum(openingStock))
                  setMissing(Math.max(0, newVal));
              }}
            />
            {errors.missing && (
              <p className="text-red-600 text-sm">{errors.missing}</p>
            )}
          </div>

          <div>
            <Label>Damaged</Label>
            <Input
              type="number"
              value={damaged}
              onChange={(e) => {
                clearError("damaged");
                const val = e.target.value;
                if (val === "") return setDamaged("");
                const newVal = Number(val);
                const total =
                  parseNum(stockIn) +
                  parseNum(stockOut) +
                  parseNum(missing) +
                  newVal;
                if (total <= parseNum(openingStock))
                  setDamaged(Math.max(0, newVal));
              }}
            />
            {errors.damaged && (
              <p className="text-red-600 text-sm">{errors.damaged}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update"}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border rounded-md"
            >
              Cancel
            </button>
          </div>

          {message && (
            <p
              className={`text-sm ${
                messageType === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </ComponentCard>
    </>
  );
}
