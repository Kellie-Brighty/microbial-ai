import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import MarketplaceDashboard from "../../components/marketplace/MarketplaceDashboard";
import { useAuth } from "../../context/AuthContext";
import AuthModal from "../../components/auth/AuthModal";
import { useState } from "react";
import { FaStore, FaUserMd, FaFlask, FaArrowRight } from "react-icons/fa";
import Notification from "../../components/ui/Notification";

const MarketplacePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notification, setNotification] = useState({
    type: "success" as "success" | "error" | "info",
    message: "",
    isVisible: false,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleAuthSuccess = (message: string) => {
    setNotification({
      type: "success",
      message,
      isVisible: true,
    });

    // Hide notification after 5 seconds
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, isVisible: false }));
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAuthModalOpen={() => setAuthModalOpen(true)} />

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

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        redirectPath="/marketplace"
      />

      <div className="bg-gradient-to-r from-mint to-purple py-12 mb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Microbial Marketplace
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Connect with experts, find lab equipment, and access specialized
              services
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <Link
                to="/marketplace/products"
                className="bg-white text-mint px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                Browse Lab Equipment <FaArrowRight className="ml-2" />
              </Link>
              <Link
                to="/marketplace/services"
                className="bg-white text-purple px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                Find Expert Services <FaArrowRight className="ml-2" />
              </Link>
            </div>

            {!currentUser && (
              <div className="mt-6">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-white bg-opacity-20 text-white px-8 py-3 rounded-full font-medium hover:bg-opacity-30 transition-colors"
                >
                  Sign In for Full Access
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mb-12">
        {currentUser ? (
          <MarketplaceDashboard />
        ) : (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-charcoal mb-4">
                Discover Our Marketplace Features
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto">
                Microbial Marketplace connects microbiologists with the
                resources they need. You can browse products as a guest, but
                signing in gives you access to more features.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="h-14 w-14 rounded-full bg-mint flex items-center justify-center mx-auto mb-6">
                  <FaStore className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-bold text-charcoal mb-4 text-center">
                  Lab Equipment Marketplace
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  Find and purchase laboratory equipment, consumables, and
                  supplies from verified vendors.
                </p>
                <Link
                  to="/marketplace/products"
                  className="w-full bg-mint text-white py-2 rounded-md hover:bg-purple transition-colors flex items-center justify-center"
                >
                  Browse Products <FaArrowRight className="ml-2" />
                </Link>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="h-14 w-14 rounded-full bg-purple flex items-center justify-center mx-auto mb-6">
                  <FaUserMd className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-bold text-charcoal mb-4 text-center">
                  Expert Services
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  Connect with microbiology experts for consultations, lab setup
                  assistance, and specialized services.
                </p>
                <Link
                  to="/marketplace/services"
                  className="w-full bg-purple text-white py-2 rounded-md hover:bg-mint transition-colors flex items-center justify-center"
                >
                  Browse Services <FaArrowRight className="ml-2" />
                </Link>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="h-14 w-14 rounded-full bg-mint flex items-center justify-center mx-auto mb-6">
                  <FaFlask className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-bold text-charcoal mb-4 text-center">
                  Become a Vendor or Expert
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  Share your expertise or sell lab equipment by joining our
                  marketplace as a verified vendor or expert.
                </p>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="w-full bg-mint text-white py-2 rounded-md hover:bg-purple transition-colors flex items-center justify-center"
                >
                  Sign In to Apply <FaArrowRight className="ml-2" />
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-blue-700">
                You're browsing as a guest. Sign in to add products to your
                cart, chat with vendors, or make purchases.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;
