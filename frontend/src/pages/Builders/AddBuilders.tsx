import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { BASE_URL } from "../../components/BaseUrl/config";
import Swal from "sweetalert2";

type BuilderPayload = {
  businessName: string;
  businessAddress?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  config?: { leadDays?: number } | null;
};

export default function AddBuilder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [leadDays, setLeadDays] = useState<number | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (contactPhone && contactPhone.length < 6)
      e.contactPhone = "Invalid phone.";
    if (
      leadDays !== "" &&
      (Number(leadDays) < 0 || !Number.isFinite(Number(leadDays)))
    )
      e.leadDays = "Invalid lead days.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token") ?? "";
      const payload: BuilderPayload = {
        businessName: businessName.trim(),
        businessAddress: businessAddress.trim() || null,
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
        config: leadDays === "" ? null : { leadDays: Number(leadDays) },
      };

      await axios.post(`${BASE_URL}builders`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      Swal.fire("Success", "Builder created", "success");
      navigate("/builder-list");
    } catch (err: any) {
      console.error(err);
      Swal.fire(
        "Error",
        err?.response?.data?.message ?? "Failed to create builder",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Add Builder" />
      <ComponentCard title="Create new builder">
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
              placeholder="e.g. SkyHigh Constructions Ltd"
            />
            {errors.businessName && (
              <p className="text-red-600 text-sm mt-1">{errors.businessName}</p>
            )}
          </div>

          <div>
            <Label>Business Address</Label>
            <textarea
              value={businessAddress}
              onChange={(e) => {
                clearError("businessAddress");
                setBusinessAddress(e.target.value);
              }}
              className="w-full rounded-md border p-2"
              rows={3}
            />
            {errors.businessAddress && (
              <p className="text-red-600 text-sm mt-1">
                {errors.businessAddress}
              </p>
            )}
          </div>

          <div>
            <Label>Contact Email</Label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => {
                clearError("contactEmail");
                setContactEmail(e.target.value);
              }}
              placeholder="admin@company.com"
            />
            {errors.contactEmail && (
              <p className="text-red-600 text-sm mt-1">{errors.contactEmail}</p>
            )}
          </div>

          <div>
            <Label>Contact Phone</Label>
            <Input
              value={contactPhone}
              onChange={(e) => {
                clearError("contactPhone");
                setContactPhone(e.target.value);
              }}
              placeholder="+61XXXXXXXXX"
            />
            {errors.contactPhone && (
              <p className="text-red-600 text-sm mt-1">{errors.contactPhone}</p>
            )}
          </div>

          <div>
            <Label>Lead Days (optional)</Label>
            <Input
              type="number"
              value={leadDays}
              onChange={(e) => {
                clearError("leadDays");
                setLeadDays(
                  e.target.value === ""
                    ? ""
                    : Math.max(0, Number(e.target.value))
                );
              }}
            />
            {errors.leadDays && (
              <p className="text-red-600 text-sm mt-1">{errors.leadDays}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/builder-list")}
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
