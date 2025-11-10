import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import FileInput from "../../components/form/input/FileInput";

export default function AddCategory() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

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
      console.log("Selected file:", file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    if (!validateForm()) return;

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

      const response = await axios.post(
        "http://localhost:5000/api/categories",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage("Category added successfully!");
      setCategoryName("");
      setThumbnailImage(null);
      setMessageType("success");
      setTimeout(() => {
        navigate("/category-list"); // redirect after success
      }, 1500);
    } catch (error) {
      setMessage("Failed to add category.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Add Category" />
      <ComponentCard title="Fill input fields">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="input">
              Enter Category Name <span style={{ color: "red" }}>*</span>
            </Label>
            <Input
              type="text"
              id="input"
              value={categoryName}
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
            <Label>Upload file</Label>
            <FileInput onChange={handleFileChange} className="custom-class" />
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

          {message && <p className="text-sm text-green-500">{message}</p>}
        </form>
      </ComponentCard>
    </>
  );
}
