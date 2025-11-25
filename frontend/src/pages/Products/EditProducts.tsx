import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import FileInput from "../../components/form/input/FileInput";
import { BASE_URL, BASE_IMAGE_URL } from "../../components/BaseUrl/config";

interface Category {
  id: string;
  name: string;
}

interface ProductType {
  id: string;
  name: string;
}

interface ProductResponse {
  id: string;
  name: string;
  unit: string;
  stockQuantity: number;
  price: number;
  status: number;
  description?: string;
  categoryId?: string;
  category?: Category;
  productTypeId?: string;
  productType?: ProductType;
  images?: string[];
}

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);

  const [categoryId, setCategoryId] = useState<string>("");
  const [productTypeId, setProductTypeId] = useState<string>("");

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [stockQty, setStockQty] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<number>(1);

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewFirstNew, setPreviewFirstNew] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch categories & product types
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}categories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const items = res.data.items ?? res.data.data ?? [];
        setCategories(items);
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
        const items = res.data.items ?? res.data.data ?? [];
        setProductTypes(items);
      } catch (err) {
        console.error("Failed to fetch product types", err);
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

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        const token = localStorage.getItem("token");
        const res = await axios.get<ProductResponse>(
          `${BASE_URL}products/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const product = res.data;
        setCategoryId(product.category?.id || product.categoryId || "");
        setProductTypeId(
          product.productType?.id || product.productTypeId || ""
        );
        setName(product.name);
        setUnit(product.unit);
        setStockQty(product.stockQuantity);
        setPrice(product.price);
        setDescription(product.description || "");
        setStatus(product.status);

        if (product.images && product.images.length > 0) {
          const normalized = product.images.map((img) =>
            img.startsWith("http") ? img : `${BASE_IMAGE_URL}${img}`
          );
          setExistingImages(normalized);
        }
      } catch (error) {
        console.error("Failed to fetch product details", error);
        setMessage("Failed to load product details.");
        setMessageType("error");
      }
    };

    fetchProduct();
  }, [id]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const arr = Array.from(files);
      setNewImages(arr);
      setPreviewFirstNew(URL.createObjectURL(arr[0]));
    } else {
      setNewImages([]);
      setPreviewFirstNew(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!validateForm()) return;

    setLoading(true);
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
      formData.append("description", description);
      formData.append("status", String(status));

      newImages.forEach((file) => {
        formData.append("images", file); // matches FilesInterceptor('images')
      });

      await axios.put(`${BASE_URL}products/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Product updated successfully!");
      setMessageType("success");

      setTimeout(() => {
        navigate("/product-list");
      }, 1000);
    } catch (error) {
      console.error("Update product error:", error);
      setMessage("Failed to update product.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Edit Product" />
      <ComponentCard title="Update product details">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div>
            <Label htmlFor="category">
              Select Category <span style={{ color: "red" }}>*</span>
            </Label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                clearError("categoryId");
              }}
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

          {/* Product Type */}
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

          {/* Name */}
          <div>
            <Label htmlFor="name">
              Product Name <span style={{ color: "red" }}>*</span>
            </Label>
            <Input
              type="text"
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError("name");
              }}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <Label htmlFor="price">
              Price <span style={{ color: "red" }}>*</span>
            </Label>
            <Input
              type="number"
              id="price"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value ? Number(e.target.value) : "");
                clearError("price");
              }}
            />
            {errors.price && (
              <p className="text-red-600 text-sm mt-1">{errors.price}</p>
            )}
          </div>

          {/* Stock Qty */}
          <div>
            <Label htmlFor="stockQty">
              Stock Quantity <span style={{ color: "red" }}>*</span>
            </Label>
            <Input
              type="number"
              id="stockQty"
              value={stockQty}
              onChange={(e) => {
                setStockQty(e.target.value ? Number(e.target.value) : "");
                clearError("stockQty");
              }}
            />
            {errors.stockQty && (
              <p className="text-red-600 text-sm mt-1">{errors.stockQty}</p>
            )}
          </div>

          {/* Unit */}
          <div>
            <Label htmlFor="unit">
              Unit <span style={{ color: "red" }}>*</span>
            </Label>
            <Input
              type="text"
              id="unit"
              value={unit}
              onChange={(e) => {
                setUnit(e.target.value);
                clearError("unit");
              }}
            />
            {errors.unit && (
              <p className="text-red-600 text-sm mt-1">{errors.unit}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clearError("description");
              }}
              className="w-full border border-gray-300 rounded-md p-2"
              rows={4}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Status */}
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

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div>
              <Label>Existing Images</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {existingImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Product image ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-md border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upload New Images */}
          <div>
            <Label>Upload New Images (optional)</Label>
            {previewFirstNew && (
              <img
                src={previewFirstNew}
                alt="New Preview"
                className="w-32 h-32 object-cover mb-2 rounded-md"
              />
            )}
            <FileInput onChange={handleFileChange} multiple />
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>

          {/* Message */}
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
