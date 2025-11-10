import { useEffect, useState } from "react";
import {useNavigate } from "react-router-dom"; // ✅ fix import
import axios from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Swal from "sweetalert2";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table/";
import Badge from "../../components/ui/badge/Badge";
import { TrashBinIcon, PencilIcon } from "../../icons";

// Define the User interface based on API response
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  profile_image: string | null;
  status: number;
}
  interface RoleLabels {
    super_admin: string;
    admin: string;
    user: string;
  }

  const roleLabels: RoleLabels = {
    super_admin: "Super Admin",
    admin: "Admin",
    user: "Team Member",
  };



export default function UserList() {
  const navigate = useNavigate(); // ✅ for redirect
  const [users, setUsers] = useState<User[]>([]);




  const handleEdit = (id: number) => {
    navigate(`/edit-user/${id}`);
  };


const handleDelete = async (id: number) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This action cannot be undone!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  });

  if (result.isConfirmed) {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`http://localhost:5000/api/users/${id}/delete`, {
        method: "PUT", 
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete user.");
      }

      await Swal.fire("Deleted!", "User has been deleted.", "success");
         // 🔁 Update local state without refetch
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));

      // Optional: Refresh list or remove user from state
    } catch (error) {
      console.error("Delete error:", error);
      Swal.fire("Error!", "Something went wrong.", "error");
    }
  }
};


  useEffect(() => {
    const fetchUsers = async () => {

      try {
        const token = localStorage.getItem("token");

        console.log("usertoken",token);
        const res = await axios.get("http://localhost:5000/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.success) {
          setUsers(res.data.users);
        }
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <>
      <PageMeta
        title="User List | Scaffolding Management"
        description="All User"
      />
      <PageBreadcrumb pageTitle="User List" />
      <div className="space-y-6">
        <ComponentCard title="User List">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      User
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Email
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Phone
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Actions
                    </TableCell>

                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-200">
                            <img
                              width={40}
                              height={40}
                              src={
                                user.profile_image
                                  ? user.profile_image
                                  : "/images/user/owner.jpg"
                              }
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {user.name}
                            </span>
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                             {roleLabels[user.role as keyof RoleLabels] || user.role}

                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {user.email}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {user.phone}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <Badge
                          size="sm"
                          color={
                            user.status === 1
                              ? "success"
                              : user.status === 0
                              ? "error"
                              : "warning"
                          }
                        >
                          {user.status === 1 ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                          <div className="flex items-center gap-3">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEdit(user.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <TrashBinIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
