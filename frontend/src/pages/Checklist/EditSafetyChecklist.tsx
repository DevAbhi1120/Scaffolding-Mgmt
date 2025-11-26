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
import { BASE_URL } from "../../components/BaseUrl/config";
import Swal from "sweetalert2";
import { DownloadIcon, TrashBinIcon } from "../../icons";

type ChecklistEntity = {
  id: string;
  orderId?: string | null;
  checklistData?: any;
  dateOfCheck?: string;
  attachments?: string[] | null;
};

export default function EditSafetyChecklist() {
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

  // helper build file URL
  const buildFileUrl = (key: string) => {
    if (!key) return "";
    if (key.startsWith("http://") || key.startsWith("https://")) return key;
    if (key.startsWith("/")) return `${window.location.origin}${key}`;
    return `${BASE_URL}files/download/${encodeURIComponent(key)}`;
  };

  useEffect(() => {
    // fetch orders for dropdown (optional)
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}orders`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const list = res.data.items ?? res.data ?? [];
        setOrders(list);
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
            : data.checklistData?.items ?? []
        );
        setExistingAttachments(data.attachments ?? []);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load checklist");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const clearError = () => {
    setMessage("");
    setMessageType("");
  };

  // add new files
  const handleNewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files;
    if (!f) return;
    setNewFiles((prev) => [...prev, ...Array.from(f)]);
  };

  // remove existing attachment (client-side only) — we will pass a preserved list to server
  const removeExistingAttachment = (key: string) => {
    setExistingAttachments((prev) => prev.filter((p) => p !== key));
  };

  // remove new file before upload
  const removeNewFile = (i: number) => {
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const validate = () => {
    const errors: string[] = [];
    if (!orderId) errors.push("Order is required");
    if (!dateOfCheck) errors.push("Date is required");
    if (errors.length) {
      setMessage(errors.join(", "));
      setMessageType("error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const form = new FormData();

      // server accepts checklistData JSON; we store type/items inside it
      const checklistData = { type: checklistType, items };
      form.append("checklistData", JSON.stringify(checklistData));
      form.append("dateOfCheck", dateOfCheck);
      form.append("orderId", orderId);
      // Preserve existing attachments by sending them back in body (so server can keep them)
      form.append("existingAttachments", JSON.stringify(existingAttachments));

      // append new files (attachments[])
      newFiles.forEach((f) => form.append("attachments", f));

      await axios.put(`${BASE_URL}checklists/${id}`, form, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Checklist updated");
      setMessageType("success");
      setTimeout(() => navigate("/safety-checklists"), 1200);
    } catch (err) {
      console.error(err);
      setMessage("Failed to update checklist");
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
    const r = await Swal.fire({
      title: "Remove attachment?",
      text: "This will remove the attachment from this checklist (it won't delete the file).",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove",
    });
    if (!r.isConfirmed) return;
    removeExistingAttachment(key);
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Edit Safety Checklist" />
      <ComponentCard title="Update Checklist">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Order</Label>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full border rounded p-2"
              >
                <option value="">-- Select order --</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id}
                  </option>
                ))}
                {orderId && !orders.find((o) => o.id === orderId) && (
                  <option value={orderId}>{orderId}</option>
                )}
              </select>
            </div>

            <div>
              <Label>Type</Label>
              <select
                value={checklistType}
                onChange={(e) =>
                  setChecklistType(e.target.value as "Pre" | "Post")
                }
                className="w-full border rounded p-2"
              >
                <option value="Pre">Pre</option>
                <option value="Post">Post</option>
              </select>
            </div>

            <div>
              <Label>Date</Label>
              <Flatpickr
                value={dateOfCheck ? new Date(dateOfCheck) : null}
                options={{ dateFormat: "Y-m-d" }}
                onChange={(arr) => {
                  if (arr && arr[0]) {
                    const d = arr[0] as Date;
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    setDateOfCheck(`${year}-${month}-${day}`);
                  }
                }}
                className="w-full border rounded p-2"
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
              <div className="text-gray-500">No attachments</div>
            ) : (
              <div className="flex flex-col gap-2">
                {existingAttachments.map((a) => (
                  <div
                    key={a}
                    className="flex items-center justify-between gap-3 border rounded p-2"
                  >
                    <a
                      href={buildFileUrl(a)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      <span className="truncate max-w-xs">
                        {a.split("/").pop()}
                      </span>
                    </a>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => removeAttachmentConfirm(a)}
                        className="text-red-600"
                      >
                        <TrashBinIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Upload New Attachments</Label>
            <FileInput onChange={handleNewFiles} multiple />
            {newFiles.length > 0 && (
              <div className="mt-2 flex flex-col gap-2">
                {newFiles.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 border rounded p-2"
                  >
                    <div className="truncate max-w-xs">{f.name}</div>
                    <button
                      type="button"
                      onClick={() => removeNewFile(i)}
                      className="text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {loading ? "Updating..." : "Update Checklist"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/safety-checklists")}
              className="px-5 py-2 border rounded"
            >
              Cancel
            </button>
          </div>

          {message && (
            <div
              className={
                messageType === "success" ? "text-green-600" : "text-red-600"
              }
            >
              {message}
            </div>
          )}
        </form>
      </ComponentCard>
    </>
  );
}
