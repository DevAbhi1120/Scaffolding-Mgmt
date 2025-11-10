import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import FileInput from "../../components/form/input/FileInput";

export default function EditCategory() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [categoryName, setCategoryName] = useState("");
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/categories/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Fetched category data:", response.data);
        setCategoryName(response.data.name);

        if (response.data.thumbnail_image) {
          setPreviewImage(`http://localhost:5000/uploads/categories/${response.data.thumbnail_image}`);
        }
      } catch (error) {
        setMessage("Failed to fetch category details.");
        setMessageType("error");
      }
    };

    fetchCategory();
  }, [id]);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (categoryName === "") newErrors.categoryName = "Category name is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
    
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setThumbnailImage(file);
      setPreviewImage(URL.createObjectURL(file)); // Temporary preview for new image
    }
  };

  // ✅ Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    if (!validateForm()) {
      return; // stop submit if form invalid
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Authentication token not found.");
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("name", categoryName);
      if (thumbnailImage) {
        formData.append("thumbnail_image", thumbnailImage);
      }
      await axios.put(
        `http://localhost:5000/api/categories/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage("Category updated successfully!");
      setMessageType("success");
      setTimeout(() => {
        navigate("/category-list"); 
      }, 1500);
    } catch (error) {
      setMessage("Failed to update category.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <PageBreadcrumb pageTitle="Edit Category" />
      <ComponentCard title="Update input fields">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="input">Edit Category Name <span style={{ color: "red" }}>*</span></Label>
            <Input
              type="text"
              id="input"
              value={categoryName}
              // onChange={(e) => setCategoryName(e.target.value)}
              // required
              onChange={(e) => {
                clearError("categoryName");
                setCategoryName(e.target.value); // ✅ direct assign
              }}
            />
            {errors.categoryName && (   
              <p className="text-red-600 text-sm mt-1">{errors.categoryName}</p>
            )}
          </div>
          <div>
            <Label>Update Thumbnail</Label>
            <FileInput onChange={handleFileChange} className="custom-class" />
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                className="mt-3 w-32 h-32 object-cover rounded-md border"
              />
            )}
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
            <p
              className={`text-sm ${
                messageType === "success" ? "text-green-500" : "text-red-500"
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
