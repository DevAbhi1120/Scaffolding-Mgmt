// src/pages/UserProfiles.tsx (or wherever this lives)
import { useEffect, useState } from "react";
import axios from "axios";

import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";
import { BASE_URL } from "../components/BaseUrl/config";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  profile_image?: string | null;
  status?: number;
  // add any extra fields that UserMetaCard / UserInfoCard / UserAddressCard expect
}

export default function UserProfiles() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLoggedInUser = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        setErrorMsg("No logged-in user information found.");
        setLoading(false);
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      const userId = parsedUser?.id;

      if (!userId) {
        setErrorMsg("User ID missing from stored user data.");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");

      const res = await axios.get(`${BASE_URL}users/${userId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      // backend returns { user: ... }
      setUser(res.data.user);
    } catch (error) {
      console.error("Failed to fetch logged-in user:", error);
      setErrorMsg("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoggedInUser();
  }, []);

  if (loading) {
    return (
      <>
        <PageMeta
          title="Profile | Scaffolding Management"
          description="Profile page"
        />
        <PageBreadcrumb pageTitle="Profile" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <p className="text-gray-700 dark:text-gray-300">Loading profile...</p>
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
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
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
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          {/* All three now receive the logged-in user */}
          <UserMetaCard user={user} />
          <UserInfoCard user={user} />
          <UserAddressCard user={user} />
        </div>
      </div>
    </>
  );
}
