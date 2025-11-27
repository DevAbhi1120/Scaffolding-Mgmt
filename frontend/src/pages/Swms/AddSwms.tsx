import { useEffect, useState } from "react";
import axios from "axios";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";
import { useNavigate } from "react-router-dom";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import FileInput from "../../components/form/input/FileInput";
import { BASE_URL, BASE_IMAGE_URL } from "../../components/BaseUrl/config";
import Swal from "sweetalert2";

type OrderOption = {
  id: string;
  builderId?: string;
  startDate?: string;
  notes?: string;
  items?: any[];
};

export default function AddSwms() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [orderId, setOrderId] = useState("");
  const [type, setType] = useState<"Pre" | "Post">("Pre");
  const [dateOfCheck, setDateOfCheck] = useState<string>("");
  const [checklistItems, setChecklistItems] = useState<Record<string, boolean>>(
    {}
  );
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  // Helper - parse server validation errors (if your backend returns e.g. { message, errors: { field: '...' } })
  const handleServerErrors = (err: any) => {
    if (!err) return;
    const data = err?.response?.data;
    if (data?.errors && typeof data.errors === "object") {
      setErrors(data.errors);
    } else if (data?.message) {
      setErrors({ _global: data.message });
    } else {
      setErrors({ _global: "An unexpected error occurred" });
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}orders`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const items = res.data?.items ?? res.data?.data ?? res.data ?? [];
        setOrders(items);
      } catch (err) {
        console.error("Failed to fetch orders", err);
        setOrders([]);
      }
    };
    fetchOrders();
  }, []);

  // previews
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setFilePreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      const n = { ...prev };
      delete n[field];
      return n;
    });
  };

  // toggle checklist item (example items; you can load from server)
  const toggleItem = (key: string) => {
    setChecklistItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!orderId) e.orderId = "Please select the order.";
    if (!dateOfCheck) e.dateOfCheck = "Please pick a date.";
    if (files.length === 0)
      e.attachments = "Attach at least one photo as proof.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFileChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const selected = ev.target.files ? Array.from(ev.target.files) : [];
    setFiles((prev) => [...prev, ...selected].slice(0, 10)); // max 10
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const checklistData = {
        type,
        items: Object.keys(checklistItems).filter((k) => checklistItems[k]),
        notes,
      };

      // Use multipart/form-data: checklistData as JSON string, dateOfCheck, orderId, attachments[] as files
      const form = new FormData();
      form.append("checklistData", JSON.stringify(checklistData));
      form.append(
        "dateOfCheck",
        typeof dateOfCheck === "string"
          ? dateOfCheck
          : new Date(dateOfCheck).toISOString().slice(0, 10)
      );
      form.append("orderId", orderId);
      for (const f of files) form.append("attachments", f);

      const res = await axios.post(`${BASE_URL}checklists`, form, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "multipart/form-data",
        },
      });

      Swal.fire("Saved", "Safety checklist submitted", "success");
      navigate("/safety-checklists");
    } catch (err: any) {
      console.error("Submit failed", err);
      handleServerErrors(err);
      Swal.fire(
        "Error",
        err?.response?.data?.message ?? "Failed to submit checklist",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // sample checklist options (you may fetch this from backend)
  const sampleItems = [
    { key: "helmet", label: "Helmet worn" },
    { key: "boots", label: "Safety boots" },
    { key: "harness", label: "Harness (where required)" },
    { key: "clear_area", label: "Work area clear of hazards" },
  ];

  return (
    <>
      <PageBreadcrumb pageTitle="Add Safety Checklist" subName="Safety" />
      <ComponentCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order select */}
          <div>
            <Label>
              Order <span className="text-red-600">*</span>
            </Label>
            <select
              value={orderId}
              onChange={(e) => {
                clearFieldError("orderId");
                setOrderId(e.target.value);
              }}
              className="w-full border rounded p-2"
            >
              <option value="">-- Select order --</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id}{" "}
                  {o.startDate
                    ? ` • ${new Date(o.startDate).toLocaleDateString()}`
                    : ""}
                </option>
              ))}
            </select>
            {errors.orderId && (
              <p className="text-red-600 text-sm mt-1">{errors.orderId}</p>
            )}
          </div>

          {/* Type + date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full border rounded p-2"
              >
                <option value="Pre">Pre</option>
                <option value="Post">Post</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>
                Date of Check <span className="text-red-600">*</span>
              </Label>
              <Flatpickr
                value={dateOfCheck}
                options={{ dateFormat: "Y-m-d" }}
                onChange={(dates) => {
                  const d =
                    dates && dates[0]
                      ? (dates[0] as Date).toISOString().slice(0, 10)
                      : "";
                  setDateOfCheck(d);
                  clearFieldError("dateOfCheck");
                }}
                className="w-full border rounded p-2"
              />
              {errors.dateOfCheck && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.dateOfCheck}
                </p>
              )}
            </div>
          </div>

          {/* checklist items */}
          <div>
            <Label>Checklist Items</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleItems.map((it) => (
                <label key={it.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!checklistItems[it.key]}
                    onChange={() => toggleItem(it.key)}
                  />
                  <span className="text-sm">{it.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded p-2"
              rows={3}
            />
          </div>

          {/* attachments */}
          <div>
            <Label>
              Attachments / Photos <span className="text-red-600">*</span>
            </Label>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleFileChange}
            />
            {errors.attachments && (
              <p className="text-red-600 text-sm mt-1">{errors.attachments}</p>
            )}

            {filePreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {filePreviews.map((url, i) => (
                  <div
                    key={i}
                    className="relative border rounded overflow-hidden"
                  >
                    <img
                      src={url}
                      alt={`preview-${i}`}
                      className="w-full h-28 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 bg-white p-1 rounded text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* global server error */}
          {errors._global && (
            <div className="text-red-600 text-sm">{errors._global}</div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Checklist"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
