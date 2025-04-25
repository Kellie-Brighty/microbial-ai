import React, { useState } from "react";
import { usePaystackPayment } from "react-paystack";
import { useAuth } from "../../context/AuthContext";
import { FiCreditCard, FiCheck } from "react-icons/fi";
import { addCredits } from "../../utils/creditsSystem";

// Define the credit package types
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // in your currency (e.g., Naira)
  description: string;
  popular?: boolean;
}

// Sample credit packages
export const creditPackages: CreditPackage[] = [
  {
    id: "basic",
    name: "Basic",
    credits: 100,
    price: 2000,
    description: "Perfect for casual users",
  },
  {
    id: "standard",
    name: "Standard",
    credits: 300,
    price: 5000,
    description: "Most popular option",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    credits: 700,
    price: 10000,
    description: "For regular users",
  },
  {
    id: "professional",
    name: "Professional",
    credits: 1500,
    price: 20000,
    description: "Best value for power users",
  },
];

interface PaystackPaymentProps {
  selectedPackage: CreditPackage;
  onSuccess: (credits: number) => void;
  onCancel: () => void;
  email: string;
}

const PaystackPayment: React.FC<PaystackPaymentProps> = ({
  selectedPackage,
  onSuccess,
  onCancel,
  email,
}) => {
  const { currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Configure Paystack
  const config = {
    reference: new Date().getTime().toString(),
    email: email,
    amount: selectedPackage.price * 100, // Paystack amount is in kobo (x100)
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
    metadata: {
      custom_fields: [
        {
          display_name: "Credit Package",
          variable_name: "credit_package",
          value: selectedPackage.id,
        },
        {
          display_name: "User ID",
          variable_name: "user_id",
          value: currentUser?.uid || "anonymous",
        },
      ],
    },
  };

  // Initialize Paystack payment
  const initializePayment = usePaystackPayment(config);

  // When payment is successful
  const handlePaymentSuccess = async (reference: any) => {
    setIsProcessing(true);

    try {
      if (currentUser) {
        // Add the credits to the user's account
        await addCredits(
          currentUser.uid,
          selectedPackage.credits,
          `Purchased ${selectedPackage.name} package (${selectedPackage.credits} credits)`
        );

        // Update the UI
        setIsComplete(true);
        setIsProcessing(false);

        // Callback to parent component
        onSuccess(selectedPackage.credits);
      }
    } catch (error) {
      console.error("Error adding credits after payment:", error);
      setIsProcessing(false);
      alert(
        "Payment was successful but there was an issue adding credits. Please contact support with reference: " +
          reference.reference
      );
    }
  };

  // When payment is closed without completing
  const handlePaymentClose = () => {
    onCancel();
  };

  // Start the payment process
  const startPayment = () => {
    initializePayment({
      onSuccess: handlePaymentSuccess,
      onClose: handlePaymentClose,
    } as any);
  };

  return (
    <div className="mt-4">
      {isComplete ? (
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="flex justify-center mb-2">
            <div className="bg-green-100 rounded-full p-2">
              <FiCheck className="text-green-600 text-xl" />
            </div>
          </div>
          <h3 className="text-green-800 font-medium mb-1">
            Payment Successful!
          </h3>
          <p className="text-green-600 text-sm">
            {selectedPackage.credits} credits have been added to your account.
          </p>
        </div>
      ) : (
        <button
          onClick={startPayment}
          disabled={isProcessing}
          className={`w-full bg-mint hover:bg-purple text-white py-3 px-4 rounded-lg flex items-center justify-center transition-colors ${
            isProcessing ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isProcessing ? (
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
              <FiCreditCard className="mr-2" />
              Pay ₦{selectedPackage.price.toLocaleString()}
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default PaystackPayment;
