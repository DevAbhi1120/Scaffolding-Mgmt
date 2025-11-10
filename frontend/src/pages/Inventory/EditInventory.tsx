import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";

export default function EditInventory() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const navigate = useNavigate();
  const { id } = useParams(); // inventoryId

  // Dropdown data
  const [products, setProducts] = useState<any[]>([]);

  // Inventory fields
  const [productId, setProductId] = useState<number | "">("");
  const [openingStock, setOpeningStock] = useState<number | "">("");
  const [stockIn, setStockIn] = useState<number | "">("");
  const [stockOut, setStockOut] = useState<number | "">("");
  const [missing, setMissing] = useState<number | "">("");
  const [damaged, setDamaged] = useState<number | "">("");

  // errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parseNum = (val: any) => (val === "" ? 0 : Number(val));

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) setProducts(res.data.products || []);
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };

    const fetchInventory = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/inventories/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data) {
          const inv = res.data;
          setProductId(inv.product_id ?? "");
          setOpeningStock(inv.opening_stock ?? "");
          setStockIn(inv.stock_in ?? "");
          setStockOut(inv.stock_out ?? "");
          setMissing(inv.missing ?? "");
          setDamaged(inv.damaged ?? "");
        }
      } catch (err) {
        console.error("Failed to fetch inventory", err);
      }
    };

    fetchProducts();
    fetchInventory();
  }, [id]);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };
  // ✅ Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!productId) newErrors.productId = "Please select a product.";
    if (openingStock === "") newErrors.openingStock = "Opening stock is required.";
    if (stockIn === "") newErrors.stockIn = "Stock In is required.";
    // if (stockOut === "") newErrors.stockOut = "Stock Out is required.";
    // if (missing === "") newErrors.missing = "Missing is required.";
    // if (damaged === "") newErrors.damaged = "Damaged is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Authentication token not found.");
        setLoading(false);
        return;
      }

      const payload = {
        product_id: productId,
        opening_stock: openingStock || 0,
        stock_in: stockIn || 0,
        stock_out: stockOut || 0,
        missing: missing || 0,
        damaged: damaged || 0,
      };

      await axios.put(`http://localhost:5000/api/inventories/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage("Inventory updated successfully!");
      setMessageType("success");
      setTimeout(() => navigate("/inventory-list"), 1500);
    } catch (error) {
      setMessage("Failed to update inventory.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Edit Inventory" />
      <ComponentCard title="Update input fields">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product select */}
          <div>
            <Label>
              Select Product<span style={{ color: "red" }}> *</span>
            </Label>
            <select
              value={productId}
              disabled   
              className="w-full border border-gray-300 rounded-md p-2 bg-gray-100 cursor-not-allowed"
            >
              <option value="">-- Select Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* 👇 Hidden field to actually submit value */}
            <input type="hidden" name="product_id" value={productId} />

            {errors.productId && (
              <p className="text-red-600 text-sm">{errors.productId}</p>
            )}
          </div>

          <div>
            <Label>Opening Stock<span style={{ color: "red" }}> *</span></Label>
            <Input
              type="number"
              value={openingStock}
              onChange={(e) =>
                setOpeningStock(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))
              }
            />
            {errors.openingStock && <p className="text-red-600 text-sm">{errors.openingStock}</p>}
          </div>

          <div>
            <Label>Stock In<span style={{ color: "red" }}> *</span></Label>
            <Input
              type="number"
              value={stockIn}
              onChange={(e) => {
                clearError("stockIn");
                const val = e.target.value;
                if (val === "") return setStockIn("");
                const newVal = Number(val);
                const total = newVal + parseNum(stockOut) + parseNum(missing) + parseNum(damaged);
                if (total <= parseNum(openingStock)) setStockIn(Math.max(0, newVal));
              }}
            />
            {errors.stockIn && <p className="text-red-600 text-sm">{errors.stockIn}</p>}
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
                const total = parseNum(stockIn) + newVal + parseNum(missing) + parseNum(damaged);
                if (total <= parseNum(openingStock)) setStockOut(Math.max(0, newVal));
              }}
            />
            {errors.stockOut && <p className="text-red-600 text-sm">{errors.stockOut}</p>}
          </div>

          <div>
            <Label>Missing</Label>
            <Input
              type="number"
              value={missing}
              // onChange={(e) =>
              //   setMissing(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))
              // }
              onChange={(e) => {
                clearError("missing");
                const val = e.target.value;
                if (val === "") return setMissing("");
                const newVal = Number(val);
                const total = parseNum(stockIn) + parseNum(stockOut) + newVal + parseNum(damaged);
                if (total <= parseNum(openingStock)) setMissing(Math.max(0, newVal));
              }}
            />
            {errors.missing && <p className="text-red-600 text-sm">{errors.missing}</p>}
          </div>

          <div>
            <Label>Damaged</Label>
            <Input
              type="number"
              value={damaged}
              // onChange={(e) =>
              //   setDamaged(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))
              // }
              onChange={(e) => {
                clearError("damaged");
                const val = e.target.value;
                if (val === "") return setDamaged("");
                const newVal = Number(val);
                const total = parseNum(stockIn) + parseNum(stockOut) + parseNum(missing) + newVal;
                if (total <= parseNum(openingStock)) setDamaged(Math.max(0, newVal));
              }}
            />
            {errors.damaged && <p className="text-red-600 text-sm">{errors.damaged}</p>}
          </div>

          <div>
            <button
              type="submit"
              className="px-6 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>

          {message && (
            <p className={`text-sm ${messageType === "success" ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </form>
      </ComponentCard>
    </>
  );
}
