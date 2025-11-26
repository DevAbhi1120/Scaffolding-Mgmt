import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

import Label from "../../components/form/Label";
import Select, { OptionTypeBase } from "react-select";
import Flatpickr from "react-flatpickr";
import { BASE_URL } from "../../components/BaseUrl/config";

type Product = {
  id: string;
  name: string;
  stockQuantity?: number;
  price?: string | number;
  [k: string]: any;
};

type Builder = {
  id: string;
  businessName: string;
  [k: string]: any;
};

export default function AddOrder() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [products, setProducts] = useState<Product[]>([]);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    builderId: "" as string,
    user_name: "",
    user_email: "",
    user_phonenumber: "",
    user_address: "",
    order_date: "",
    notes: "",
    status: "DRAFT",
  });

  const [orderItems, setOrderItems] = useState<
    {
      tempId: string;
      productId: string | null;
      productName?: string;
      availablePhysical: number;
      unitPrice: number;
      quantity: number;
      description?: string;
    }[]
  >([
    {
      tempId: String(Date.now()) + "-0",
      productId: null,
      productName: "",
      availablePhysical: 0,
      unitPrice: 0,
      quantity: 0,
      description: "",
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [productsRes, buildersRes] = await Promise.all([
          axios.get(`${BASE_URL}products`, { headers }),
          axios.get(`${BASE_URL}builders`, { headers }),
        ]);

        if (productsRes.status === 200) {
          setProducts(productsRes.data.items ?? []);
        }
        if (buildersRes.status === 200) {
          setBuilders(buildersRes.data.items ?? []);
        }
      } catch (err) {
        console.error("Error fetching data", err);
        Swal.fire("Error", "Failed to load products or builders", "error");
      }
    };

    fetchData();
  }, [token]);

  const clearError = (field: string) =>
    setErrors((prev) => {
      const c = { ...prev };
      delete c[field];
      return c;
    });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    clearError(name);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchInventorySummary = async (productId: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await axios.get(
        `${BASE_URL}inventories/summary/${productId}`,
        { headers }
      );
      return res.data as {
        productId: string;
        availablePhysical: number;
        stockBalance: number;
      };
    } catch (err) {
      console.warn("Failed to fetch inventory summary", err);
      return null;
    }
  };

  const handleProductChange = async (option: any, index: number) => {
    clearError("products");
    const updated = [...orderItems];
    if (!option) {
      updated[index] = {
        ...updated[index],
        productId: null,
        productName: "",
        availablePhysical: 0,
        unitPrice: 0,
        quantity: 0,
      };
      setOrderItems(updated);
      return;
    }

    // fetch inventory summary for accurate availablePhysical
    const summary = await fetchInventorySummary(option.value);

    updated[index] = {
      ...updated[index],
      productId: option.value,
      productName: option.label,
      availablePhysical: summary
        ? summary.availablePhysical
        : option.stockQuantity ?? 0,
      unitPrice: Number(option.price ?? 0),
      quantity: 0,
    };

    setOrderItems(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    setOrderItems((prev) => {
      const copy = [...prev];
      if (qty < 0) qty = 0;
      if (qty > copy[index].availablePhysical) {
        Swal.fire(
          "Error",
          "Order quantity cannot exceed available stock",
          "error"
        );
        return prev;
      }
      copy[index] = { ...copy[index], quantity: qty };
      return copy;
    });
  };

  const handleDescriptionChange = (index: number, value: string) => {
    setOrderItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], description: value };
      return copy;
    });
  };

  const addMoreItem = () => {
    setOrderItems((prev) => [
      ...prev,
      {
        tempId: String(Date.now()) + "-" + prev.length,
        productId: null,
        productName: "",
        availablePhysical: 0,
        unitPrice: 0,
        quantity: 0,
        description: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.order_date) newErrors.order_date = "Order date is required.";
    const validItems = orderItems.filter(
      (it) => it.productId && it.quantity > 0
    );
    if (validItems.length === 0)
      newErrors.products = "At least one product with quantity is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const orderTotal = orderItems.reduce(
    (acc, r) => acc + (r.unitPrice ?? 0) * (r.quantity ?? 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      // Pre-check availability using inventory summary endpoints
      const checks = orderItems
        .filter((it) => it.productId && it.quantity > 0)
        .map((it) => fetchInventorySummary(it.productId as string));

      const results = await Promise.all(checks);

      for (let i = 0; i < results.length; i++) {
        const summary = results[i];
        const requested = orderItems.filter(
          (it) => it.productId && it.quantity > 0
        )[i].quantity;
        if (
          !summary ||
          (summary.availablePhysical < requested &&
            summary.stockBalance < requested)
        ) {
          Swal.fire(
            "Error",
            `Insufficient stock for product ${
              summary?.productId ?? "unknown"
            }. Available: ${
              summary
                ? summary.availablePhysical ?? summary.stockBalance
                : "unknown"
            }`,
            "error"
          );
          setLoading(false);
          return;
        }
      }

      // Build payload (backend expects productId, quantity, unitPrice optional)
      const payload = {
        builderId: formData.builderId || undefined,
        startDate: formData.order_date || undefined,
        notes: formData.notes || undefined,
        items: orderItems
          .filter((it) => it.productId && it.quantity > 0)
          .map((it) => ({
            productId: it.productId,
            quantity: Number(it.quantity),
            unitPrice: it.unitPrice || undefined,
            description: it.description || undefined,
          })),
      };

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${BASE_URL}orders`, payload, { headers });

      if (res.status === 200 || res.status === 201) {
        Swal.fire("Success", "Order created successfully", "success");
        navigate("/order-list");
      } else {
        Swal.fire(
          "Error",
          res.data?.message || "Failed to create order",
          "error"
        );
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire(
        "Error",
        err?.response?.data?.message || "Failed to create order",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const builderOptions = builders.map((b) => ({
    label: b.businessName ?? b.contactEmail ?? b.id,
    value: b.id,
  }));
  const productOptions = products.map((p) => ({
    label: p.name,
    value: p.id,
    stockQuantity: Number(p.stockQuantity ?? 0),
    price: p.price ?? 0,
  }));

  return (
    <>
      <PageMeta title="Add Order" />
      <PageBreadcrumb title="Add Order" subName="Orders" />

      <ComponentCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Builder (optional)</Label>
              <Select
                options={builderOptions}
                onChange={(s) =>
                  setFormData((p) => ({
                    ...p,
                    builderId: (s as any)?.value ?? "",
                  }))
                }
                value={
                  builderOptions.find((o) => o.value === formData.builderId) ??
                  null
                }
                isClearable
                placeholder="Select builder..."
              />
            </div>

            <div>
              <Label>Order Date *</Label>
              <Flatpickr
                value={
                  formData.order_date ? new Date(formData.order_date) : null
                }
                options={{ dateFormat: "Y-m-d" }}
                onChange={(dates) => {
                  const d = dates?.[0];
                  const iso = d ? d.toISOString().slice(0, 10) : "";
                  setFormData((p) => ({ ...p, order_date: iso }));
                }}
                className="border rounded p-2 w-full"
              />
              {errors.order_date && (
                <p className="text-red-600 text-sm">{errors.order_date}</p>
              )}
            </div>

            <div>
              <Label>User Name</Label>
              <input
                type="text"
                name="user_name"
                value={formData.user_name}
                onChange={handleChange}
                className="border rounded p-2 w-full"
              />
            </div>

            <div>
              <Label>User Email</Label>
              <input
                type="email"
                name="user_email"
                value={formData.user_email}
                onChange={handleChange}
                className="border rounded p-2 w-full"
              />
            </div>

            <div>
              <Label>User Phone</Label>
              <input
                type="text"
                name="user_phonenumber"
                value={formData.user_phonenumber}
                onChange={handleChange}
                className="border rounded p-2 w-full"
              />
            </div>

            <div>
              <Label>User Address</Label>
              <textarea
                name="user_address"
                value={formData.user_address}
                onChange={handleChange}
                className="border rounded p-2 w-full"
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <Label>Status</Label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="border rounded p-2 w-full"
            >
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <Label>Products *</Label>
            {orderItems.map((row, idx) => (
              <div
                key={row.tempId}
                className="border rounded-lg p-4 mb-3 shadow-sm"
              >
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6">
                    <Label>Product</Label>
                    <Select
                      options={productOptions.map((o) => ({
                        label: `${o.label} (${o.stockQuantity} reported)`,
                        value: o.value,
                        price: o.price,
                      }))}
                      value={
                        row.productId
                          ? {
                              label: `${row.productName} (${row.availablePhysical})`,
                              value: row.productId,
                            }
                          : null
                      }
                      onChange={(opt) => handleProductChange(opt as any, idx)}
                      isClearable
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Available: {row.availablePhysical}
                    </p>
                  </div>

                  <div className="col-span-3">
                    <Label>Quantity *</Label>
                    <input
                      type="number"
                      min={0}
                      value={row.quantity || ""}
                      onChange={(e) =>
                        handleQtyChange(idx, Number(e.target.value || 0))
                      }
                      className="border rounded p-2 w-full"
                    />
                  </div>

                  <div className="col-span-3">
                    <Label>Line Total</Label>
                    <div className="p-2 border rounded h-full flex items-center">
                      <strong>
                        {((row.unitPrice || 0) * (row.quantity || 0)).toFixed(
                          2
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="col-span-12 mt-2">
                    <Label>Item Notes (optional)</Label>
                    <input
                      type="text"
                      value={row.description || ""}
                      onChange={(e) =>
                        handleDescriptionChange(idx, e.target.value)
                      }
                      className="border rounded p-2 w-full"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <div />
                  <div>
                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-red-600 hover:underline mr-3"
                      >
                        Remove
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setOrderItems((prev) => {
                          const copy = [...prev];
                          copy.splice(idx + 1, 0, {
                            tempId:
                              String(Date.now()) +
                              "-" +
                              Math.random().toString(36).slice(2, 8),
                            productId: null,
                            productName: "",
                            availablePhysical: 0,
                            unitPrice: 0,
                            quantity: 0,
                            description: "",
                          });
                          return copy;
                        });
                      }}
                      className="px-3 py-1 bg-gray-200 rounded"
                    >
                      + Insert Row
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={addMoreItem}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Add More
              </button>

              <div className="ml-auto p-2">
                <div className="text-sm">Order Total</div>
                <div className="text-lg font-bold">{orderTotal.toFixed(2)}</div>
              </div>
            </div>

            {errors.products && (
              <p className="text-red-600 text-sm mt-2">{errors.products}</p>
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {loading ? "Saving..." : "Save Order"}
            </button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
