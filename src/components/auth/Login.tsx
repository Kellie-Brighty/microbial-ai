import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { GiDna1 } from "react-icons/gi";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface LoginProps {
  onToggleForm: () => void;
  onClose: () => void;
  onSuccess: (
    message: string,
    setLoading?: React.Dispatch<React.SetStateAction<boolean>>
  ) => void;
}

const Login: React.FC<LoginProps> = ({ onToggleForm, onClose, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn } = useAuth();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setError("");
      setLoading(true);
      const user = await signIn(email, password);

      if (!user) {
        setError("Failed to sign in. Please check your credentials.");
      } else {
        onSuccess(
          `Welcome back, ${user.displayName || user.email}!`,
          setLoading
        );
        onClose();
      }
    } catch (error) {
      setError("Failed to sign in. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
      <div className="flex flex-col items-center mb-5">
        <div className="p-3 bg-gradient-to-r from-mint to-purple rounded-full text-white mb-3 shadow-md">
          <GiDna1 size={30} />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-charcoal">Sign In</h2>
        <p className="text-gray-600 text-xs mt-1">
          Access your Microbial AI account
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint focus:border-transparent transition-all"
            placeholder="your.email@example.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint focus:border-transparent transition-all"
              placeholder="Your password"
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
            </button>
          </div>
          <div className="flex justify-end mt-1">
            <button
              type="button"
              className="text-xs text-mint hover:text-purple transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-mint to-purple text-white py-2 px-4 rounded-lg hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint disabled:opacity-50 font-medium shadow-md"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              Signing in...
            </div>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-gray-600 text-sm">
          Don't have an account?{" "}
          <button
            onClick={onToggleForm}
            className="text-mint hover:text-purple focus:outline-none font-medium transition-colors"
          >
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
