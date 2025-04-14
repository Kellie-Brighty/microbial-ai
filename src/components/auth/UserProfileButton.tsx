import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

interface UserProfileButtonProps {
  onOpenSettings: () => void;
}

const UserProfileButton: React.FC<UserProfileButtonProps> = ({
  onOpenSettings,
}) => {
  const { currentUser, userProfile, logOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logOut();
      setDropdownOpen(false);
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  if (!currentUser) return null;

  // Get first letter of display name for avatar placeholder
  const getInitial = () => {
    const name =
      currentUser.displayName || userProfile?.displayName || currentUser.email;
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-mint text-white text-sm font-medium">
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="User"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span>{getInitial()}</span>
          )}
        </div>
        <span className="hidden md:block text-sm font-medium text-gray-700">
          {currentUser.displayName || userProfile?.displayName || "User"}
        </span>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">
              {currentUser.displayName || userProfile?.displayName || "User"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {currentUser.email}
            </p>
          </div>

          <a
            href="#settings"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={(e) => {
              e.preventDefault();
              setDropdownOpen(false);
              onOpenSettings();
            }}
          >
            Settings
          </a>

          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileButton;
