import React, { useState } from "react";
import { FaTimes, FaSpinner, FaCheckCircle } from "react-icons/fa";
import { usePaystackPayment } from "react-paystack";
import { purchaseArticle } from "../../utils/firebase";
import { useAuth } from "../../context/AuthContext";

interface ArticlePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  article: {
    id: string;
    title: string;
    price: number;
  };
}

const ArticlePaymentModal: React.FC<ArticlePaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  article,
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const config = {
    reference: `article_${article.id}_${Date.now()}`,
    email: currentUser?.email || "",
    amount: article.price * 100, // Paystack expects amount in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
    metadata: {
      custom_fields: [
        {
          display_name: "Article ID",
          variable_name: "article_id",
          value: article.id,
        },
        {
          display_name: "Article Title",
          variable_name: "article_title",
          value: article.title,
        },
        {
          display_name: "User ID",
          variable_name: "user_id",
          value: currentUser?.uid || "anonymous",
        },
      ],
    },
  };

  const onSuccessCallback = async (_response: any) => {
    setLoading(true);
    try {
      // Process the purchase
      await purchaseArticle(currentUser!.uid, article.id);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error processing purchase:", error);
    } finally {
      setLoading(false);
    }
  };

  const onCloseCallback = () => {
    onClose();
  };

  const initializePayment = usePaystackPayment(config);

  const handlePayment = () => {
    initializePayment({
      onSuccess: onSuccessCallback,
      onClose: onCloseCallback,
    } as any);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-charcoal">
            Purchase Article
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-600 mb-2">
              Payment Successful!
            </h3>
            <p className="text-gray-600">
              You now have access to "{article.title}"
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="font-medium text-charcoal mb-2">
                {article.title}
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Article Price:</span>
                  <span className="text-lg font-semibold text-purple-600">
                    ₦{article.price}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Author Earnings (80%):</span>
                  <span className="text-sm text-gray-500">
                    ₦{(article.price * 0.8).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Platform Fee (20%):</span>
                  <span className="text-sm text-gray-500">
                    ₦{(article.price * 0.2).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-800 mb-2">
                Payment Information
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Secure payment via Paystack</li>
                <li>• Author receives 80% of the purchase price</li>
                <li>• Platform fee covers operational costs</li>
                <li>• Lifetime access to the article</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="px-8 py-4 bg-mint text-white rounded-lg hover:bg-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-bold text-lg shadow-xl border-2 border-purple"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  `Pay ₦${article.price}`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlePaymentModal;
