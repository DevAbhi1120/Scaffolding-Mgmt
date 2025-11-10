import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import UserMetaCard from "../../components/UserProfile/UserMetaCard";
import UserInfoCard from "../../components/UserProfile/UserInfoCard";
import UserAddressCard from "../../components/UserProfile/UserAddressCard";
import PageMeta from "../../components/common/PageMeta";


interface RoleLabels {
  [key: string]: string;
}

const roleLabels: RoleLabels = {
  super_admin: "Super Admin",
  admin: "Admin",
  user: "Team Member",
};




export default function EditProfiles() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  console.log("userdata", user );



  if (loading) return <div className="p-5 text-gray-700">Loading user...</div>;
  if (!user) return <div className="p-5 text-red-500">User not found.</div>;

  return (
    <>
      <PageMeta
        title="Edit Profile | Scaffolding Management"
        description="Edit User Profile"
      />
      <PageBreadcrumb pageTitle="Edit Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
           <UserMetaCard user={user} /> 
           <UserInfoCard user={user} />
           <UserAddressCard user={user} /> 
        </div>
      </div>
    </>
  );
}

