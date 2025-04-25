import { useState, useEffect } from "react";
import { FaArrowLeft, FaCreditCard, FaCheck } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  getUserCredits,
  addCredits,
  CREDIT_COSTS,
} from "../utils/creditsSystem";
import Header from "../components/Header";
import AuthModal from "../components/auth/AuthModal";
import Notification, { NotificationType } from "../components/ui/Notification";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
  features?: string[];
}

const creditPackages: CreditPackage[] = [
  {
    id: "basic",
    name: "Basic",
    credits: 50,
    price: 1500,
    features: [
      `${50 / CREDIT_COSTS.CHAT_MESSAGE} messages with AI`,
      `${Math.floor(50 / CREDIT_COSTS.IMAGE_ANALYSIS)} image analyses`,
      "Perfect for occasional use",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    credits: 120,
    price: 3000,
    popular: true,
    features: [
      `${120 / CREDIT_COSTS.CHAT_MESSAGE} messages with AI`,
      `${Math.floor(120 / CREDIT_COSTS.IMAGE_ANALYSIS)} image analyses`,
      `${Math.floor(120 / CREDIT_COSTS.CONFERENCE_HOSTING)} conference hosting`,
      "Best value for regular users",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    credits: 300,
    price: 6000,
    features: [
      `${300 / CREDIT_COSTS.CHAT_MESSAGE} messages with AI`,
      `${Math.floor(300 / CREDIT_COSTS.IMAGE_ANALYSIS)} image analyses`,
      `${Math.floor(
        300 / CREDIT_COSTS.CONFERENCE_HOSTING
      )} conference hostings`,
      "Ideal for professional researchers",
    ],
  },
];

function CreditsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [credits, setCredits] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessState, setShowSuccessState] = useState(false);

  // Add state for AuthModal and notifications
  const [authModalOpen, setAuthModalOpen] = useState(false);
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
  };

  const handlePurchase = async () => {
    if (!currentUser || !selectedPackage) return;

    setIsLoading(true);

    try {
      // In a real app, this would be where you'd process payment
      // For now, we'll simulate adding credits to the account
      const packageDetails = creditPackages.find(
        (pkg) => pkg.id === selectedPackage
      );

      if (packageDetails) {
        const success = await addCredits(
          currentUser.uid,
          packageDetails.credits,
          "purchase",
          `Purchased ${packageDetails.name} credit package`
        );

        if (success) {
          // Update local credits state
          const updatedCredits = await getUserCredits(currentUser.uid);
          setCredits(updatedCredits);

          // Show success state
          setShowSuccessState(true);

          // Show notification
          showNotification(
            "success",
            `Successfully purchased ${packageDetails.credits} credits!`
          );

          // Reset after a delay
          setTimeout(() => {
            setShowSuccessState(false);
            setSelectedPackage(null);
          }, 3000);
        }
      }
    } catch (error) {
      console.error("Error purchasing credits:", error);
      showNotification(
        "error",
        "Failed to purchase credits. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
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
      <div className="container mx-auto px-4 py-12 pt-20">
        {/* Back button and title */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-purple hover:text-mint transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal mt-4">
            Purchase Credits
          </h1>
          {credits !== null && (
            <div className="mt-2 text-gray-600">
              Your current balance:{" "}
              <span className="font-semibold text-purple">
                {credits} credits
              </span>
            </div>
          )}
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
              {/* Credit Usage Info */}
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

              {/* Credit Packages */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {creditPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`bg-white rounded-xl overflow-hidden shadow-md transition-all ${
                      selectedPackage === pkg.id
                        ? "ring-2 ring-mint transform scale-105"
                        : "hover:shadow-lg"
                    } ${pkg.popular ? "relative" : ""}`}
                  >
                    {pkg.popular && (
                      <div className="absolute top-0 right-0 bg-mint text-white px-4 py-1 text-sm font-semibold">
                        Popular
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-charcoal mb-2">
                        {pkg.name}
                      </h3>
                      <div className="flex items-end mb-4">
                        <span className="text-3xl font-bold text-purple">
                          ₦{pkg.price.toLocaleString()}
                        </span>
                        <span className="text-gray-500 ml-1">/one-time</span>
                      </div>
                      <div className="bg-gray-100 p-2 rounded-md text-center mb-4">
                        <span className="font-semibold">
                          {pkg.credits} credits
                        </span>
                      </div>
                      <ul className="space-y-2 mb-6">
                        {pkg.features?.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <FaCheck className="text-mint mt-1 mr-2 flex-shrink-0" />
                            <span className="text-gray-600 text-sm">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleSelectPackage(pkg.id)}
                        className={`w-full py-2 rounded-full font-medium transition-colors ${
                          selectedPackage === pkg.id
                            ? "bg-mint text-white"
                            : "bg-gray-100 text-charcoal hover:bg-gray-200"
                        }`}
                      >
                        {selectedPackage === pkg.id ? "Selected" : "Select"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Button */}
              {selectedPackage && (
                <div className="mt-10 text-center">
                  <button
                    onClick={handlePurchase}
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
}

export default CreditsPage;
