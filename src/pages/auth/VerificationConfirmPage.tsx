import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { applyActionCode, auth, updateUserProfile } from "../../utils/firebase";
import { Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaHome,
  FaSignInAlt,
  FaUser,
} from "react-icons/fa";
import Header from "../../components/Header";

const VerificationConfirmPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { currentUser, checkEmailVerification } = useAuth();
  const [verificationState, setVerificationState] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const [_authModalOpen, setAuthModalOpen] = useState(false);
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Get the action code from the URL - first try the search params
      let actionCode = searchParams.get("oobCode");
      console.log("Initial oobCode from searchParams:", actionCode);

      if (!actionCode) {
        const urlParams = new URLSearchParams(window.location.search);
        actionCode = urlParams.get("oobCode");
        console.log("oobCode from window.location:", actionCode);
      }

      if (!actionCode && window.location.href.includes("apiKey=")) {
        const completeUrl = window.location.href;
        const oobCodeMatch = completeUrl.match(/oobCode=([^&]+)/);
        if (oobCodeMatch && oobCodeMatch[1]) {
          actionCode = oobCodeMatch[1];
          console.log("Extracted oobCode from full URL:", actionCode);
        }
      }

      if (!actionCode) {
        console.log("No oobCode in URL, checking if it might be in a payload");
        setVerificationState("error");
        setError(
          "Missing verification code. This link may be invalid or expired."
        );
        return;
      }

      // Check if we've already processed this verification code
      const processedCode = sessionStorage.getItem("verifiedCode");
      if (processedCode === actionCode) {
        console.log("This verification code has already been processed");
        setVerificationState("success");
        return;
      }

      // Prevent double verification attempts in the same session
      if (verificationAttempted) {
        console.log("Verification already attempted in this session");
        return;
      }

      setVerificationAttempted(true);

      try {
        console.log("Attempting verification with code:", actionCode);

        // Clean the code - remove any quotes, spaces, or other potential issues
        let cleanedCode = actionCode.trim();
        if (cleanedCode.startsWith('"') && cleanedCode.endsWith('"')) {
          cleanedCode = cleanedCode.slice(1, -1);
        }
        // Decode it in case it's URL encoded
        const decodedActionCode = decodeURIComponent(cleanedCode);
        console.log("Cleaned and decoded action code:", decodedActionCode);

        // Try with the decoded version
        await applyActionCode(auth, decodedActionCode);

        // If the user is logged in, force reload to update the auth state
        if (currentUser) {
          await currentUser.reload();

          // Check if email is verified after reload
          const isVerified = await checkEmailVerification();

          if (isVerified) {
            // Update the user profile in Firestore to record verification
            await updateUserProfile(currentUser.uid, {
              emailVerified: true,
              emailVerifiedAt: new Date(),
            });
          }
        }

        // Store the code in session storage to prevent duplicate verification
        sessionStorage.setItem("verifiedCode", actionCode);

        setVerificationState("success");
      } catch (error) {
        console.error("Error verifying email:", error);

        // Only try the second attempt if we haven't stored the code already
        if (!sessionStorage.getItem("verifiedCode")) {
          try {
            console.log(
              "First attempt failed. Trying with original code without decoding"
            );
            await applyActionCode(auth, actionCode);

            // If we get here, it worked
            if (currentUser) {
              await currentUser.reload();

              // Check if email is verified after reload
              const isVerified = await checkEmailVerification();

              if (isVerified) {
                // Update the user profile in Firestore to record verification
                await updateUserProfile(currentUser.uid, {
                  emailVerified: true,
                  emailVerifiedAt: new Date(),
                });
              }
            }

            // Store the code in session storage to prevent duplicate verification
            sessionStorage.setItem("verifiedCode", actionCode);

            setVerificationState("success");
            return;
          } catch (retryError) {
            console.error("Second attempt also failed:", retryError);
            // Continue to error handling
          }
        }

        setVerificationState("error");

        // Provide more detailed error message
        if (error instanceof Error) {
          setError(`Failed to verify your email: ${error.message}`);
        } else {
          setError(
            "Failed to verify your email. The link may have expired or has already been used."
          );
        }
      }
    };

    verifyEmail();
  }, [
    searchParams,
    currentUser,
    checkEmailVerification,
    verificationAttempted,
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAuthModalOpen={() => setAuthModalOpen(true)} />

      <div className="max-w-md mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {verificationState === "loading" && (
            <div className="p-8 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 border-4 border-mint border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="mt-6 text-xl font-bold text-charcoal">
                Verifying your email...
              </h2>
              <p className="mt-2 text-gray-500">
                Please wait while we confirm your email address.
              </p>
            </div>
          )}

          {verificationState === "success" && (
            <div className="p-8 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="h-10 w-10 text-green-500" />
                </div>
              </div>
              <h2 className="mt-6 text-xl font-bold text-charcoal">
                Email Verified Successfully!
              </h2>
              <p className="mt-2 text-gray-500">
                Your email address has been verified. You now have full access
                to all features on Microbial.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                {currentUser ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-mint hover:bg-purple focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint"
                  >
                    <FaUser className="mr-2" /> Go to Dashboard
                  </Link>
                ) : (
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-mint hover:bg-purple focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint"
                  >
                    <FaSignInAlt className="mr-2" /> Sign In
                  </button>
                )}
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint"
                >
                  <FaHome className="mr-2" /> Go to Home
                </Link>
              </div>
            </div>
          )}

          {verificationState === "error" && (
            <div className="p-8 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <FaExclamationCircle className="h-10 w-10 text-red-500" />
                </div>
              </div>
              <h2 className="mt-6 text-xl font-bold text-charcoal">
                Verification Failed
              </h2>
              <p className="mt-2 text-gray-500">{error}</p>
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-mint hover:bg-purple focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint"
                >
                  <FaSignInAlt className="mr-2" /> Sign In to Resend
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint"
                >
                  <FaHome className="mr-2" /> Go to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationConfirmPage;
