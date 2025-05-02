import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { FaEnvelope, FaExclamationTriangle } from "react-icons/fa";

interface VerificationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A component that restricts access to features until email is verified.
 * If email is verified, it renders the children.
 * If email is not verified, it renders the fallback or a default message with verification options.
 */
const VerificationGuard: React.FC<VerificationGuardProps> = ({
  children,
  fallback,
}) => {
  const { currentUser, emailVerified, sendVerificationEmail } = useAuth();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // If email is verified, render the children
  if (emailVerified) {
    return <>{children}</>;
  }

  // If user is not logged in, also render children (auth requirements should be handled separately)
  if (!currentUser) {
    return <>{children}</>;
  }

  const handleResendVerification = async () => {
    setSending(true);
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
      setSending(false);
    }
  };

  // If fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default verification required message
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 my-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FaExclamationTriangle className="h-5 w-5 text-yellow-500" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Email Verification Required
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              This feature requires email verification. Please check your inbox
              for the verification link we sent to{" "}
              <strong>{currentUser.email}</strong>.
            </p>
          </div>

          {message && (
            <div
              className={`mt-3 p-2 rounded ${
                message.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mt-4">
            <button
              onClick={handleResendVerification}
              disabled={sending}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-700"
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
                </>
              ) : (
                <>
                  <FaEnvelope className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationGuard;
