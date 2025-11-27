// src/pages/SafetyChecklist/EditSafetyChecklist.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import { useNavigate, useParams } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import FileInput from "../../components/form/input/FileInput";
import { BASE_URL, BASE_IMAGE_URL } from "../../components/BaseUrl/config";
import Swal from "sweetalert2";
import { DownloadIcon, TrashBinIcon } from "../../icons";

type ChecklistEntity = {
  id: string;
  orderId?: string | null;
  checklistData?: any;
  dateOfCheck?: string;
  attachments?: string[] | null;
};

export default function EditSwms() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [orders, setOrders] = useState<{ id: string }[]>([]);
  const [orderId, setOrderId] = useState<string>("");
  const [checklistType, setChecklistType] = useState<"Pre" | "Post">("Pre");
  const [dateOfCheck, setDateOfCheck] = useState<string>("");
  const [items, setItems] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);

  const buildFileUrl = (key: string) => {
    console.log(key);
    if (!key) return "";
    if (key.startsWith("http")) return key;
    if (key.startsWith("/uploads/")) return `${window.location.origin}${key}`;
    return `${BASE_URL.replace(/\/$/, "")}/files/download/${encodeURIComponent(
      key
    )}`;
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}orders`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setOrders(res.data.items ?? res.data ?? []);
      } catch (err) {
        console.error("Failed to load orders", err);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}checklists/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data: ChecklistEntity = res.data;
        setOrderId(data.orderId ?? "");
        setChecklistType(data.checklistData?.type ?? "Pre");
        setDateOfCheck(data.dateOfCheck ? data.dateOfCheck.split("T")[0] : "");
        setItems(
          Array.isArray(data.checklistData?.items)
            ? data.checklistData.items
            : []
        );
        setExistingAttachments(data.attachments ?? []);
      } catch (err: any) {
        setMessage(
          "Failed to load checklist: " +
            (err.response?.data?.message || err.message)
        );
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleNewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeExistingAttachment = (key: string) => {
    setExistingAttachments((prev) => prev.filter((p) => p !== key));
  };

  const removeNewFile = (i: number) => {
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const validate = () => {
    if (!orderId) return "Order is required";
    if (!dateOfCheck) return "Date is required";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setMessage(error);
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const form = new FormData();

      const checklistData = { type: checklistType, items };
      form.append("checklistData", JSON.stringify(checklistData));
      form.append("dateOfCheck", dateOfCheck);
      form.append("orderId", orderId);
      form.append("existingAttachments", JSON.stringify(existingAttachments));

      newFiles.forEach((f) => form.append("attachments", f));

      await axios.put(`${BASE_URL}checklists/${id}`, form, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Checklist updated successfully!");
      setMessageType("success");
      setTimeout(() => navigate("/safety-checklists"), 1500);
    } catch (err: any) {
      setMessage(
        "Update failed: " + (err.response?.data?.message || err.message)
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (value: string) => {
    setItems((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  };

  const removeAttachmentConfirm = async (key: string) => {
    const result = await Swal.fire({
      title: "Remove attachment?",
      text: "This will remove it permanently from the checklist.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
    });
    if (result.isConfirmed) {
      removeExistingAttachment(key);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Edit Safety Checklist" />
      <ComponentCard title="Update Safety Checklist">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-4">
            <div>
              <Label>Order</Label>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full border rounded p-2"
                required
              >
                <option value="">-- Select Order --</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Type</Label>
              <select
                value={checklistType}
                onChange={(e) => setChecklistType(e.target.value as any)}
                className="w-full border rounded p-2"
              >
                <option value="Pre">Pre-Delivery</option>
                <option value="Post">Post-Delivery</option>
              </select>
            </div>

            <div>
              <Label>Date of Check</Label>
              <Flatpickr
                value={dateOfCheck ? new Date(dateOfCheck) : undefined}
                options={{ dateFormat: "Y-m-d" }}
                onChange={([date]) =>
                  setDateOfCheck(date.toISOString().split("T")[0])
                }
                className="w-full border rounded p-2"
                placeholder="Select date"
                required
              />
            </div>
          </div>

          <div>
            <Label>Checklist Items</Label>
            <div className="flex flex-wrap gap-4">
              {["helmet", "gloves", "boots", "harness"].map((it) => (
                <label key={it} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={items.includes(it)}
                    onChange={() => toggleItem(it)}
                  />
                  <span className="capitalize">{it}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Existing Attachments</Label>
            {existingAttachments.length === 0 ? (
              <p className="text-gray-500 italic">No attachments</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {existingAttachments.map((key) => (
                  <div
                    key={key}
                    className="border rounded-lg overflow-hidden bg-gray-50"
                  >
                    {/\.(jpe?g|png|gif)$/i.test(key) ? (
                      <img
                        src={buildFileUrl(BASE_IMAGE_URL + key)}
                        alt="attachment"
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center bg-gray-200 text-gray-600">
                        <span className="text-sm">PDF / File</span>
                      </div>
                    )}
                    <div className="p-2 flex justify-between items-center bg-white">
                      <a
                        href={buildFileUrl(BASE_IMAGE_URL + key)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 text-sm flex items-center gap-1"
                      >
                        <DownloadIcon className="w-5 h-5" />
                      </a>
                      
                      {/* <button
                        type="button"
                        onClick={() =>
                          removeAttachmentConfirm(BASE_IMAGE_URL + key)
                        }
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashBinIcon className="w-5 h-5" />
                      </button> */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Add New Attachments</Label>
            <FileInput
              onChange={handleNewFiles}
              multiple
              accept="image/*,.pdf"
            />
            {newFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {newFiles.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border rounded p-3 bg-gray-50"
                  >
                    <span className="truncate max-w-md">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeNewFile(i)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-70"
            >
              {loading ? "Updating..." : "Update Checklist"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/safety-checklists")}
              className="px-6 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>

          {message && (
            <div
              className={`mt-4 p-3 rounded ${
                messageType === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message}
            </div>
          )}
        </form>
      </ComponentCard>
    </>
  );
}
