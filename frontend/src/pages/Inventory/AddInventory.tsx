import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";

export default function AddInventory() {
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState("");
  const [globalType, setGlobalType] = useState<"success" | "error" | "">("");
  const navigate = useNavigate();

  // Inventories table fields
  const [products, setProducts] = useState<any[]>([]);
  const [productId, setProductId] = useState<number | "">("");
  const [openingStock, setOpeningStock] = useState<number | "">("");
  const [stockIn, setStockIn] = useState<number | "">("");
  const [stockOut, setStockOut] = useState<number | "">("");
  const [missing, setMissing] = useState<number | "">("");
  const [damaged, setDamaged] = useState<number | "">("");

  // errors state (per field)
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parseNum = (val: any) => (val === "" ? 0 : Number(val));

  // useEffect(() => {
  //   const fetchProducts = async () => {
  //     try {
  //       const token = localStorage.getItem("token");
  //       const res = await axios.get("http://localhost:5000/api/products", {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });
  //       if (res.data.success) {
  //         setProducts(res.data.products || []);
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch products", err);
  //     }
  //   };
  //   fetchProducts();
  // }, []);

  useEffect(() => {
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch products
      const resProducts = await axios.get("http://localhost:5000/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch inventories
      const resInventories = await axios.get("http://localhost:5000/api/inventories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resProducts.data.success && resInventories.data.success) {
        const allProducts = resProducts.data.products || [];
        const inventories = resInventories.data.data || [];
        const inventoryProductIds = inventories.map(
          (inv: any) => Number(inv.product_id)
        );
        const availableProducts = allProducts.filter(
          (p: any) => !inventoryProductIds.includes(Number(p.id))
        );
        setProducts(availableProducts);
      }
    } catch (err) {
      console.error("Failed to fetch products/inventories", err);
    }
  };

  fetchProducts();
}, []);


  // 🟢 Generic helper: clear error when user types/changes
  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!productId) newErrors.productId = "Please select a product.";
    if (openingStock === "") newErrors.openingStock = "Opening stock is required.";
    if (stockIn === "") newErrors.stockIn = "Stock In is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalMessage("");
    setGlobalType("");

    if (!validateForm()) return; 

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setGlobalMessage("Authentication token not found.");
        setGlobalType("error");
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

      await axios.post("http://localhost:5000/api/inventories", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setGlobalMessage("Inventory added successfully!");
      setGlobalType("success");

      // reset form
      setProductId("");
      setOpeningStock("");
      setStockIn("");
      setStockOut("");
      setMissing("");
      setDamaged("");
      setErrors({});

      setTimeout(() => navigate("/inventory-list"), 1500);
    } catch (error) {
      setGlobalMessage("Failed to add inventory.");
      setGlobalType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Add Inventory" />
      <ComponentCard title="Fill input fields">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product select */}
          <div>
            <Label>Select Product <span style={{ color: "red" }}> *</span></Label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(Number(e.target.value));
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
          </div>

          <div>
            <Label>Opening Stock<span style={{ color: "red" }}> *</span></Label>
            <Input
              type="number"
              value={openingStock}
              onChange={(e) => {
                clearError("openingStock");
                setOpeningStock(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)));
              }}
            />
            {errors.openingStock && (
              <p className="text-red-600 text-sm mt-1">{errors.openingStock}</p>
            )}
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
            {errors.stockIn && (
              <p className="text-red-600 text-sm mt-1">{errors.stockIn}</p>
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
                const total = parseNum(stockIn) + newVal + parseNum(missing) + parseNum(damaged);
                if (total <= parseNum(openingStock)) setStockOut(Math.max(0, newVal));
              }}
            />
            {errors.stockOut && (
              <p className="text-red-600 text-sm mt-1">{errors.stockOut}</p>
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
                const total = parseNum(stockIn) + parseNum(stockOut) + newVal + parseNum(damaged);
                if (total <= parseNum(openingStock)) setMissing(Math.max(0, newVal));
              }}
            />
            {errors.missing && (
              <p className="text-red-600 text-sm mt-1">{errors.missing}</p>
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
                const total = parseNum(stockIn) + parseNum(stockOut) + parseNum(missing) + newVal;
                if (total <= parseNum(openingStock)) setDamaged(Math.max(0, newVal));
              }}
            />
            {errors.damaged && (
              <p className="text-red-600 text-sm mt-1">{errors.damaged}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>

          {globalMessage && (
            <p
              className={`text-sm ${
                globalType === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {globalMessage}
            </p>
          )}
        </form>
      </ComponentCard>
    </>
  );
}
