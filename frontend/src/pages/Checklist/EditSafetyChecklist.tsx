import { useEffect, useState } from "react";
import axios from "axios";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/dark.css";
import { useNavigate, useParams } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import FileInput from "../../components/form/input/FileInput";

export default function EditSafetyChecklist() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [orders, setOrders] = useState<{ id: string; name: string }[]>([]);
  const [orderId, setOrderId] = useState("");
  const [type, setType] = useState<"Pre" | "Post">("Pre");
  const [checkDate, setCheckDate] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Fetch orders for dropdown
  useEffect(() => {
    const fetchOrdersList = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch orders", error);
        setOrders([]);
      }
    };
    fetchOrdersList();
  }, []);

  // Fetch checklist details
  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/safety-checklists/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = response.data;
        setOrderId(data.order_id);
        setType(data.type);
        setCheckDate(data.check_date.split("T")[0]); // YYYY-MM-DD
        setItems(data.items ? JSON.parse(data.items) : []);

        if (data.photo) {
          setExistingPhotoUrl(
            `http://localhost:5000/uploads/checklists/${data.photo}`
          );
        }
      } catch (error) {
        setMessage("Failed to load checklist.");
        setMessageType("error");
      }
    };

    fetchChecklist();
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
    if (!orderId) newErrors.orderId = "Order selection is required.";
    if (!checkDate) newErrors.checkDate = "Date is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setPhoto(file);
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) setItems((prev) => [...prev, value]);
    else setItems((prev) => prev.filter((item) => item !== value));
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
      const formData = new FormData();
      formData.append("order_id", orderId);
      formData.append("type", type);
      formData.append("check_date", checkDate);
      formData.append("items", JSON.stringify(items));
      if (photo) formData.append("photo", photo);

      await axios.put(
        `http://localhost:5000/api/safety-checklists/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage("Checklist updated successfully!");
      setMessageType("success");
      setTimeout(() => navigate("/safety-checklists"), 1500);
    } catch (error) {
      console.error(error);
      setMessage("Failed to update checklist.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Edit Safety Checklist" />
      <ComponentCard title="Update Checklist Details">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Select */}
          <div>
            <Label>
              Order <span style={{ color: "red" }}>*</span>
            </Label>
            <select
              className="border rounded p-2 w-full"
              value={orderId}
              onChange={(e) => {
                clearError("orderId");
                setOrderId(e.target.value);
              }}
            >
              <option value="">-- Select Order --</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.id}
                </option>
              ))}
            </select>
            {errors.orderId && <p className="text-red-600">{errors.orderId}</p>}
          </div>

          {/* Type */}
          <div>
            <Label>Checklist Type</Label>
            <select
              className="border rounded p-2 w-full"
              value={type}
              onChange={(e) => setType(e.target.value as "Pre" | "Post")}
            >
              <option value="Pre">Pre</option>
              <option value="Post">Post</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <Label>
              Date <span style={{ color: "red" }}>*</span>
            </Label>
            <Flatpickr
              value={checkDate ? new Date(checkDate) : null}
              options={{ dateFormat: "d-m-Y" }}
              onChange={(selectedDates) => {
                clearError("checkDate");
                if (selectedDates.length > 0) {
                  const date = selectedDates[0];
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const day = String(date.getDate()).padStart(2, "0");
                  setCheckDate(`${year}-${month}-${day}`);
                }
              }}
              className="border rounded p-2 w-full text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900"
            />
            {errors.checkDate && <p className="text-red-600">{errors.checkDate}</p>}
          </div>

          {/* Checklist Items */}
          <div>
            <Label>Checklist Items</Label>
            <div className="flex gap-4">
              {["helmet", "gloves", "boots"].map((item) => (
                <label key={item}>
                  <input
                    type="checkbox"
                    value={item}
                    checked={items.includes(item)}
                    onChange={handleItemChange}
                  />{" "}
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Existing Photo */}
          {existingPhotoUrl && !photo && (
            <div>
              <Label>Existing Photo</Label>
              <img
                src={existingPhotoUrl}
                alt="Checklist"
                className="w-32 h-32 object-cover rounded border"
              />
            </div>
          )}

          {/* New Photo Preview */}
          {photo && (
            <div>
              <Label>New Photo Preview</Label>
              <img
                src={URL.createObjectURL(photo)}
                alt="New Preview"
                className="w-32 h-32 object-cover rounded border"
              />
            </div>
          )}

          {/* Upload New Photo */}
          <div>
            <Label>Upload New Proof Photo</Label>
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

          {message && (
            <p
              className={`text-sm mt-2 ${
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
