import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaComments,
  FaTools,
  FaSignInAlt,
  FaUserCircle,
  FaMicrochip,
} from "react-icons/fa";
import { MdLiveTv } from "react-icons/md";
import { GiDna1 } from "react-icons/gi";
import { useAuth } from "../context/AuthContext";

const MainNavigation: React.FC = () => {
  const location = useLocation();
  const { currentUser } = useAuth();

  // Don't render the navigation on the chat page
  if (location.pathname === "/chat") {
    return null;
  }

  return (
    <nav className="bg-white shadow-md py-3 sm:py-4 px-4 sm:px-6 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          to="/"
          className="text-xl font-bold text-purple flex items-center"
        >
          <div className="relative mr-2 hidden sm:block">
            <div className="w-8 h-8 rounded-full bg-mint flex items-center justify-center">
              <GiDna1 className="text-white" size={18} />
            </div>
            <div className="absolute -bottom-1 -right-1 text-purple">
              <FaMicrochip size={10} />
            </div>
          </div>
          <span className="mr-2">Microbial AI</span>
          <span className="bg-mint text-white text-xs px-2 py-0.5 rounded-full hidden sm:inline-block">
            BETA
          </span>
        </Link>

        <div className="flex space-x-1 sm:space-x-2">
          <Link
            to="/"
            className={`flex items-center px-2 sm:px-3 py-2 rounded-md transition-colors text-sm sm:text-base ${
              location.pathname === "/"
                ? "bg-mint text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FaHome className="mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Homeeeee</span>
          </Link>

          <Link
            to="/chat"
            className={`flex items-center px-2 sm:px-3 py-2 rounded-md transition-colors text-sm sm:text-base ${
              location.pathname === "/chat"
                ? "bg-mint text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FaComments className="mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Chat</span>
          </Link>

          <Link
            to="/conferences"
            className={`flex items-center px-2 sm:px-3 py-2 rounded-md transition-colors text-sm sm:text-base ${
              location.pathname.includes("/conferences")
                ? "bg-mint text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <MdLiveTv className="mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Conferences</span>
          </Link>

          <Link
            to="/tools"
            className={`flex items-center px-2 sm:px-3 py-2 rounded-md transition-colors text-sm sm:text-base ${
              location.pathname === "/tools"
                ? "bg-mint text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FaTools className="mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Tools</span>
          </Link>

          {!currentUser ? (
            <Link
              to="/login"
              className="flex items-center px-2 sm:px-4 py-2 bg-purple text-white rounded-md hover:bg-opacity-90 transition-colors text-sm sm:text-base"
            >
              <FaSignInAlt className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          ) : (
            <Link
              to="/profile"
              className="flex items-center px-2 sm:px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors text-sm sm:text-base"
            >
              <FaUserCircle className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation;
