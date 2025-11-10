import { useState, useEffect } from "react";
import axios from "axios";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/dark.css";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import FileInput from "../../components/form/input/FileInput";

export default function AddSafetyChecklist() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [orders, setOrders] = useState<{ id: string; name: string }[]>([]);
  const [orderId, setOrderId] = useState("");
  const [type, setType] = useState<"Pre" | "Post">("Pre");
  const [checkDate, setCheckDate] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
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
    if (!orderId) newErrors.orderId = "Order selection is required.";
    if (!checkDate) newErrors.checkDate = "Date is required.";
    if (!photo) newErrors.photo = "Photo is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch orders from backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Fetched orders:", res.data);
        // adjust according to actual API response
        setOrders(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch orders", error);
        setOrders([]); // fallback
      }
    };
    fetchOrders();
  }, []);

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) setItems((prev) => [...prev, value]);
    else setItems((prev) => prev.filter((item) => item !== value));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhoto(file);
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
      if (!token) throw new Error("Token not found");

      const formData = new FormData();
      formData.append("order_id", orderId);
      formData.append("type", type);
      formData.append("check_date", checkDate);
      formData.append("items", JSON.stringify(items));
      if (photo) formData.append("photo", photo);

      await axios.post("http://localhost:5000/api/safety-checklists", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      setMessage("Checklist added successfully!");
      setMessageType("success");
      setTimeout(() => navigate("/safety-checklists"), 1500);
    } catch (err) {
      console.error(err);
      setMessage("Failed to add checklist.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Add Safety Checklist" />
      <ComponentCard title="Fill Checklist Details">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Select */}
          <div>
            <Label>Order <span style={{ color: "red" }}>*</span></Label>
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

          {/* Pre / Post */}
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
            <Label>Date <span style={{ color: "red" }}>*</span></Label>
            <Flatpickr
              value={checkDate}
              options={{ dateFormat: "Y-m-d" }}
              onChange={(date) => setCheckDate(date[0])}
              className="border rounded p-2 w-full text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900"
            />
            {errors.checkDate && <p className="text-red-600">{errors.checkDate}</p>}
          </div>

          {/* Checklist Items */}
          <div>
            <Label>Checklist Items</Label>
            <div className="flex gap-4">
              <label>
                <input type="checkbox" value="helmet" onChange={handleItemChange} /> Helmet
              </label>
              <label>
                <input type="checkbox" value="gloves" onChange={handleItemChange} /> Gloves
              </label>
              <label>
                <input type="checkbox" value="boots" onChange={handleItemChange} /> Boots
              </label>
            </div>
          </div>

          {/* Upload Photo */}
          <div>
            <Label>Upload Proof Photo <span style={{ color: "red" }}>*</span></Label>
            <FileInput onChange={handleFileChange} />
            {errors.photo && <p className="text-red-600">{errors.photo}</p>}
          </div>

          {/* Submit */}
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
            <p className={`text-sm mt-2 ${messageType === "success" ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </form>
      </ComponentCard>
    </>
  );
}
