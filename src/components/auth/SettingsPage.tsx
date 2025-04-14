import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { GiCog } from "react-icons/gi";
import { FaMoon, FaSun, FaPalette } from "react-icons/fa";
import { saveThemeSettings } from "../../utils/themeUtils";

interface SettingsPageProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // App settings
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [accentColor, setAccentColor] = useState("mint");
  const [fontSize, setFontSize] = useState("medium");
  const [autoSave, setAutoSave] = useState(true);

  // User profile settings
  const [displayName, setDisplayName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  const [preferredTopics, setPreferredTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState("");
  const [notes, setNotes] = useState("");

  // Load user profile data when component mounts
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || "");
      setInterests(userProfile.interests || []);
      setPreferredTopics(userProfile.preferredTopics || []);
      setNotes(userProfile.notes || "");

      // Load app settings from localStorage
      const savedThemeMode = localStorage.getItem("themeMode") || "dimmed";
      const savedDarkMode = savedThemeMode === "dark";
      const savedNotifications =
        localStorage.getItem("notifications") !== "false";
      const savedAccentColor = localStorage.getItem("accentColor") || "mint";
      const savedFontSize = localStorage.getItem("fontSize") || "medium";
      const savedAutoSave = localStorage.getItem("autoSave") !== "false";

      setDarkMode(savedDarkMode);
      setNotificationsEnabled(savedNotifications);
      setAccentColor(savedAccentColor);
      setFontSize(savedFontSize);
      setAutoSave(savedAutoSave);
    }
  }, [userProfile]);

  if (!isOpen || !currentUser) return null;

  const handleAddInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput("");
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const handleAddTopic = () => {
    if (topicInput.trim() && !preferredTopics.includes(topicInput.trim())) {
      setPreferredTopics([...preferredTopics, topicInput.trim()]);
      setTopicInput("");
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setPreferredTopics(preferredTopics.filter((t) => t !== topic));
  };

  const saveAppSettings = () => {
    // Convert boolean darkMode to ThemeMode
    const themeMode = darkMode ? "dark" : "light";

    // Save theme settings and apply them
    saveThemeSettings(themeMode, accentColor as any, fontSize as any, autoSave);

    // Save notification settings
    localStorage.setItem("notifications", notificationsEnabled.toString());

    setSuccessMessage("App settings saved successfully!");

    // Clear message after a few seconds
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  // Apply theme setting immediately when values change
  const handleDarkModeChange = (value: boolean) => {
    setDarkMode(value);
    const themeMode = value ? "dark" : "light";
    saveThemeSettings(themeMode, accentColor as any, fontSize as any);
  };

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color);
    const themeMode = darkMode ? "dark" : "light";
    saveThemeSettings(themeMode, color as any, fontSize as any);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    const themeMode = darkMode ? "dark" : "light";
    saveThemeSettings(themeMode, accentColor as any, size as any);
  };

  const saveProfile = async () => {
    if (!currentUser) return;

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const success = await updateUserProfile({
        displayName,
        interests,
        preferredTopics,
        notes,
        lastLogin: new Date(),
      });

      if (success) {
        setSuccessMessage("Profile updated successfully!");

        // Clear message after a few seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        setErrorMessage("Failed to update profile");
      }
    } catch (error) {
      setErrorMessage("An error occurred while updating your profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg shadow-md p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="flex items-center mb-6">
          <div className="p-3 bg-mint rounded-full text-white mr-4">
            <GiCog size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-charcoal">Settings</h2>
            <p className="text-gray-600 text-sm">
              Customize your Microbial AI experience
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* App Preferences Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-charcoal border-b pb-2">
              App Preferences
            </h3>

            <div className="space-y-4">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <label className="flex items-center text-sm text-gray-700">
                  <span className="mr-2">
                    {darkMode ? <FaMoon /> : <FaSun />}
                  </span>
                  Theme
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="toggle-theme"
                    checked={darkMode}
                    onChange={() => handleDarkModeChange(!darkMode)}
                    className="sr-only"
                  />
                  <label
                    htmlFor="toggle-theme"
                    className={`block h-6 w-12 rounded-full cursor-pointer transition-colors ${
                      darkMode ? "bg-mint" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform transform ${
                        darkMode ? "translate-x-6" : ""
                      }`}
                    ></span>
                  </label>
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="flex items-center text-sm text-gray-700 mb-1">
                  <span className="mr-2">
                    <FaPalette />
                  </span>
                  Accent Color
                </label>
                <div className="flex space-x-2">
                  {["mint", "purple", "blue", "orange", "pink"].map((color) => (
                    <button
                      key={color}
                      onClick={() => handleAccentColorChange(color)}
                      className={`w-6 h-6 rounded-full ${
                        accentColor === color ? "ring-2 ring-gray-400" : ""
                      }`}
                      style={{
                        backgroundColor: `var(--color-${color}, #${
                          color === "mint"
                            ? "3BCEAC"
                            : color === "purple"
                            ? "6A67CE"
                            : color === "blue"
                            ? "4299e1"
                            : color === "orange"
                            ? "ed8936"
                            : "ed64a6"
                        })`,
                      }}
                    ></button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Font Size
                </label>
                <select
                  value={fontSize}
                  onChange={(e) => handleFontSizeChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              {/* Auto-save Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">
                  Auto-save conversations
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="toggle-autosave"
                    checked={autoSave}
                    onChange={() => setAutoSave(!autoSave)}
                    className="sr-only"
                  />
                  <label
                    htmlFor="toggle-autosave"
                    className={`block h-6 w-12 rounded-full cursor-pointer transition-colors ${
                      autoSave ? "bg-mint" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform transform ${
                        autoSave ? "translate-x-6" : ""
                      }`}
                    ></span>
                  </label>
                </div>
              </div>

              <button
                onClick={saveAppSettings}
                className="w-full bg-mint hover:bg-purple text-white font-medium py-2 px-4 rounded transition-colors mt-2"
              >
                Save App Settings
              </button>
            </div>
          </div>

          {/* Profile Settings Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-charcoal border-b pb-2">
              Profile Preferences
            </h3>

            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Interests
                </label>
                <div className="flex mb-2">
                  <input
                    type="text"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    placeholder="Add an interest"
                    className="flex-1 p-2 border border-gray-300 rounded-l text-sm"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddInterest();
                        e.preventDefault();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddInterest}
                    className="bg-mint text-white px-3 rounded-r"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 px-3 py-1 rounded-full flex items-center text-sm"
                    >
                      {interest}
                      <button
                        onClick={() => handleRemoveInterest(interest)}
                        className="ml-2 text-gray-500 hover:text-red-500"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferred Topics */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Preferred Microbiology Topics
                </label>
                <div className="flex mb-2">
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="Add a topic"
                    className="flex-1 p-2 border border-gray-300 rounded-l text-sm"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddTopic();
                        e.preventDefault();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddTopic}
                    className="bg-mint text-white px-3 rounded-r"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferredTopics.map((topic, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 px-3 py-1 rounded-full flex items-center text-sm"
                    >
                      {topic}
                      <button
                        onClick={() => handleRemoveTopic(topic)}
                        className="ml-2 text-gray-500 hover:text-red-500"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Personal Notes (visible to AI)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add personal notes or context for the AI..."
                  className="w-full p-2 border border-gray-300 rounded text-sm h-20"
                />
              </div>

              <button
                onClick={saveProfile}
                disabled={loading}
                className={`w-full ${
                  loading ? "bg-gray-400" : "bg-mint hover:bg-purple"
                } text-white font-medium py-2 px-4 rounded transition-colors mt-2`}
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
