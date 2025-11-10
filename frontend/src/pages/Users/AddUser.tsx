import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select.tsx";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import axios from "axios";

export default function AddUser() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const options = [
    { value: "user", label: "Team Member" },
    { value: "admin", label: "Admin" },
  ];

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, role: value });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const token = localStorage.getItem('token')
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          ...formData,
          phone: parseInt(formData.phone),
        },
        {
          headers: {
            "Content-Type": "application/json",
             Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        setMessage("✅ User created successfully!");
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          role: "",
        });
      } else {
        setMessage("❌ Failed to create user.");
      }
    } catch (error: any) {
      console.error("Error:", error);
      setMessage(error.response?.data?.message || "❌ Something went wrong.");
    } finally {
      setLoading(false);
    }

    console.log("token",token);
    console.log("message",message);

  };

  return (
    <>
      <PageBreadcrumb pageTitle="Add User" />

      <ComponentCard title="Fill input fields">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              type="text"
              id="name"
              placeholder="Full name"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>


          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              placeholder="info@example.com"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              type="tel"
              id="phone"
              placeholder="1234567890"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label>User Role</Label>
            <Select
              options={options}
              placeholder="Select an option"
              onChange={handleSelectChange}
              className="dark:bg-dark-900"
            />
          </div>

          <div>
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleInputChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30"
              >
                {showPassword ? (
                  <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                ) : (
                  <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>

          {message && <p className="text-sm text-red-500">{message}</p>}
        </form>
      </ComponentCard>
    </>
  );
}
