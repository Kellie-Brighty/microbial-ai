import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface CommunityThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const CommunityThemeContext = createContext<CommunityThemeContextType | null>(
  null
);

export const useCommunityTheme = () => {
  const context = useContext(CommunityThemeContext);
  if (!context) {
    throw new Error(
      "useCommunityTheme must be used within a CommunityThemeProvider"
    );
  }
  return context;
};

export const CommunityThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Get initial dark mode preference from localStorage if available
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const storedPreference = localStorage.getItem("community-dark-mode");
    return storedPreference ? JSON.parse(storedPreference) : false;
  });

  // Save dark mode preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("community-dark-mode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  return (
    <CommunityThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </CommunityThemeContext.Provider>
  );
};
