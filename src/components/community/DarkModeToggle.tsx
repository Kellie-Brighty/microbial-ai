import React from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import { useCommunityTheme } from "../../context/CommunityThemeContext";

interface DarkModeToggleProps {
  className?: string;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ className = "" }) => {
  const { isDarkMode, toggleDarkMode } = useCommunityTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className={`p-2 rounded-full transition-colors ${className} ${
        isDarkMode
          ? "bg-gray-700 text-yellow-300 hover:bg-gray-600"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
    </button>
  );
};

export default DarkModeToggle;
