import React, { useState } from "react";
import { FiX, FiCreditCard, FiCheck, FiAlertCircle } from "react-icons/fi";
import PaystackPayment, {
  CreditPackage,
  creditPackages,
} from "./PaystackPayment";
import { useAuth } from "../../context/AuthContext";
import { getUserCredits } from "../../utils/creditsSystem";

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage>(
    creditPackages[1]
  ); // Default to Standard
  const [showPayment, setShowPayment] = useState(false);
  const [currentCredits, setCurrentCredits] = useState<number | null>(null);

  // Load user current credits when modal opens
  React.useEffect(() => {
    const loadUserCredits = async () => {
      if (currentUser) {
        try {
          const credits = await getUserCredits(currentUser.uid);
          setCurrentCredits(credits);
        } catch (error) {
          console.error("Error loading user credits:", error);
        }
      }
    };

    if (isOpen && currentUser) {
      loadUserCredits();
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
  };

  const handleProceedToPayment = () => {
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (credits: number) => {
    // Refresh current credits
    if (currentUser) {
      const updatedCredits = await getUserCredits(currentUser.uid);
      setCurrentCredits(updatedCredits);
    }

    // Show success notification
    onSuccess(`Successfully purchased ${credits} credits!`);

    // Keep the payment UI visible (don't reset showPayment)
    // The user can manually close the modal or continue
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  const handleClose = () => {
    onClose();
    // Reset state when closing
    setShowPayment(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-charcoal rounded-xl max-w-md w-full shadow-2xl overflow-hidden relative my-8">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-charcoal z-10">
          <h2 className="text-xl font-semibold text-charcoal dark:text-white flex items-center">
            <FiCreditCard className="mr-2 text-mint" />
            Purchase Credits
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-5">
          {/* Current credits display */}
          {currentUser && currentCredits !== null && (
            <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-gray-600 dark:text-gray-300 text-sm flex items-center">
                <span className="font-medium">Current Balance:</span>
                <span className="ml-2 bg-mint text-white px-2 py-0.5 rounded-full text-xs">
                  {currentCredits} credits
                </span>
              </p>
            </div>
          )}

          {!showPayment ? (
            <>
              {/* Package selection */}
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Select a credit package that suits your needs:
              </p>

              <div className="space-y-3">
                {creditPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      selectedPackage.id === pkg.id
                        ? "border-mint dark:border-mint bg-mint bg-opacity-5"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                    onClick={() => handlePackageSelect(pkg)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium flex items-center">
                          {pkg.name}
                          {pkg.popular && (
                            <span className="ml-2 bg-purple text-white text-xs px-2 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {pkg.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-charcoal dark:text-white">
                          {pkg.credits} credits
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          ₦{pkg.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {selectedPackage.id === pkg.id && (
                      <div className="mt-1 text-mint flex items-center text-sm">
                        <FiCheck className="mr-1" /> Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Proceed button */}
              <button
                onClick={handleProceedToPayment}
                className="w-full bg-mint hover:bg-purple text-white py-3 px-4 rounded-lg mt-5 transition-colors flex items-center justify-center"
              >
                Proceed to Payment
              </button>

              {/* Information note */}
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-start">
                <FiAlertCircle className="mr-1 flex-shrink-0 mt-0.5" />
                <p>
                  Payments are securely processed by Paystack. Your credits will
                  be added instantly to your account after successful payment.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Payment section */}
              <div className="mb-4">
                <h3 className="font-medium text-lg mb-2">Confirm Purchase</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedPackage.name} Package
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedPackage.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-charcoal dark:text-white">
                      {selectedPackage.credits} credits
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      ₦{selectedPackage.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Paystack payment component */}
              <PaystackPayment
                selectedPackage={selectedPackage}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
                email={currentUser?.email || "user@example.com"}
              />

              {/* Back button */}
              <button
                onClick={handlePaymentCancel}
                className="w-full text-gray-600 dark:text-gray-300 py-2 mt-3 text-sm hover:underline"
              >
                ← Back to packages
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditPurchaseModal;
