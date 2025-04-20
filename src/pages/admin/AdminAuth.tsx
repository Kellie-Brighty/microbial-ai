import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaLock, FaSignInAlt } from "react-icons/fa";

const AdminAuth: React.FC = () => {
  const [password, setPassword] = useState("");
  const [error, _setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Accept any password for now
    localStorage.setItem("adminAuthenticated", "true");
    navigate("/admin/moderation");
  };

  return (
    <div className="min-h-screen bg-offWhite flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md border border-lightGray">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-mint flex items-center justify-center text-white">
            <FaLock size={20} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-charcoal mb-4 text-center">
          Admin Access
        </h1>

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-lg mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-charcoal mb-2 font-medium"
            >
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-lightGray rounded-lg bg-offWhite focus:border-mint focus:outline-none transition-colors"
                placeholder="Enter any password"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              For development purposes, any password will work.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-mint hover:bg-purple text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <FaSignInAlt className="mr-2" />
            Access Admin Area
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAuth;
