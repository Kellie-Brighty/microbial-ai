import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaLock } from "react-icons/fa";
import { GiDna1 } from "react-icons/gi";
import AgenNicky from "../../assets/microbial-profile.png";

const AdminAuth: React.FC = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simple validation
    if (!password.trim()) {
      setError("Please enter a password");
      setIsLoading(false);
      return;
    }

    // Simulate authentication delay
    setTimeout(() => {
      // Accept any password for now
      localStorage.setItem("adminAuthenticated", "true");
      navigate("/admin/activity");
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-purple text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
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
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md border border-gray-200">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative mb-2">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple">
                <FaLock size={24} />
              </div>
              <div className="absolute -bottom-1 -right-1 text-purple">
                <GiDna1 size={16} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">
              Admin Authentication
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Enter credentials to access the admin dashboard
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-lg mb-6 border border-red-200 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-red-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-gray-700 mb-2 font-medium"
              >
                Admin Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-transparent transition-colors"
                  placeholder="Enter any password for development"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 italic">
                Note: For development purposes, any password will grant access.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-purple hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                "Access Admin Dashboard"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          Microbial AI Administration Portal &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default AdminAuth;
