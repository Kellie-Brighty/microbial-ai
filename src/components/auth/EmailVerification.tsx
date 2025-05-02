import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { FaEnvelope, FaCheck, FaExclamationTriangle } from "react-icons/fa";

interface EmailVerificationProps {
  onClose?: () => void;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ onClose }) => {
  const { currentUser, isEmailVerified, sendVerificationEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleResendVerificationEmail = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const success = await sendVerificationEmail();

      if (success) {
        setMessage({
          type: "success",
          text: "Verification email sent! Please check your inbox.",
        });
      } else {
        setMessage({
          type: "error",
          text: "Failed to send verification email. Please try again later.",
        });
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      setMessage({
        type: "error",
        text: "An error occurred while sending the verification email.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
        <div className="text-center">
          <p className="text-gray-600">
            You need to be signed in to verify your email.
          </p>
        </div>
      </div>
    );
  }

  const verified = isEmailVerified();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
      <div className="flex flex-col items-center mb-5">
        <div
          className={`p-3 rounded-full text-white mb-3 shadow-md ${
            verified ? "bg-green-500" : "bg-yellow-500"
          }`}
        >
          {verified ? <FaCheck size={30} /> : <FaEnvelope size={30} />}
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-charcoal">
          Email Verification
        </h2>

        <p className="text-gray-600 text-sm mt-1">
          {verified
            ? "Your email has been verified"
            : "Please verify your email address to access all features"}
        </p>
      </div>

      {message && (
        <div
          className={`${
            message.type === "success"
              ? "bg-green-100 border-green-500 text-green-700"
              : "bg-red-100 border-red-500 text-red-700"
          } border-l-4 p-3 rounded-md mb-4 text-sm`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          {verified ? (
            <div className="flex-shrink-0 text-green-500">
              <FaCheck className="h-5 w-5" />
            </div>
          ) : (
            <div className="flex-shrink-0 text-yellow-500">
              <FaExclamationTriangle className="h-5 w-5" />
            </div>
          )}

          <div className="ml-3">
            <h3 className="text-sm font-medium">
              {verified ? "Email verified" : "Email verification required"}
            </h3>
            <div className="mt-2 text-sm text-gray-600">
              <p>
                {verified
                  ? "Your email address has been verified. You have full access to all features."
                  : `We sent a verification link to ${currentUser.email}. Please check your inbox and click the link to verify your account.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {!verified && (
        <div className="flex flex-col space-y-3">
          <p className="text-sm text-gray-600">
            Didn't receive the verification email? Click the button below to
            send it again.
          </p>

          <button
            onClick={handleResendVerificationEmail}
            disabled={loading}
            className="bg-gradient-to-r from-mint to-purple text-white py-2 px-4 rounded-lg hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint disabled:opacity-50 font-medium shadow-md"
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
                Sending...
              </div>
            ) : (
              "Resend Verification Email"
            )}
          </button>
        </div>
      )}

      {onClose && (
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-mint hover:text-purple focus:outline-none font-medium transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailVerification;
