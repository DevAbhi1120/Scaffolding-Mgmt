import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import FileInput from "../../components/form/input/FileInput";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [productTypeId, setProductTypeId] = useState<number | "">("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [stockQty, setStockQty] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<number>(1);
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/categories", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setCategories(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    const fetchProductType = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/productTypes", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setProductTypes(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch product type", err);
      }
    };
    fetchCategories();
    fetchProductType();
  }, []);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // ✅ Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!categoryId) newErrors.categoryId = "Please select a category.";
    if (!productTypeId) newErrors.productTypeId = "Please select a product type.";
    if (name.trim() === "") newErrors.name = "Product name is required.";
    if (unit.trim() === "") newErrors.unit = "Unit is required.";
    if (stockQty === "" || Number(stockQty) <= 0)
      newErrors.stockQty = "Stock quantity must be greater than 0.";
    // if (description.trim() === "")
    //   newErrors.description = "Description is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5000/api/products/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const product = res.data;
        setCategoryId(product.category_id);
        setProductTypeId(product.product_type_id);
        setName(product.name);
        setUnit(product.unit);
        setStockQty(product.stock_quantity);
        setPrice(product.price);
        setDescription(product.description);
        setStatus(product.status);

        if (product.thumbnail_image) {
          setPreviewImage(product.thumbnail_image);
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
    const file = event.target.files?.[0];
    if (file) {
      setThumbnailImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!validateForm()) {
      return; 
    }

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
      formData.append("category_id", String(categoryId));
      formData.append("product_type_id", String(productTypeId));
      formData.append("name", name);
      formData.append("unit", unit);
      formData.append("stock_quantity", String(stockQty));
      formData.append("price", String(price));
      formData.append("description", description);
      formData.append("status", String(status));
      if (thumbnailImage) {
        formData.append("thumbnail_image", thumbnailImage);
      }

      await axios.put(`http://localhost:5000/api/products/${id}`, formData, {
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
                setCategoryId(Number(e.target.value));
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
            
          <div>
            <Label htmlFor="productTypeId">Select Product Type <span style={{ color: "red" }}>*</span></Label>
            <select
              id="productTypeId"
              value={productTypeId}
              onChange={(e) => {
                setProductTypeId(Number(e.target.value));
                clearError("productTypeId");
              }}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="">-- Select Product Type --</option>
              {productTypes.map((ProType) => (
                <option key={ProType.id} value={ProType.id}>
                  {ProType.name}
                </option>
              ))}
            </select>
            {errors.productTypeId && (
              <p className="text-red-600 text-sm mt-1">{errors.productTypeId}</p>
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
                setPrice(Number(e.target.value));
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
                setStockQty(Number(e.target.value));
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
            <Label htmlFor="description">
              Description 
            </Label>
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

          {/* Thumbnail */}
          <div>
            <Label>Upload Thumbnail</Label>
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                className="w-32 h-32 object-cover mb-2 rounded-md"
              />
            )}
            <FileInput onChange={handleFileChange} />
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
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
