// src/pages/swms/AddSwms.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";
import Swal from "sweetalert2";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import api from "../../api/axios";
import axios from "axios";

type OrderOption = {
  id: string;
  builderId?: string;
  startDate?: string;
  notes?: string;
};

export default function AddSwms() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [orderId, setOrderId] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");
  const [type, setType] = useState<"Pre" | "Post">("Pre");
  const [dateOfCheck, setDateOfCheck] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // checklist items -> become tasks
  const checklistTemplate = [
    { key: "erect_scaffold", label: "Erect scaffold", highRisk: true },
    { key: "inspection_done", label: "Inspection done", highRisk: false },
    { key: "area_cleared", label: "Work area cleared", highRisk: false },
    { key: "equipment_checked", label: "Equipment checked", highRisk: false },
  ];
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  // load orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("orders");
        const items = res.data?.items ?? res.data ?? [];
        setOrders(items);
      } catch (err) {
        console.error("Failed to fetch orders", err);
        setOrders([]);
      }
    };
    fetchOrders();
  }, []);

  // file preview urls
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setFilePreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const toggleChecklist = (key: string) =>
    setChecklist((p) => ({ ...p, [key]: !p[key] }));

  const clearError = (k: string) =>
    setErrors((p) => {
      const n = { ...p };
      delete n[k];
      return n;
    });

  const handleFileChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const selected = ev.target.files ? Array.from(ev.target.files) : [];
    setFiles((prev) => [...prev, ...selected].slice(0, 20)); // cap 20 files
  };
  const removeFile = (i: number) =>
    setFiles((prev) => prev.filter((_, idx) => idx !== i));

  // helper upload single file -> returns url/filename or null
  const uploadOne = async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      // use api (attaches auth) if available, otherwise fallback to axios with BASE_URL set inside api
      const client = api ?? axios;
      const res = await client.post("uploads", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const d = res.data ?? {};
      return d.url ?? d.filename ?? d.path ?? null;
    } catch (e) {
      console.warn("Upload failed:", file.name, e);
      return null;
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!orderId) e.orderId = "Select related order.";
    if (!projectName) e.projectName = "Project Name is required.";
    if (!dateOfCheck) e.dateOfCheck = "Date of check is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErrors({});
    if (!validate()) return;

    setLoading(true);
    try {
      // build formData object to store as swmsData
      const swmsFormData = {
        projectName,
        type,
        dateOfCheck,
        notes,
      };

      // tasks: convert checklist items into tasks array
      const tasks = checklistTemplate
        .filter((t) => checklist[t.key])
        .map((t) => ({ name: t.label, highRisk: !!t.highRisk }));

      // submittedBy: try to get logged-in user id from localStorage.user
      const storedUser = localStorage.getItem("user");
      const submittedBy =
        storedUser && JSON.parse(storedUser)?.id
          ? JSON.parse(storedUser).id
          : undefined;

      // upload attachments sequentially (best-effort). store returned urls/paths.
      const attachments: string[] = [];
      if (files.length > 0) {
        for (const f of files) {
          const uploaded = await uploadOne(f);
          if (uploaded) attachments.push(uploaded);
        }
        if (attachments.length < files.length) {
          Swal.fire(
            "Partial upload",
            "Some attachments failed to upload. The rest were attached.",
            "warning"
          );
        }
      }

      const payload = {
        orderId: orderId || undefined,
        submittedBy: submittedBy ?? undefined,
        formData: swmsFormData,
        tasks,
        attachments,
      };
      console.log(payload)
      // POST to /swms
      await api.post("swms", payload);

      Swal.fire("Saved", "SWMS submitted successfully", "success");
      navigate("/swms");
    } catch (err: any) {
      console.error("Failed to submit SWMS", err);
      const data = err?.response?.data;
      if (data?.errors && typeof data.errors === "object") {
        setErrors(data.errors);
      } else if (data?.message) {
        setErrors({ _global: data.message });
        Swal.fire("Error", data.message, "error");
      } else {
        setErrors({ _global: "Failed to submit SWMS" });
        Swal.fire("Error", "Failed to submit SWMS", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Add SWMS" subName="Safety" />
      <ComponentCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Related Order</Label>
            <select
              value={orderId}
              onChange={(e) => {
                setOrderId(e.target.value);
                clearError("orderId");
              }}
              className="w-full border rounded p-2"
            >
              <option value="">-- Select order --</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id}
                  {o.startDate
                    ? ` • ${new Date(o.startDate).toLocaleDateString()}`
                    : ""}
                  {o.notes ? ` • ${o.notes}` : ""}
                </option>
              ))}
            </select>
            {errors.orderId && (
              <p className="text-red-600 text-sm mt-1">{errors.orderId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Project Name</Label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  clearError("projectName");
                }}
                className="w-full border rounded p-2"
                required
              />
              {errors.projectName && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.projectName}
                </p>
              )}
            </div>

            <div>
              <Label>Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "Pre" | "Post")}
                className="w-full border rounded p-2"
              >
                <option value="Pre">Pre</option>
                <option value="Post">Post</option>
              </select>
            </div>

            <div>
              <Label>Date of Check</Label>
              <Flatpickr
                value={dateOfCheck}
                options={{ dateFormat: "Y-m-d" }}
                onChange={(dates) => {
                  const d =
                    dates && dates[0]
                      ? (dates[0] as Date).toISOString().slice(0, 10)
                      : "";
                  setDateOfCheck(d);
                  clearError("dateOfCheck");
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

          <div>
            <Label>Checklist Tasks</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {checklistTemplate.map((it) => (
                <label key={it.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!checklist[it.key]}
                    onChange={() => toggleChecklist(it.key)}
                  />
                  <span className="text-sm">
                    {it.label} {it.highRisk ? "(high risk)" : ""}
                  </span>
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

          <div>
            <Label>Attachments (optional)</Label>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleFileChange}
            />
            {filePreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {filePreviews.map((u, i) => (
                  <div
                    key={i}
                    className="relative border rounded overflow-hidden"
                  >
                    <img
                      src={u}
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

          {errors._global && (
            <div className="text-red-600 text-sm">{errors._global}</div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit SWMS"}
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
