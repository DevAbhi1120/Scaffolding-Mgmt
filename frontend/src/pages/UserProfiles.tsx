// src/pages/UserProfiles.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";
import { getUser, getToken, clearAuth } from "../auth/auth";

export default function UserProfiles() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchLoggedInUser = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const storedUser = getUser();
      const token = getToken();

      if (!token || !storedUser) {

        clearAuth();
        navigate("/login");
        return;
      }

      const userId = storedUser?.id;
      if (!userId) {
        setErrorMsg("User ID missing from stored user data.");
        setLoading(false);
        return;
      }

      const res = await api.get(`users/${userId}`);
      // controller returns { user } or service may return sanitized user directly
      const u = res.data.user ?? res.data;
      setUser(u);
    } catch (error: any) {
      console.error("Failed to fetch logged-in user:", error);
      // if 401 -> token invalid: redirect to login
      if (error?.response?.status === 401) {
        clearAuth();
        navigate("/login");
        return;
      }
      setErrorMsg("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoggedInUser();
    // optionally re-fetch when token/user changes elsewhere in app
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <>
        <PageMeta
          title="Profile | Scaffolding Management"
          description="Profile page"
        />
        <PageBreadcrumb pageTitle="Profile" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
          <p className="text-gray-700">Loading profile...</p>
        </div>
      </>
    );
  }

  if (errorMsg || !user) {
    return (
      <>
        <PageMeta
          title="Profile | Scaffolding Management"
          description="Profile page"
        />
        <PageBreadcrumb pageTitle="Profile" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
          <p className="text-red-500">
            {errorMsg || "User not found or could not be loaded."}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Profile | Scaffolding Management"
        description="Edit logged-in user profile"
      />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <UserMetaCard user={user} onUpdated={fetchLoggedInUser} />
          <UserInfoCard user={user} onUpdated={fetchLoggedInUser} />
          <UserAddressCard user={user} onUpdated={fetchLoggedInUser} />
        </div>
      </div>
    </>
  );
}
