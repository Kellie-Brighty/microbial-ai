import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { GiDna1 } from "react-icons/gi";

interface ProfilePageProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  const [preferredTopics, setPreferredTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState("");
  const [notes, setNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Load user profile data when component mounts
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || "");
      setInterests(userProfile.interests || []);
      setPreferredTopics(userProfile.preferredTopics || []);
      setNotes(userProfile.notes || "");
    }
  }, [userProfile]);

  if (!isOpen || !currentUser) return null;

  const handleAddInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput("");
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const handleAddTopic = () => {
    if (topicInput.trim() && !preferredTopics.includes(topicInput.trim())) {
      setPreferredTopics([...preferredTopics, topicInput.trim()]);
      setTopicInput("");
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setPreferredTopics(preferredTopics.filter((t) => t !== topic));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");
    setLoading(true);

    try {
      const success = await updateUserProfile({
        displayName,
        interests,
        preferredTopics,
        notes,
      });

      if (success) {
        setSuccessMessage("Profile updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage("Failed to update profile. Please try again.");
      }
    } catch (error) {
      setErrorMessage("An error occurred while updating your profile.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
      <div
        className="relative bg-white rounded-lg shadow-md p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="flex items-center mb-6">
          <div className="p-3 bg-mint rounded-full text-white mr-4">
            <GiDna1 size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-charcoal">Your Profile</h2>
            <p className="text-gray-600 text-sm">
              Customize your Microbial AI experience
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={currentUser.email || ""}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Interests
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                placeholder="Add an interest..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-mint"
              />
              <button
                type="button"
                onClick={handleAddInterest}
                className="bg-mint text-white px-4 py-2 rounded-r-md hover:bg-purple transition-colors"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {interests.map((interest, index) => (
                <div
                  key={index}
                  className="bg-gray-100 px-3 py-1 rounded-full flex items-center"
                >
                  <span className="text-sm">{interest}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(interest)}
                    className="ml-2 text-gray-500 hover:text-red-500"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {interests.length === 0 && (
                <p className="text-gray-500 text-sm">No interests added yet</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Microbiology Topics
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Add a topic..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-mint"
              />
              <button
                type="button"
                onClick={handleAddTopic}
                className="bg-mint text-white px-4 py-2 rounded-r-md hover:bg-purple transition-colors"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {preferredTopics.map((topic, index) => (
                <div
                  key={index}
                  className="bg-gray-100 px-3 py-1 rounded-full flex items-center"
                >
                  <span className="text-sm">{topic}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(topic)}
                    className="ml-2 text-gray-500 hover:text-red-500"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {preferredTopics.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No preferred topics added yet
                </p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Personal Notes (for AI context)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any additional context you'd like the AI to know about you..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-mint text-white rounded-md hover:bg-purple transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
