/**
 * Theme Utilities
 *
 * This file contains utility functions for managing theme settings
 * throughout the application.
 */

type ThemeColor = "mint" | "purple" | "blue" | "orange" | "pink";
type FontSize = "small" | "medium" | "large";
export type ThemeMode = "light" | "dimmed" | "dark";

/**
 * Apply theme settings to the document root element
 */
export const applyThemeSettings = () => {
  // Load settings from localStorage
  const themeMode =
    (localStorage.getItem("themeMode") as ThemeMode) || "dimmed";
  const accentColor =
    (localStorage.getItem("accentColor") as ThemeColor) || "mint";
  const fontSize = (localStorage.getItem("fontSize") as FontSize) || "medium";

  console.log(`Applying theme: ${themeMode} mode, ${accentColor} accent`);

  const root = document.documentElement;

  // First, clear all mode classes to avoid conflicts
  root.classList.remove("light-mode", "dimmed-mode", "dark-mode");

  // Then add the current mode class
  root.classList.add(`${themeMode}-mode`);

  // Apply accent color (clear all first to avoid conflicts)
  root.classList.remove(
    "theme-mint",
    "theme-purple",
    "theme-blue",
    "theme-orange",
    "theme-pink"
  );
  root.classList.add(`theme-${accentColor}`);

  // Apply font size (clear all first to avoid conflicts)
  root.classList.remove(
    "font-size-small",
    "font-size-medium",
    "font-size-large"
  );
  root.classList.add(`font-size-${fontSize}`);

  // For debugging
  console.log(`Theme applied: ${root.className}`);
};

/**
 * Save theme settings to localStorage and apply them
 */
export const saveThemeSettings = (
  themeMode: ThemeMode,
  accentColor: ThemeColor,
  fontSize: FontSize,
  autoSave?: boolean
) => {
  // Save settings to localStorage
  localStorage.setItem("themeMode", themeMode);
  localStorage.setItem("accentColor", accentColor);
  localStorage.setItem("fontSize", fontSize);

  if (autoSave !== undefined) {
    localStorage.setItem("autoSave", autoSave.toString());
  }

  // Apply the settings
  applyThemeSettings();
};

/**
 * Cycle through theme modes
 */
export const cycleThemeMode = (): ThemeMode => {
  const currentTheme =
    (localStorage.getItem("themeMode") as ThemeMode) || "dimmed";
  let newTheme: ThemeMode;

  switch (currentTheme) {
    case "light":
      newTheme = "dimmed";
      break;
    case "dimmed":
      newTheme = "dark";
      break;
    case "dark":
    default:
      newTheme = "light";
      break;
  }

  // Get current accent and font size settings
  const accentColor =
    (localStorage.getItem("accentColor") as ThemeColor) || "mint";
  const fontSize = (localStorage.getItem("fontSize") as FontSize) || "medium";

  // Save new theme settings
  saveThemeSettings(newTheme, accentColor, fontSize);

  return newTheme;
};
