import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import FileInput from "../../components/form/input/FileInput";
import { BASE_URL } from "../../components/BaseUrl/config";

export default function AddCategory() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!categoryName.trim())
      newErrors.categoryName = "Category name is required.";
    if (!description.trim()) newErrors.description = "Description is required.";

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
      formData.append("name", categoryName.trim());
      formData.append("description", description.trim());
      if (thumbnailImage) {
        formData.append("thumbnail_image", thumbnailImage);
      }

      await axios.post(`${BASE_URL}categories`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Category added successfully!");
      setMessageType("success");
      setCategoryName("");
      setDescription("");
      setThumbnailImage(null);

      setTimeout(() => {
        navigate("/category-list");
      }, 1500);
    } catch (error) {
      console.error(error);
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
            <Label htmlFor="categoryName">
              Enter Category Name <span style={{ color: "red" }}>*</span>
            </Label>
            <Input
              type="text"
              id="categoryName"
              placeholder="Category Name"
              value={categoryName}
              onChange={(e) => {
                clearError("categoryName");
                setCategoryName(e.target.value);
              }}
            />
            {errors.categoryName && (
              <p className="text-red-600 text-sm mt-1">{errors.categoryName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">
              Description <span style={{ color: "red" }}>*</span>
            </Label>
            <textarea
              id="description"
              placeholder="Description"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:border-gray-700 dark:text-white"
              rows={4}
              value={description}
              onChange={(e) => {
                clearError("description");
                setDescription(e.target.value);
              }}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <Label>Upload Thumbnail</Label>
            <FileInput onChange={handleFileChange} className="custom-class" />
          </div>

          <div>
            <button
              type="submit"
              className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>

          {message && (
            <p
              className={`text-sm mt-1 ${
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
