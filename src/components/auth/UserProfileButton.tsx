import React, { useState, useRef, useEffect } from "react";
import {
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaMicrophone,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

interface UserProfileButtonProps {
  onOpenSettings: () => void;
}

const UserProfileButton: React.FC<UserProfileButtonProps> = ({
  onOpenSettings,
}) => {
  const { currentUser, logOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Admin user IDs
  const adminUserIds = [
    "admin-user-id-1", // Replace with actual admin UIDs
    "admin-user-id-2",
  ];

  const isAdmin = currentUser && adminUserIds.includes(currentUser.uid);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await logOut();
      setIsOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-offWhite rounded-full p-2 hover:bg-lightGray transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-purple text-white flex items-center justify-center text-sm font-medium">
          {currentUser?.displayName
            ? currentUser.displayName.charAt(0).toUpperCase()
            : currentUser?.email
            ? currentUser.email.charAt(0).toUpperCase()
            : "U"}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 py-2">
          {currentUser && (
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="font-medium text-charcoal">
                {currentUser.displayName || "User"}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {currentUser.email}
              </div>
            </div>
          )}

          <Link
            to="/profile"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-offWhite"
            onClick={() => setIsOpen(false)}
          >
            <FaUser className="mr-2 text-mint" size={14} />
            My Profile
          </Link>

          <button
            onClick={onOpenSettings}
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-offWhite w-full text-left"
          >
            <FaCog className="mr-2 text-mint" size={14} />
            Settings
          </button>

          <Link
            to="/conferences/create"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-offWhite w-full text-left"
            onClick={() => setIsOpen(false)}
          >
            <FaMicrophone className="mr-2 text-mint" size={14} />
            Host Conference
          </Link>

          {isAdmin && (
            <>
              <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                Admin Panel
              </div>
              <Link
                to="/admin/moderation"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-offWhite w-full text-left"
                onClick={() => setIsOpen(false)}
              >
                <FaShieldAlt className="mr-2 text-red-500" size={14} />
                Content Moderation
              </Link>
              <Link
                to="/admin/communities"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-offWhite w-full text-left"
                onClick={() => setIsOpen(false)}
              >
                <FaUsers className="mr-2 text-red-500" size={14} />
                Community Moderation
              </Link>
            </>
          )}

          <button
            onClick={handleSignOut}
            className="flex items-center px-4 py-2 text-red-600 hover:bg-offWhite w-full text-left"
          >
            <FaSignOutAlt className="mr-2" size={14} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileButton;
