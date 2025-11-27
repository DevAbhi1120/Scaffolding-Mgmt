import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link } from "react-router";
import { Bell } from "lucide-react";

const notifications = [
  {
    id: 1,
    name: "Terry Franci",
    avatar: "/images/user/user-02.jpg",
    project: "Project - Nganter App",
    type: "success",
    time: "5 min ago",
  },
  {
    id: 2,
    name: "Alena Franci",
    avatar: "/images/user/user-03.jpg",
    project: "Project - Nganter App",
    type: "success",
    time: "8 min ago",
  },
  {
    id: 3,
    name: "Jocelyn Kenter",
    avatar: "/images/user/user-04.jpg",
    project: "Project - Nganter App",
    type: "success",
    time: "15 min ago",
  },
  {
    id: 4,
    name: "Brandon Philips",
    avatar: "/images/user/user-05.jpg",
    project: "Project - Nganter App",
    type: "error",
    time: "1 hr ago",
  },
  {
    id: 5,
    name: "Brandon Philips",
    avatar: "/images/user/user-05.jpg",
    project: "Project - Nganter App",
    type: "error",
    time: "1 hr ago",
  },
  {
    id: 6,
    name: "Brandon Philips",
    avatar: "/images/user/user-05.jpg",
    project: "Project - Nganter App",
    type: "error",
    time: "1 hr ago",
  },
  {
    id: 7,
    name: "Brandon Philips",
    avatar: "/images/user/user-05.jpg",
    project: "Project - Nganter App",
    type: "error",
    time: "1 hr ago",
  },
  {
    id: 8,
    name: "Brandon Philips",
    avatar: "/images/user/user-05.jpg",
    project: "Project - Nganter App",
    type: "error",
    time: "1 hr ago",
  },
];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);

  const handleClick = () => {
    setIsOpen(!isOpen);
    setNotifying(false);
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            !notifying ? "hidden" : "flex"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
         <Bell />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notification
          </h5>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {notifications.map((notif) => (
            <li key={notif.id}>
              <DropdownItem
                onItemClick={() => setIsOpen(false)}
                className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                to={notif.to}
              >
                <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                  <img
                    width={40}
                    height={40}
                    src={notif.avatar}
                    alt={notif.name}
                    className="w-full overflow-hidden rounded-full"
                  />
                  <span
                    className={`absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white ${
                      notif.type === "success"
                        ? "bg-success-500"
                        : "bg-error-500"
                    } dark:border-gray-900`}
                  ></span>
                </span>

                <span className="block">
                  <span className="mb-1.5 block space-x-1 text-theme-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {notif.name}
                    </span>
                    <span> requests permission to change </span>
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {notif.project}
                    </span>
                  </span>

                  <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                    <span>Project</span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span>{notif.time}</span>
                  </span>
                </span>
              </DropdownItem>
            </li>
          ))}
        </ul>

        <Link
          to="/"
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          View All Notifications
        </Link>
      </Dropdown>
    </div>
  );
}
