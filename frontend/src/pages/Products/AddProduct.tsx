import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import FileInput from "../../components/form/input/FileInput";
import { BASE_URL } from "../../components/BaseUrl/config";

export default function AddProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [categories, setCategories] = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);

  const [categoryId, setCategoryId] = useState<string>("");
  const [productTypeId, setProductTypeId] = useState<string>("");

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [stockQty, setStockQty] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<number>(1);
  const [images, setImages] = useState<File[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}categories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(res.data.items || []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };

    const fetchProductTypes = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}product-types`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProductTypes(res.data.items || []);
      } catch (err) {
        console.error("Failed to fetch product type", err);
      }
    };

    fetchCategories();
    fetchProductTypes();
  }, []);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!categoryId) newErrors.categoryId = "Please select a category.";
    if (!productTypeId)
      newErrors.productTypeId = "Please select a product type.";
    if (name.trim() === "") newErrors.name = "Product name is required.";
    if (unit.trim() === "") newErrors.unit = "Unit is required.";
    if (stockQty === "" || Number(stockQty) <= 0)
      newErrors.stockQty = "Stock quantity must be greater than 0.";
    if (price === "" || Number(price) < 0)
      newErrors.price = "Price is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setImages(Array.from(files));
    }
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
        setMessageType("error");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("categoryId", categoryId);
      formData.append("productTypeId", productTypeId);
      formData.append("name", name);
      formData.append("unit", unit);
      formData.append("stockQuantity", String(stockQty));
      formData.append("price", String(price));
      formData.append("status", String(status));
      formData.append("description", description);

      images.forEach((file) => {
        formData.append("images", file); // field name must match FilesInterceptor('images')
      });

      await axios.post(`${BASE_URL}products`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Product added successfully!");
      setMessageType("success");
      setTimeout(() => {
        navigate("/product-list");
      }, 1000);

      setCategoryId("");
      setProductTypeId("");
      setName("");
      setUnit("");
      setStockQty("");
      setPrice("");
      setDescription("");
      setStatus(1);
      setImages([]);
      setErrors({});
    } catch (error) {
      console.error("Add product error:", error);
      setMessage("Failed to add product.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Add Product" />
      <ComponentCard title="Fill input fields">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="category">
              Select Category <span style={{ color: "red" }}>*</span>
            </Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              >
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-red-600 text-sm mt-1">{errors.categoryId}</p>
            )}
          </div>

          <div>
            <Label htmlFor="productTypeId">
              Select Product Type <span style={{ color: "red" }}>*</span>
            </Label>
            <select
              id="productTypeId"
              value={productTypeId}
              onChange={(e) => {
                setProductTypeId(e.target.value);
                clearError("productTypeId");
              }}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="">-- Select Product Type --</option>
              {productTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.name}
                </option>
              ))}
            </select>
            {errors.productTypeId && (
              <p className="text-red-600 text-sm mt-1">
                {errors.productTypeId}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="name">
              Product Name <span style={{ color: "red" }}>*</span>
            </Label>
            <Input
              type="text"
              id="name"
              value={name}
              onChange={(e) => {
                clearError("name");
                setName(e.target.value);
              }}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="stockQty">
              Stock Quantity <span style={{ color: "red" }}>*</span>
            </Label>
            <Input
              type="number"
              id="stockQty"
              value={stockQty}
              onChange={(e) => {
                clearError("stockQty");
                setStockQty(e.target.value ? Number(e.target.value) : "");
              }}
            />
            {errors.stockQty && (
              <p className="text-red-600 text-sm mt-1">{errors.stockQty}</p>
            )}
          </div>

          <div>
            <Label htmlFor="unit">
              Unit <span style={{ color: "red" }}>*</span>
            </Label>
            <Input
              type="text"
              id="unit"
              value={unit}
              onChange={(e) => {
                clearError("unit");
                setUnit(e.target.value);
              }}
            />
            {errors.unit && (
              <p className="text-red-600 text-sm mt-1">{errors.unit}</p>
            )}
          </div>

          <div>
            <Label htmlFor="price">
              Price <span style={{ color: "red" }}>*</span>
            </Label>
            <Input
              type="number"
              id="price"
              value={price}
              onChange={(e) => {
                clearError("price");
                setPrice(e.target.value ? Number(e.target.value) : "");
              }}
            />
            {errors.price && (
              <p className="text-red-600 text-sm mt-1">{errors.price}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => {
                clearError("description");
                setDescription(e.target.value);
              }}
              className="w-full border border-gray-300 rounded-md p-2"
              rows={4}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>

          <div>
            <Label>Upload Images</Label>
            {/* Make sure your FileInput supports "multiple" and passes it through */}
            <FileInput onChange={handleFileChange} multiple />
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
