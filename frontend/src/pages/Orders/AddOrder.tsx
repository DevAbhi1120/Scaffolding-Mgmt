import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

import Label from "../../components/form/Label";
import Select from "react-select";
import Flatpickr from "react-flatpickr";

export default function AddOrder() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    user_name: "",
    user_email: "",
    user_phonenumber: "",
    user_address: "",
    order_date: "",
    notes: "",
    status: "DRAFT",
  });

  const [orderItems, setOrderItems] = useState<
    { product_id: number; product_name: string; stock_quantity: number; price: string; order_qty: number }[]
  >([{ product_id: 0, product_name: "", stock_quantity: 0, price: 0, order_qty: 0 }]);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const [productsRes, inventoriesRes] = await Promise.all([
        axios.get("http://localhost:5000/api/products", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/inventories", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (productsRes.data.success && inventoriesRes.data.success) {
        const inventoriesMap: Record<string, number> = {};
        inventoriesRes.data.data.forEach((inv: any) => {
          inventoriesMap[inv.product_id] = inv.stock_in; 
          console.log(inv.stock_in, "inventoriesRes");
        });

        const options = productsRes.data.products.map((p: any) => ({
          value: p.id,
          label: p.name,
          price: p.price,
          // stock_quantity => inventory ka stock_in
          stock_quantity: inventoriesMap[p.id] || 0,
        }));

        setProducts(options);
      }
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  fetchData();
}, [token]);

  const handleProductChange = (selected, index) => {
    const updatedItems = [...orderItems];

    updatedItems[index] = {
      ...updatedItems[index],
      product_id: selected?.value || null,
      stock_quantity: selected?.stock_quantity || 0, // naya product ka stock
      price: selected?.price || 0,
      order_qty: 0, 
    };
    setOrderItems(updatedItems);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    clearError(name);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.order_date) newErrors.order_date = "Order date is required.";
    if (orderItems.filter((i) => i.product_id && i.order_qty > 0).length === 0) {
      newErrors.products = "At least one product is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle order qty
  const handleOrderQtyChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const updatedItems = [...orderItems];
    updatedItems[index].order_qty = parseInt(e.target.value, 10) || 0;
    setOrderItems(updatedItems);
  };

  // Add new product row
  const addMoreItem = () => {
    setOrderItems([
      ...orderItems,
      { product_id: 0, product_name: "", stock_quantity: 0, price: 0, order_qty: 0 },
    ]);
  };

  // Remove product row
  const removeItem = (index: number) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);
  };

  // Submit order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        items: orderItems
          .filter((item) => item.product_id && item.order_qty > 0)
          .map((item) => ({
            product_id: item.product_id,
            qty: item.order_qty,
          })),
      };

      await axios.post("http://localhost:5000/api/orders", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire("Success", "Order created successfully!", "success");
      navigate("/order-list");
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to create order", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Add Order" />
      <PageBreadcrumb title="Add Order" subName="Orders" />

      <ComponentCard>
        <form onSubmit={handleSubmit} className="space-y-6">
         <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>User Name *</Label>
              <input
                type="text"
                name="user_name"
                value={formData.user_name}
                onChange={handleChange}
                className="border rounded p-2 w-full text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                required
              />
            </div>

            <div>
              <Label>User Email *</Label>
              <input
                type="email"
                name="user_email"
                value={formData.user_email}
                onChange={handleChange}
                className="border rounded p-2 w-full text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                required
              />
            </div>

            <div>
              <Label>User Phone Number *</Label>
              <input
                type="text"
                name="user_phonenumber"
                value={formData.user_phonenumber}
                onChange={handleChange}
                className="border rounded p-2 w-full text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                required
              />
            </div>

            <div>
              <Label>User Address *</Label>
              <textarea
                name="user_address"
                value={formData.user_address}
                onChange={handleChange}
                className="border rounded p-2 w-full text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                required
              />
            </div>
          </div>

          {/* Order Date */}
          <div>
            <Label>Order Date *</Label>
            <Flatpickr
              value={formData.order_date}
              options={{ dateFormat: "d-m-Y" }} 
              onChange={(selectedDates) => {
                const date = selectedDates[0] 
                  ? selectedDates[0].toISOString().slice(0, 10) 
                  : "";
                handleChange({ target: { name: "order_date", value: date } });
              }}
              className="border rounded p-2 w-full text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
            />
            {errors.order_date && <p className="text-red-600 text-sm">{errors.order_date}</p>}
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="border rounded p-2 w-full text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
            >
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Products */}
          <div>
            <Label>Add Products *</Label>
            {orderItems.map((item, index) => (
              <div key={index}
                className="border rounded-lg p-4 mb-3 shadow-sm"
              >
                <div className="grid grid-cols-12 gap-4">
                  {/* Product Select */}
                 
                  {/* <div className="col-span-6">
                    <Label>Products</Label>
                    {(() => {
                      const selectedProduct = products.find(
                        (p) => p.value.toString() === item.product_id.toString()
                      );
                      return (
                        <>
                          <Select
                            options={products}
                            value={selectedProduct || null}
                            onChange={(selected) => handleProductChange(selected, index)}
                            placeholder="Select a product..."
                          />
                          {selectedProduct?.stock_quantity > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              Available stock: {selectedProduct.stock_quantity}
                            </p>
                          )}
                          {selectedProduct?.price > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              Product Price: {selectedProduct.price}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div> */}

                  <div className="col-span-6">
                    <Label>Products</Label>
                    {(() => {
                      // already selected product IDs except current index
                      const selectedIds = orderItems
                        .filter((_, i) => i !== index)
                        .map((item) => item.product_id);

                      // available products for this row
                      const availableProducts = products.filter(
                        (p) => !selectedIds.includes(p.value)
                      );

                      const selectedProduct = products.find(
                        (p) => p.value === item.product_id
                      );

                      return (
                        <>
                          <Select
                            options={availableProducts}
                            value={selectedProduct || null}
                            onChange={(selected) => handleProductChange(selected, index)}
                            placeholder="Select a product..."
                          />
                          {selectedProduct?.stock_quantity > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              Available stock: {selectedProduct.stock_quantity}
                            </p>
                          )}
                          {selectedProduct?.price > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              Product Price: {selectedProduct.price}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  {/* Order Quantity */}
                  <div className="col-span-6">
                    <Label>Order Quantity *</Label>
                    <input
                      type="number"
                      min="1"
                      value={item.order_qty || ""}
                      onChange={(e) => {
                        const qty = Number(e.target.value);

                        if (qty > item.stock_quantity + (item.order_qty || 0)) {
                          Swal.fire("Error", "Order quantity cannot exceed stock", "error");
                        } else {
                          const updatedItems = [...orderItems];

                          // pehle purana qty wapas add karo
                          const restoredStock =
                            (updatedItems[index].stock_quantity || 0) +
                            (updatedItems[index].order_qty || 0);

                          // fir naya qty minus karo
                          updatedItems[index].order_qty = qty;
                          updatedItems[index].stock_quantity = restoredStock - qty;

                          setOrderItems(updatedItems);
                        }
                      }}
                      className="border rounded p-2 w-full text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>

                {orderItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="mt-3 text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>

            ))}

            <button
              type="button"
              onClick={addMoreItem}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + Add More
            </button>
            {errors.products && <p className="text-red-600 text-sm">{errors.products}</p>}
          </div>

          {/* Submit */}
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
