import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getUserProfile,
  getVendorProfile,
  getExpertProfile,
} from "../../utils/firebase";
import {
  FaStore,
  FaUserMd,
  FaPlus,
  FaBoxOpen,
  FaClipboardList,
  FaCheckCircle,
  FaArrowRight,
} from "react-icons/fa";
import VendorApplicationForm from "./VendorApplicationForm";
import ExpertApplicationForm from "./ExpertApplicationForm";
import VendorProductManagement from "./VendorProductManagement";
import ExpertServiceManagement from "./ExpertServiceManagement";
import Notification from "../ui/Notification";

interface UserRoles {
  isVendor: boolean;
  isExpert: boolean;
  isAdmin: boolean;
}

// Add a SuccessMessage component
const SuccessMessage = ({
  title,
  message,
  icon = <FaCheckCircle className="text-mint text-5xl mb-4" />,
}: {
  title: string;
  message: string;
  icon?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    {icon}
    <h3 className="text-xl font-bold text-charcoal mb-2">{title}</h3>
    <p className="text-gray-600 mb-6">{message}</p>
  </div>
);

const MarketplaceDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRoles | null>(null);
  const [vendorStatus, setVendorStatus] = useState<string | null>(null);
  const [expertStatus, setExpertStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "vendor" | "expert">(
    "overview"
  );
  const [notification, setNotification] = useState({
    type: "success" as "success" | "error" | "info",
    message: "",
    isVisible: false,
  });
  const [showVendorSuccess, setShowVendorSuccess] = useState(false);
  const [showExpertSuccess, setShowExpertSuccess] = useState(false);

  // Function to load user roles and profile status
  const loadUserRoles = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Get user profile to check roles
      const userProfile = await getUserProfile(currentUser.uid);

      if (userProfile && userProfile.roles) {
        setUserRoles(userProfile.roles as UserRoles);

        // If user is a vendor, get vendor profile status
        if (userProfile.roles.isVendor) {
          const vendorProfile = await getVendorProfile(currentUser.uid);
          if (vendorProfile) {
            setVendorStatus(vendorProfile.verificationStatus);
          }
        }

        // If user is an expert, get expert profile status
        if (userProfile.roles.isExpert) {
          const expertProfile = await getExpertProfile(currentUser.uid);
          if (expertProfile) {
            setExpertStatus(expertProfile.verificationStatus);
          }
        }
      } else {
        // Default roles if not set
        setUserRoles({
          isVendor: false,
          isExpert: false,
          isAdmin: false,
        });
      }
    } catch (error) {
      console.error("Error loading user roles:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load user roles on component mount and when currentUser changes
  useEffect(() => {
    loadUserRoles();
  }, [currentUser]);

  const handleNotification = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setNotification({
      message,
      type,
      isVisible: true,
    });

    // Hide notification after 5 seconds
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, isVisible: false }));
    }, 5000);
  };

  // Handler for successful form submission
  const handleFormSuccess = async (
    message: string,
    formType: "vendor" | "expert"
  ) => {
    handleNotification(message, "success");

    // Show success state
    if (formType === "vendor") {
      setShowVendorSuccess(true);
    } else {
      setShowExpertSuccess(true);
    }

    // Reload user roles to reflect the changes
    await loadUserRoles();

    // Switch to overview tab after 3 seconds
    setTimeout(() => {
      setActiveTab("overview");
      setShowVendorSuccess(false);
      setShowExpertSuccess(false);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mint"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h2 className="text-xl font-semibold text-charcoal mb-4">
          Please Sign In
        </h2>
        <p className="text-gray-600 mb-4">
          You need to be signed in to access the marketplace features.
        </p>
        <button className="bg-mint text-white px-6 py-2 rounded-md hover:bg-purple transition-colors">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {notification.isVisible && (
        <Notification
          isVisible={notification.isVisible}
          type={notification.type}
          message={notification.message}
          onClose={() =>
            setNotification((prev) => ({ ...prev, isVisible: false }))
          }
        />
      )}

      <h1 className="text-3xl font-bold text-charcoal mb-6">
        Marketplace Dashboard
      </h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="flex border-b">
          <button
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === "overview"
                ? "bg-mint text-white"
                : "bg-white text-charcoal hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === "vendor"
                ? "bg-mint text-white"
                : "bg-white text-charcoal hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("vendor")}
          >
            Vendor Portal
          </button>
          <button
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === "expert"
                ? "bg-mint text-white"
                : "bg-white text-charcoal hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("expert")}
          >
            Expert Portal
          </button>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div>
              <h2 className="text-xl font-semibold text-charcoal mb-4">
                Marketplace Overview
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-mint rounded-full p-3 mr-4">
                      <FaStore className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-charcoal">
                        Vendor Status
                      </h3>
                      <p className="text-gray-600">
                        {userRoles?.isVendor
                          ? `Your vendor account is ${
                              vendorStatus || "pending verification"
                            }`
                          : "You are not registered as a vendor"}
                      </p>
                    </div>
                  </div>

                  {!userRoles?.isVendor && (
                    <button
                      onClick={() => setActiveTab("vendor")}
                      className="flex items-center text-mint hover:text-purple transition-colors"
                    >
                      <FaPlus className="mr-2" /> Apply to become a vendor
                    </button>
                  )}

                  {userRoles?.isVendor && vendorStatus === "approved" && (
                    <div className="mt-4">
                      <button
                        onClick={() => setActiveTab("vendor")}
                        className="bg-mint text-white px-4 py-2 rounded-md hover:bg-purple transition-colors"
                      >
                        Manage Products
                      </button>
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-purple rounded-full p-3 mr-4">
                      <FaUserMd className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-charcoal">
                        Expert Status
                      </h3>
                      <p className="text-gray-600">
                        {userRoles?.isExpert
                          ? `Your expert account is ${
                              expertStatus || "pending verification"
                            }`
                          : "You are not registered as an expert"}
                      </p>
                    </div>
                  </div>

                  {!userRoles?.isExpert && (
                    <button
                      onClick={() => setActiveTab("expert")}
                      className="flex items-center text-purple hover:text-mint transition-colors"
                    >
                      <FaPlus className="mr-2" /> Apply to become an expert
                    </button>
                  )}

                  {userRoles?.isExpert && expertStatus === "approved" && (
                    <div className="mt-4">
                      <button
                        onClick={() => setActiveTab("expert")}
                        className="bg-purple text-white px-4 py-2 rounded-md hover:bg-mint transition-colors"
                      >
                        Manage Services
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Link
                  to="/marketplace/products"
                  className="border border-gray-200 rounded-lg p-6 hover:border-mint transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-mint bg-opacity-20 rounded-full p-3 mr-4">
                        <FaBoxOpen className="text-mint text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-charcoal">
                          Browse Lab Equipment
                        </h3>
                        <p className="text-gray-600">
                          Find and purchase laboratory equipment and supplies
                        </p>
                      </div>
                    </div>
                    <FaArrowRight className="text-mint" />
                  </div>
                </Link>

                <Link
                  to="/marketplace/services"
                  className="border border-gray-200 rounded-lg p-6 hover:border-purple transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-purple bg-opacity-20 rounded-full p-3 mr-4">
                        <FaClipboardList className="text-purple text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-charcoal">
                          Find Expert Services
                        </h3>
                        <p className="text-gray-600">
                          Connect with microbiology experts for specialized
                          services
                        </p>
                      </div>
                    </div>
                    <FaArrowRight className="text-purple" />
                  </div>
                </Link>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-charcoal mb-4">
                  Recent Activity
                </h3>
                <p className="text-gray-600 italic">
                  No recent marketplace activity to display.
                </p>
              </div>
            </div>
          )}

          {activeTab === "vendor" && (
            <div>
              {userRoles?.isVendor ? (
                <div>
                  {vendorStatus === "pending" && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-yellow-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            Your vendor application is currently under review.
                            We'll notify you once it's approved.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {vendorStatus === "approved" && <VendorProductManagement />}

                  {vendorStatus === "rejected" && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-red-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">
                            Your vendor application was not approved. Please
                            contact support for more information.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : showVendorSuccess ? (
                <SuccessMessage
                  title="Application Submitted!"
                  message="Your vendor application has been submitted successfully. We'll review it and get back to you soon. You'll be redirected to the overview page in a moment."
                  icon={<FaStore className="text-mint text-5xl mb-4" />}
                />
              ) : (
                <VendorApplicationForm
                  onSuccess={(message) => handleFormSuccess(message, "vendor")}
                  onError={(message) => handleNotification(message, "error")}
                />
              )}
            </div>
          )}

          {activeTab === "expert" && (
            <div>
              {userRoles?.isExpert ? (
                <div>
                  {expertStatus === "pending" && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-yellow-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            Your expert application is currently under review.
                            We'll notify you once it's approved.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {expertStatus === "approved" && <ExpertServiceManagement />}

                  {expertStatus === "rejected" && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-red-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">
                            Your expert application was not approved. Please
                            contact support for more information.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : showExpertSuccess ? (
                <SuccessMessage
                  title="Application Submitted!"
                  message="Your expert application has been submitted successfully. We'll review it and get back to you soon. You'll be redirected to the overview page in a moment."
                  icon={<FaUserMd className="text-purple text-5xl mb-4" />}
                />
              ) : (
                <ExpertApplicationForm
                  onSuccess={(message) => handleFormSuccess(message, "expert")}
                  onError={(message) => handleNotification(message, "error")}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceDashboard;
