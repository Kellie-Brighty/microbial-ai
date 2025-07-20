import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiMessageSquare,
  FiUsers,
  FiGift,
  FiMenu,
  FiX,
  FiLogOut,
  FiFileText,
} from "react-icons/fi";
import { GiDna1 } from "react-icons/gi";
import AgenNicky from "../../assets/microbial-profile.png";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("admin-sidebar");
      const hamburger = document.getElementById("sidebar-hamburger");

      if (
        isSidebarOpen &&
        sidebar &&
        hamburger &&
        !sidebar.contains(event.target as Node) &&
        !hamburger.contains(event.target as Node)
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    navigate("/admin");
  };

  const navItems = [
    {
      path: "/admin/activity",
      name: "Activity Dashboard",
      icon: <FiActivity />,
    },
    {
      path: "/admin/moderation",
      name: "Content Moderation",
      icon: <FiMessageSquare />,
    },
    {
      path: "/admin/communities",
      name: "Community Management",
      icon: <FiUsers />,
    },
    {
      path: "/admin/credits",
      name: "Credit Management",
      icon: <FiGift />,
    },
    {
      path: "/admin/applications",
      name: "Applications",
      icon: <FiFileText />,
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Admin Header */}
      <header className="bg-purple text-white z-20 shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button
              id="sidebar-hamburger"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md md:hidden"
            >
              {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
            <div className="flex items-center">
              <img
                src={AgenNicky}
                alt="Microbial Admin"
                className="w-9 h-9 rounded-full border-2 border-white mr-2"
              />
              <h1 className="text-xl font-bold flex items-center">
                Microbial
                <span className="ml-2 bg-white text-purple text-xs px-2 py-0.5 rounded-full">
                  ADMIN
                </span>
              </h1>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-white hover:text-red-200 transition-colors"
          >
            <FiLogOut className="mr-1" /> Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          id="admin-sidebar"
          className={`bg-white shadow-lg fixed inset-y-0 left-0 transform z-10 w-64 pt-20 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:pt-0 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="h-full px-2 pb-4 mt-6 overflow-y-auto">
            <ul className="space-y-2">
              {navItems.map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 text-gray-600 rounded-lg hover:bg-purple hover:text-white transition-colors ${
                      location.pathname === item.path
                        ? "bg-purple text-white"
                        : ""
                    }`}
                  >
                    <span className="text-lg mr-3">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-10 px-4 py-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="relative">
                  <GiDna1 className="text-purple text-lg absolute -top-1 -right-1" />
                  <div className="w-9 h-9 bg-purple bg-opacity-10 rounded-full flex items-center justify-center">
                    <span className="text-purple font-semibold">A</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    Admin Portal
                  </p>
                  <p className="text-xs text-gray-500">v1.0.0</p>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
