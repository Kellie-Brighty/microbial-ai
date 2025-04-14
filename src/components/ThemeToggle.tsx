import React, { useState, useEffect } from "react";
import { cycleThemeMode, ThemeMode } from "../utils/themeUtils";
import { FaSun, FaMoon } from "react-icons/fa";
import { HiOutlineAdjustments } from "react-icons/hi";

interface ThemeToggleProps {
  isMobile?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isMobile = false }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(
    (localStorage.getItem("themeMode") as ThemeMode) || "dimmed"
  );
  const [isAnimating, setIsAnimating] = useState(false);

  const handleThemeToggle = () => {
    setIsAnimating(true);
    const newTheme = cycleThemeMode();
    setCurrentTheme(newTheme);
    setTimeout(() => setIsAnimating(false), 600);
  };

  // Update the component state when the theme changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const theme = localStorage.getItem("themeMode") as ThemeMode;
      if (theme && theme !== currentTheme) {
        setCurrentTheme(theme);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Set initial state
    const savedTheme = localStorage.getItem("themeMode") as ThemeMode;
    if (savedTheme && savedTheme !== currentTheme) {
      setCurrentTheme(savedTheme);
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [currentTheme]);

  // Icon and label based on current theme
  const getThemeIcon = () => {
    switch (currentTheme) {
      case "light":
        return (
          <FaSun
            className={`text-amber-400 ${
              isAnimating ? "animate-spin-slow" : ""
            }`}
          />
        );
      case "dark":
        return (
          <FaMoon
            className={`text-indigo-400 ${isAnimating ? "animate-pulse" : ""}`}
          />
        );
      case "dimmed":
      default:
        return (
          <HiOutlineAdjustments
            className={`text-teal-600 ${
              isAnimating ? "animate-bounce-gentle" : ""
            }`}
          />
        );
    }
  };

  const getThemeLabel = () => {
    switch (currentTheme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "dimmed":
      default:
        return "Dimmed";
    }
  };

  const getThemeColors = () => {
    switch (currentTheme) {
      case "light":
        return "bg-amber-50 text-amber-500 hover:bg-amber-100";
      case "dark":
        return "bg-indigo-50 text-indigo-500 hover:bg-indigo-100";
      case "dimmed":
      default:
        return "bg-teal-50 text-teal-600 hover:bg-teal-100";
    }
  };

  // For mobile, render a simplified version
  if (isMobile) {
    return (
      <button
        onClick={handleThemeToggle}
        className={`p-1.5 rounded-md ${getThemeColors()} flex items-center space-x-2 transition-all duration-300 shadow-sm`}
        aria-label={`Switch theme, current: ${currentTheme}`}
      >
        <div className="w-5 h-5 flex items-center justify-center">
          {getThemeIcon()}
        </div>
        <span className="text-sm font-medium">{getThemeLabel()}</span>
      </button>
    );
  }

  // Desktop version
  return (
    <button
      onClick={handleThemeToggle}
      className={`p-2 rounded-full ${getThemeColors()} transition-all duration-300 hover:shadow-sm`}
      aria-label={`Switch theme, current: ${currentTheme}`}
      title={`Theme: ${getThemeLabel()}`}
    >
      <div className="w-5 h-5 flex items-center justify-center">
        {getThemeIcon()}
      </div>
    </button>
  );
};

export default ThemeToggle;
