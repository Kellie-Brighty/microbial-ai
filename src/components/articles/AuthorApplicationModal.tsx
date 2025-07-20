import React, { useState } from "react";
import {
  FaTimes,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { submitAuthorApplication } from "../../utils/firebase";

interface AuthorApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthorApplicationModal: React.FC<AuthorApplicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    credentials: "",
    expertiseAreas: [] as string[],
    sampleWriting: "",
    motivation: "",
  });

  const expertiseOptions = [
    "Microbiology",
    "Health & Wellness",
    "Scientific Research",
    "Laboratory Techniques",
    "Disease Prevention",
    "Nutrition",
    "Environmental Science",
    "Biotechnology",
    "Medical Microbiology",
    "Industrial Microbiology",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setError("");

    try {
      await submitAuthorApplication(currentUser.uid, formData);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExpertiseChange = (expertise: string) => {
    setFormData((prev) => ({
      ...prev,
      expertiseAreas: prev.expertiseAreas.includes(expertise)
        ? prev.expertiseAreas.filter((area) => area !== expertise)
        : [...prev.expertiseAreas, expertise],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-charcoal">
            Apply for Author Role
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
              Application Submitted Successfully!
            </h3>
            <p className="text-gray-600">
              Your application has been submitted and is under review. You'll
              receive a notification once it's been processed.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
                <FaExclamationCircle className="text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credentials & Experience *
              </label>
              <textarea
                required
                value={formData.credentials}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    credentials: e.target.value,
                  }))
                }
                placeholder="Please describe your educational background, professional experience, and any relevant certifications..."
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mint resize-none"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Areas of Expertise *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {expertiseOptions.map((expertise) => (
                  <label key={expertise} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.expertiseAreas.includes(expertise)}
                      onChange={() => handleExpertiseChange(expertise)}
                      className="rounded border-gray-300 text-mint focus:ring-mint"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {expertise}
                    </span>
                  </label>
                ))}
              </div>
              {formData.expertiseAreas.length === 0 && (
                <p className="text-red-500 text-sm mt-1">
                  Please select at least one area of expertise
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sample Writing *
              </label>
              <textarea
                required
                value={formData.sampleWriting}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sampleWriting: e.target.value,
                  }))
                }
                placeholder="Please provide a sample of your writing (300-500 words) on a microbiology or health-related topic..."
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mint resize-none"
                rows={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivation for Becoming an Author *
              </label>
              <textarea
                required
                value={formData.motivation}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    motivation: e.target.value,
                  }))
                }
                placeholder="Please explain why you want to become an author on our platform and what value you can bring to our community..."
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mint resize-none"
                rows={4}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-medium text-blue-800 mb-2">
                What happens next?
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>
                  • Your application will be reviewed by our team within 3-5
                  business days
                </li>
                <li>
                  • You'll receive an email notification with the decision
                </li>
                <li>
                  • If approved, you'll gain access to publish articles and earn
                  royalties
                </li>
                <li>• You can start writing immediately upon approval</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.expertiseAreas.length === 0}
                className="px-6 py-2 bg-mint text-white rounded-md hover:bg-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthorApplicationModal;
 