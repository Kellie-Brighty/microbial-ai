import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CREDIT_COSTS } from "../../utils/creditsSystem";
import CreditPurchaseModal from "../payment/CreditPurchaseModal";

interface CreditWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditCost: number;
  currentCredits: number | null;
  actionType: keyof typeof CREDIT_COSTS;
  onPurchase?: () => void; // Optional callback for parent to handle purchase
}

const CreditWarningModal: React.FC<CreditWarningModalProps> = ({
  isOpen,
  onClose,
  creditCost,
  currentCredits,
  actionType,
  onPurchase,
}) => {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  if (!isOpen && !showPurchaseModal) return null;

  const actionTypeReadable = actionType
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const handlePurchaseSuccess = (_message: string) => {
    // Close both modals
    setShowPurchaseModal(false);
    onClose();
  };

  const handleBuyCredits = () => {
    if (onPurchase) {
      // Use the parent-provided handler if available
      onPurchase();
    } else {
      // First hide the warning modal, then show the purchase modal
      // But don't fully close the component
      setShowPurchaseModal(true);
      onClose();
    }
  };

  return (
    <>
      {/* Purchase Credits Modal - only shown if onPurchase is not provided */}
      {!onPurchase && showPurchaseModal && (
        <CreditPurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 text-center animate-fadeIn">
            <div className="bg-amber-500 text-white p-3 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-charcoal mb-3">
              Insufficient Credits
            </h2>
            <p className="text-gray-600 mb-2">
              You don't have enough credits to perform this {actionTypeReadable}
              .
            </p>
            <p className="text-gray-500 mb-6 text-sm">
              {actionTypeReadable} requires {creditCost} credits.
              {currentCredits !== null &&
                ` You currently have ${currentCredits} credits.`}
            </p>
            <div className="flex flex-col space-y-3 justify-center max-w-xs mx-auto">
              <button
                onClick={onClose}
                className="px-5 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBuyCredits}
                className="px-5 py-2 bg-mint text-white rounded-full hover:bg-purple transition-colors flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                Buy Credits Now
              </button>
              <Link
                to="/credits"
                className="px-5 py-2 border border-mint text-mint hover:bg-mint hover:text-white rounded-full transition-colors text-center"
              >
                View Credit Packages
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreditWarningModal;
