import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { BASE_URL } from "../../components/BaseUrl/config";
import Swal from "sweetalert2";

type Builder = {
  id: string;
  businessName: string;
  businessAddress?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  config?: { leadDays?: number } | null;
};

export default function EditBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [builder, setBuilder] = useState<Builder | null>(null);

  // form
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [leadDays, setLeadDays] = useState<number | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}builders/${id}`);
        const data = res.data;
        const b: Builder = data?.data ?? data;
        setBuilder(b);
        setBusinessName(b.businessName ?? "");
        setBusinessAddress(b.businessAddress ?? "");
        setContactEmail(b.contactEmail ?? "");
        setContactPhone(b.contactPhone ?? "");
        setLeadDays(b.config?.leadDays ?? "");
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to load builder", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const clearError = (k: string) =>
    setErrors((s) => {
      const c = { ...s };
      delete c[k];
      return c;
    });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!businessName.trim()) e.businessName = "Business name is required.";
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
      e.contactEmail = "Invalid email.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    if (!id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token") ?? "";
      const payload = {
        businessName: businessName.trim(),
        businessAddress: businessAddress.trim() || null,
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
        config: leadDays === "" ? null : { leadDays: Number(leadDays) },
      };
      await axios.put(`${BASE_URL}builders/${id}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      Swal.fire("Updated", "Builder updated", "success");
      navigate("/builders");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update builder", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!id) return null;

  return (
    <>
      <PageBreadcrumb pageTitle="Edit Builder" />
      <ComponentCard title="Update builder">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>
              Business Name <span className="text-red-600">*</span>
            </Label>
            <Input
              value={businessName}
              onChange={(e) => {
                clearError("businessName");
                setBusinessName(e.target.value);
              }}
            />
            {errors.businessName && (
              <p className="text-red-600 text-sm">{errors.businessName}</p>
            )}
          </div>

          <div>
            <Label>Business Address</Label>
            <textarea
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              className="w-full rounded-md border p-2"
              rows={3}
            />
          </div>

          <div>
            <Label>Contact Email</Label>
            <Input
              value={contactEmail}
              onChange={(e) => {
                clearError("contactEmail");
                setContactEmail(e.target.value);
              }}
            />
            {errors.contactEmail && (
              <p className="text-red-600 text-sm">{errors.contactEmail}</p>
            )}
          </div>

          <div>
            <Label>Contact Phone</Label>
            <Input
              value={contactPhone}
              placeholder="+61XXXXXXXXXX"
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>

          <div>
            <Label>Lead Days</Label>
            <Input
              type="number"
              value={leadDays}
              onChange={(e) =>
                setLeadDays(
                  e.target.value === ""
                    ? ""
                    : Math.max(0, Number(e.target.value))
                )
              }
            />
          </div>

          <div className="flex gap-3">
            <button
              className="px-6 py-2 bg-green-600 text-white rounded"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/builders")}
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
