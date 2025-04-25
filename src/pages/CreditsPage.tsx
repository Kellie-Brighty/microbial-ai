import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaCreditCard, FaCheck } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getUserCredits, CREDIT_COSTS } from "../utils/creditsSystem";
import Header from "../components/Header";
import AuthModal from "../components/auth/AuthModal";
import Notification, { NotificationType } from "../components/ui/Notification";
// Import our credit purchase modal with Paystack integration
import CreditPurchaseModal from "../components/payment/CreditPurchaseModal";
import { creditPackages } from "../components/payment/PaystackPayment";
// Import the CreditHistoryTable component
import CreditHistoryTable from "../components/credits/CreditHistoryTable";

const CreditsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [credits, setCredits] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, _setIsLoading] = useState(false);
  const [showSuccessState, setShowSuccessState] = useState(false);
  // Add state for showing credit history
  const [activeTab, setActiveTab] = useState<"packages" | "history">(
    "packages"
  );

  // Add state for modals and notifications
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [notification, setNotification] = useState({
    type: "success" as NotificationType,
    message: "",
    isVisible: false,
  });

  // Load user credits when the component mounts or when user changes
  useEffect(() => {
    const loadUserCredits = async () => {
      if (currentUser) {
        try {
          const userCredits = await getUserCredits(currentUser.uid);
          setCredits(userCredits);
        } catch (error) {
          console.error("Error loading user credits:", error);
        }
      }
    };

    loadUserCredits();
  }, [currentUser]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser && !authModalOpen) {
      setAuthModalOpen(true);
    }
  }, [currentUser, authModalOpen]);

  // Check if the URL has a tab parameter and set the initial active tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'history') {
      setActiveTab('history');
    }
  }, [location.search]);

  // Show notification utility function
  const showNotification = (type: NotificationType, message: string) => {
    setNotification({
      type,
      message,
      isVisible: true,
    });
  };

  const hideNotification = () => {
    setNotification((prev) => ({
      ...prev,
      isVisible: false,
    }));
  };

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId);
    // Open the purchase modal when a package is selected
    if (currentUser) {
      setPurchaseModalOpen(true);
    } else {
      setAuthModalOpen(true);
    }
  };

  // Success handler for after purchase is complete
  const handlePurchaseSuccess = async (message: string) => {
    // Refresh credits after purchase
    if (currentUser) {
      try {
        const updatedCredits = await getUserCredits(currentUser.uid);
        setCredits(updatedCredits);
      } catch (error) {
        console.error("Error refreshing credits after purchase:", error);
      }
    }

    // Show success notification
    showNotification("success", message);

    // Keep the modal open to display the success message
    // Don't close the modal automatically
    // The user can close it manually when they're ready
  };

  return (
    <div className="min-h-screen bg-offWhite">
      {/* Auth Modal */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => {
            setAuthModalOpen(false);
            if (!currentUser) {
              navigate("/");
            }
          }}
          onSuccess={(message) => {
            showNotification("success", message);
            setAuthModalOpen(false);
          }}
        />
      )}

      {/* Credit Purchase Modal with Paystack */}
      {purchaseModalOpen && selectedPackage && (
        <CreditPurchaseModal
          isOpen={purchaseModalOpen}
          onClose={() => setPurchaseModalOpen(false)}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {/* Notification Component */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      {/* Header */}
      <Header onAuthModalOpen={() => setAuthModalOpen(true)} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 pt-24">
        {/* Back button and title */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-purple hover:text-mint transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            <span>Back to Home</span>
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4">
            <h1 className="text-3xl md:text-4xl font-bold text-charcoal">
              {activeTab === "packages" ? "Purchase Credits" : "Credit History"}
            </h1>
            {credits !== null && (
              <div className="mt-2 md:mt-0 text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm">
                Current balance:{" "}
                <span className="font-semibold text-purple">
                  {credits} credits
                </span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-6 border-b border-gray-200">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === "packages"
                  ? "bg-white text-mint border-b-2 border-mint"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("packages")}
            >
              Purchase Credits
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === "history"
                  ? "bg-white text-mint border-b-2 border-mint"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("history")}
            >
              Transaction History
            </button>
          </div>
        </div>

        {/* Success State */}
        {showSuccessState ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center max-w-xl mx-auto my-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-green-500 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Purchase Successful!
            </h2>
            <p className="text-green-700 mb-6">
              Your credits have been added to your account.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/chat"
                className="px-6 py-2 bg-purple text-white rounded-full hover:bg-mint transition-colors"
              >
                Start Using Credits
              </Link>
              <button
                onClick={() => setShowSuccessState(false)}
                className="px-6 py-2 border border-purple text-purple rounded-full hover:bg-purple hover:text-white transition-colors"
              >
                Buy More
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content area - 3/4 width */}
            <div className="lg:w-3/4">
              {/* Credit Usage Info - Show on packages tab only */}
              {activeTab === "packages" && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                  <h2 className="text-xl font-bold text-charcoal mb-4">
                    How Credits Work
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-mint/10 rounded-lg">
                      <div className="text-mint font-bold mb-2">
                        Chat Messages
                      </div>
                      <div className="text-2xl font-bold">
                        {CREDIT_COSTS.CHAT_MESSAGE}
                      </div>
                      <div className="text-sm text-gray-600">
                        credit per message
                      </div>
                    </div>
                    <div className="p-4 bg-purple/10 rounded-lg">
                      <div className="text-purple font-bold mb-2">
                        Image Analysis
                      </div>
                      <div className="text-2xl font-bold">
                        {CREDIT_COSTS.IMAGE_ANALYSIS}
                      </div>
                      <div className="text-sm text-gray-600">
                        credits per analysis
                      </div>
                    </div>
                    <div className="p-4 bg-blue-100 rounded-lg">
                      <div className="text-blue-600 font-bold mb-2">
                        Conference Hosting
                      </div>
                      <div className="text-2xl font-bold">
                        {CREDIT_COSTS.CONFERENCE_HOSTING}
                      </div>
                      <div className="text-sm text-gray-600">
                        credits per conference
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Credit History Component - Show on history tab only */}
              {activeTab === "history" && (
                <CreditHistoryTable limit={20} showAllLink={true} />
              )}

              {/* Credit Packages - Show on packages tab only */}
              {activeTab === "packages" && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                  <h2 className="text-xl font-bold text-charcoal mb-4">
                    Choose a Package
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {creditPackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`border rounded-lg p-5 cursor-pointer transition-all relative ${
                          selectedPackage === pkg.id
                            ? "border-mint shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleSelectPackage(pkg.id)}
                      >
                        {pkg.popular && (
                          <div className="absolute -top-3 -right-3 bg-purple text-white px-3 py-1 rounded-full text-xs">
                            Popular
                          </div>
                        )}
                        <h3 className="text-lg font-bold text-charcoal">
                          {pkg.name}
                        </h3>
                        <div className="text-2xl font-bold text-purple my-2">
                          {pkg.credits} credits
                        </div>
                        <div className="text-lg font-semibold text-charcoal mb-4">
                          ₦{pkg.price.toLocaleString()}
                        </div>
                        <ul className="text-sm text-gray-600 space-y-2 mb-4">
                          <li className="flex items-start">
                            <FaCheck className="text-mint mt-1 mr-2 flex-shrink-0" />
                            <span>{`${
                              pkg.credits / CREDIT_COSTS.CHAT_MESSAGE
                            } messages with AI`}</span>
                          </li>
                          <li className="flex items-start">
                            <FaCheck className="text-mint mt-1 mr-2 flex-shrink-0" />
                            <span>{`${Math.floor(
                              pkg.credits / CREDIT_COSTS.IMAGE_ANALYSIS
                            )} image analyses`}</span>
                          </li>
                          {pkg.credits >= CREDIT_COSTS.CONFERENCE_HOSTING && (
                            <li className="flex items-start">
                              <FaCheck className="text-mint mt-1 mr-2 flex-shrink-0" />
                              <span>{`${Math.floor(
                                pkg.credits / CREDIT_COSTS.CONFERENCE_HOSTING
                              )} conference hosting`}</span>
                            </li>
                          )}
                          <li className="flex items-start">
                            <FaCheck className="text-mint mt-1 mr-2 flex-shrink-0" />
                            <span>{pkg.description}</span>
                          </li>
                        </ul>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPackage(pkg.id);
                          }}
                          className="w-full py-2 bg-mint hover:bg-purple text-white rounded-full transition-colors flex items-center justify-center"
                        >
                          <FaCreditCard className="mr-2" />
                          Purchase Now
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checkout Button - Only show on packages tab */}
              {activeTab === "packages" && selectedPackage && (
                <div className="mt-10 text-center">
                  <button
                    onClick={() => setPurchaseModalOpen(true)}
                    disabled={isLoading}
                    className={`inline-flex items-center px-8 py-3 rounded-full font-semibold text-white transition-colors ${
                      isLoading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-mint hover:bg-purple"
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
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaCreditCard className="mr-2" />
                        Complete Purchase
                      </>
                    )}
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    Securely processed. Credits will be added instantly.
                  </p>
                </div>
              )}
            </div>

            {/* Right sidebar - FAQ */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-xl shadow-sm p-6 lg:sticky lg:top-24">
                <h2 className="text-xl font-bold text-charcoal mb-4">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-charcoal">
                      Do credits expire?
                    </h3>
                    <p className="text-gray-600 text-sm">
                      No, your credits will never expire as long as your account
                      remains active.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal">
                      Can I get a refund for unused credits?
                    </h3>
                    <p className="text-gray-600 text-sm">
                      We do not offer refunds for purchased credits, but they
                      never expire so you can use them at any time.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal">
                      What if I run out of credits during a session?
                    </h3>
                    <p className="text-gray-600 text-sm">
                      You'll be prompted to purchase more credits to continue
                      using premium features.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal">
                      Do you offer custom credit packages for institutions?
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Yes, we offer special credit packages for educational
                      institutions and research teams. Contact our support team
                      for details.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal">
                      How do credits compare to a subscription?
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Credits give you more flexibility than a subscription. Pay
                      only for what you use without monthly commitments or
                      recurring charges.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal">
                      Can I share credits with colleagues?
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Currently, credits are tied to individual accounts. For
                      team usage, we recommend our institutional packages.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditsPage;
