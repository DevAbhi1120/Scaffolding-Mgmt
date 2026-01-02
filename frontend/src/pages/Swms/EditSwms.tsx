import { useEffect, useState } from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import FileInput from "../../components/form/input/FileInput";
import api from "../../api/axios";
import { BASE_URL, BASE_IMAGE_URL } from "../../components/BaseUrl/config";
import { DownloadIcon, TrashBinIcon } from "../../icons";

type SwmsEntity = {
  id: string;
  orderId?: string | null;
  submittedBy?: string | null;
  swmsData?: any;
  highRiskTasks?: { name: string; highRisk?: boolean }[];
  attachments?: string[] | null;
  editableByAdmin?: boolean;
  createdAt?: string;
};

export default function EditSwms() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<
    { id: string; startDate?: string; notes?: string }[]
  >([]);
  const [entity, setEntity] = useState<SwmsEntity | null>(null);

  // form fields mapped to swmsData
  const [orderId, setOrderId] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");
  const [type, setType] = useState<"Pre" | "Post">("Pre");
  const [dateOfCheck, setDateOfCheck] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // tasks and attachments
  const [tasks, setTasks] = useState<{ name: string; highRisk?: boolean }[]>(
    []
  );
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // build file URL helper (works with absolute, /uploads/... and BASE_IMAGE_URL keys)
  const buildFileUrl = (key: string) => {
    if (!key) return "";
    if (key.startsWith("http://") || key.startsWith("https://")) return key;
    if (key.startsWith("/")) return `${window.location.origin}${key}`;
    if (BASE_IMAGE_URL)
      return `${BASE_IMAGE_URL.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
    return `${BASE_URL.replace(/\/$/, "")}/files/download/${encodeURIComponent(
      key
    )}`;
  };

  useEffect(() => {
    // load orders for select
    const fetchOrders = async () => {
      try {
        const res = await api.get("orders");
        const list = res.data?.items ?? res.data ?? [];
        setOrders(list);
      } catch (err) {
        console.error("Failed loading orders", err);
        setOrders([]);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`swms/${id}`);
        const data: SwmsEntity = res.data;
        setEntity(data);

        // map swmsData fields
        const fd = data.swmsData ?? {};
        setOrderId(data.orderId ?? "");
        setProjectName(fd.projectName ?? fd.project_name ?? "");
        setType((fd.type ?? "Pre") as "Pre" | "Post");
        setDateOfCheck(
          fd.dateOfCheck ?? (data.createdAt ? data.createdAt.split("T")[0] : "")
        );
        setNotes(fd.notes ?? "");
        setTasks(Array.isArray(data.highRiskTasks) ? data.highRiskTasks : []);
        setExistingAttachments(data.attachments ?? []);
      } catch (err: any) {
        console.error("Failed loading SWMS", err);
        Swal.fire(
          "Error",
          err?.response?.data?.message ?? "Failed to load SWMS",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // previews for new files
  useEffect(() => {
    const urls = newFiles.map((f) => URL.createObjectURL(f));
    setFilePreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [newFiles]);

  const handleNewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    setNewFiles((prev) => [...prev, ...selected].slice(0, 20));
  };

  const removeExistingAttachment = (key: string) => {
    setExistingAttachments((prev) => prev.filter((p) => p !== key));
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addTask = () => setTasks((p) => [...p, { name: "", highRisk: false }]);
  const updateTask = (
    idx: number,
    value: Partial<{ name: string; highRisk?: boolean }>
  ) => setTasks((p) => p.map((t, i) => (i === idx ? { ...t, ...value } : t)));
  const removeTask = (idx: number) =>
    setTasks((p) => p.filter((_, i) => i !== idx));

  // upload helper: POST /uploads -> expects { url | filename | path } in response
  const uploadOne = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post("uploads", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const d = res.data ?? {};
    return d.url ?? d.filename ?? d.path ?? null;
  };

  const validate = () => {
    if (!orderId) return "Order is required";
    if (!projectName) return "Project name is required";
    if (!dateOfCheck) return "Date is required";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errMsg = validate();
    if (errMsg) {
      Swal.fire("Validation", errMsg, "warning");
      return;
    }

    setLoading(true);
    try {
      // upload new files first
      const uploaded: string[] = [];
      for (const f of newFiles) {
        try {
          const url = await uploadOne(f);
          if (url) uploaded.push(url);
        } catch (uploadErr) {
          console.warn("Upload failed for", f.name, uploadErr);
        }
      }

      const finalAttachments = [...existingAttachments, ...uploaded];

      const payload = {
        orderId: orderId || undefined,
        submittedBy: entity?.submittedBy ?? undefined,
        formData: {
          projectName,
          type,
          dateOfCheck,
          notes,
        },
        tasks, // will map to highRiskTasks in backend if you want; backend expects highRiskTasks (we'll send as tasks and backend will accept)
        attachments: finalAttachments,
      };

      await api.put(`swms/${id}`, payload);

      Swal.fire("Saved", "SWMS updated successfully.", "success");
      navigate("/swms");
    } catch (err: any) {
      console.error("Update failed", err);
      Swal.fire(
        "Error",
        err?.response?.data?.message ?? "Update failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Edit SWMS" />
      <ComponentCard title="Update SWMS">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    {o.startDate
                      ? ` • ${new Date(o.startDate).toLocaleDateString()}`
                      : ""}
                    {o.notes ? ` • ${o.notes}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Project Name</Label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>

            <div>
              <Label>Date of Check</Label>
              <Flatpickr
                value={dateOfCheck ? new Date(dateOfCheck) : undefined}
                options={{ dateFormat: "Y-m-d" }}
                onChange={([d]) =>
                  setDateOfCheck(
                    d ? (d as Date).toISOString().slice(0, 10) : ""
                  )
                }
                className="w-full border rounded p-2"
                required
              />
            </div>
          </div>

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

          <div>
            <Label>Tasks (mark high-risk where applicable)</Label>
            <div className="space-y-2">
              {tasks.map((t, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className="flex-1 border rounded p-2"
                    value={t.name}
                    onChange={(e) => updateTask(i, { name: e.target.value })}
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!t.highRisk}
                      onChange={(e) =>
                        updateTask(i, { highRisk: e.target.checked })
                      }
                    />
                    <span>High risk</span>
                  </label>
                  <button
                    type="button"
                    className="text-red-600"
                    onClick={() => removeTask(i)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div>
                <button
                  type="button"
                  onClick={addTask}
                  className="px-3 py-1 border rounded"
                >
                  + Add task
                </button>
              </div>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded p-2"
              rows={3}
            />
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
                    className="border rounded overflow-hidden bg-gray-50"
                  >
                    {/\.(jpe?g|png|gif)$/i.test(key) ? (
                      <img
                        src={buildFileUrl(key)}
                        alt="attachment"
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center bg-gray-200 text-gray-600">
                        File
                      </div>
                    )}
                    <div className="p-2 flex justify-between items-center bg-white">
                      <a
                        href={buildFileUrl(key)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 flex items-center gap-1"
                      >
                        <DownloadIcon className="w-4 h-4" /> Open
                      </a>
                      <button
                        type="button"
                        onClick={() => removeExistingAttachment(key)}
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
            <Label>Add New Attachments</Label>
            <FileInput
              onChange={handleNewFiles}
              multiple
              accept="image/*,.pdf"
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
                      onClick={() => removeNewFile(i)}
                      className="absolute top-1 right-1 bg-white p-1 rounded text-red-600"
                    >
                      ✕
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
              className="px-6 py-2 bg-blue-600 text-white rounded"
            >
              {loading ? "Updating..." : "Update SWMS"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/swms")}
              className="px-6 py-2 border rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
