import React, { useState, useEffect } from "react";
import {
  FiUsers,
  FiSearch,
  FiRefreshCw,
  FiChevronRight,
  FiChevronLeft,
  FiGift,
  FiCheck,
  FiAlertTriangle,
  FiX,
} from "react-icons/fi";
import {
  getUsers,
  UserWithCredits,
  sendCreditsToUser,
  sendCreditsToBulkUsers,
} from "../../utils/adminUtils";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

// Modal component for gifting credits to a single user
interface GiftCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithCredits | null;
  onSendCredits: (
    userId: string,
    amount: number,
    reason: string
  ) => Promise<boolean>;
}

const GiftCreditModal: React.FC<GiftCreditModalProps> = ({
  isOpen,
  onClose,
  user,
  onSendCredits,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setAmount(0);
      setReason("");
      setError("");
      setSuccess(false);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!user) return;
    if (amount <= 0) {
      setError("Credit amount must be greater than 0");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const result = await onSendCredits(user.uid, amount, reason);
      if (result) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError("Failed to send credits. Please try again.");
      }
    } catch (err) {
      setError(
        "An error occurred: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="bg-purple text-white p-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <FiGift className="mr-2" /> Gift Credits
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <FiX size={24} />
          </button>
        </div>
        <div className="p-5">
          {success ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <FiCheck className="text-green-500 text-2xl" />
              </div>
              <p className="text-green-600 font-medium text-center">
                Successfully sent {amount} credits to {user?.displayName}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex items-center bg-gray-100 p-3 rounded-lg mb-4">
                  <div className="w-10 h-10 bg-purple rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-semibold">
                      {user?.displayName?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{user?.displayName}</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                    <p className="text-xs text-gray-500">
                      Current credits: {user?.credits}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Credit Amount
                </label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent"
                  placeholder="Enter amount"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent"
                  placeholder="Enter reason for gifting credits"
                  rows={3}
                ></textarea>
              </div>

              {error && (
                <div className="mb-4 text-red-500 flex items-center text-sm">
                  <FiAlertTriangle className="mr-1" /> {error}
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing || amount <= 0}
                  className={`px-4 py-2 bg-purple text-white rounded-lg ${
                    isProcessing || amount <= 0
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-opacity-90"
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <FiRefreshCw className="animate-spin mr-2" />{" "}
                      Processing...
                    </span>
                  ) : (
                    "Send Credits"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal component for bulk sending credits to multiple users
interface BulkGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUsers: UserWithCredits[];
  onSendBulkCredits: (
    userIds: string[],
    amount: number,
    reason: string
  ) => Promise<{
    successful: number;
    failed: number;
  }>;
}

const BulkGiftModal: React.FC<BulkGiftModalProps> = ({
  isOpen,
  onClose,
  selectedUsers,
  onSendBulkCredits,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<{
    successful: number;
    failed: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(0);
      setReason("");
      setError("");
      setResult(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) return;
    if (amount <= 0) {
      setError("Credit amount must be greater than 0");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const userIds = selectedUsers.map((user) => user.uid);
      const result = await onSendBulkCredits(userIds, amount, reason);
      setResult(result);
      if (result.failed === 0) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(
        "An error occurred: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="bg-purple text-white p-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <FiGift className="mr-2" /> Bulk Gift Credits
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <FiX size={24} />
          </button>
        </div>
        <div className="p-5">
          {result ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <FiCheck className="text-green-500 text-2xl" />
              </div>
              <p className="text-green-600 font-medium text-center mb-2">
                Credits sent to {result.successful} users
              </p>
              {result.failed > 0 && (
                <p className="text-red-500 text-sm text-center">
                  Failed to send to {result.failed} users
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="bg-gray-100 p-3 rounded-lg mb-4">
                  <p className="font-medium flex items-center">
                    <FiUsers className="mr-2 text-purple" />
                    Sending to {selectedUsers.length} user
                    {selectedUsers.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Each user will receive the same amount of credits
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Credit Amount (per user)
                </label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent"
                  placeholder="Enter amount"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent"
                  placeholder="Enter reason for gifting credits"
                  rows={3}
                ></textarea>
              </div>

              {error && (
                <div className="mb-4 text-red-500 flex items-center text-sm">
                  <FiAlertTriangle className="mr-1" /> {error}
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing || amount <= 0}
                  className={`px-4 py-2 bg-purple text-white rounded-lg ${
                    isProcessing || amount <= 0
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-opacity-90"
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <FiRefreshCw className="animate-spin mr-2" />{" "}
                      Processing...
                    </span>
                  ) : (
                    "Send Credits"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Credit Management component
const CreditManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithCredits[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithCredits | null>(
    null
  );
  const [showBulkGiftModal, setShowBulkGiftModal] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
    isVisible: boolean;
  }>({
    message: "",
    type: "info",
    isVisible: false,
  });

  const loadUsers = async (reset = false) => {
    setLoading(true);
    try {
      const docToStartAfter = reset ? undefined : lastDoc || undefined;
      const result = await getUsers(20, docToStartAfter, searchTerm);

      if (reset) {
        setUsers(result.users);
        setPage(1);
      } else {
        setUsers((prev) => [...prev, ...result.users]);
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.users.length === 20);
    } catch (error) {
      console.error("Error loading users:", error);
      showNotification("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(true);
  }, []);

  const handleSearch = () => {
    loadUsers(true);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleNextPage = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
      loadUsers();
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      // This is a simplified approach - proper pagination would require keeping track of all page markers
      // For a production app, consider using a more robust pagination strategy
      window.location.reload();
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map((user) => user.uid));
    }
  };

  const openGiftModal = (user: UserWithCredits) => {
    setSelectedUser(user);
    setShowGiftModal(true);
  };

  const openBulkGiftModal = () => {
    if (selectedUserIds.length === 0) {
      showNotification("Please select at least one user", "error");
      return;
    }
    setShowBulkGiftModal(true);
  };

  const handleSendCredits = async (
    userId: string,
    amount: number,
    reason: string
  ) => {
    const result = await sendCreditsToUser(userId, amount, reason);
    if (result) {
      // Update the user's credits in the local state
      setUsers((prev) =>
        prev.map((user) =>
          user.uid === userId
            ? { ...user, credits: user.credits + amount }
            : user
        )
      );
    }
    return result;
  };

  const handleSendBulkCredits = async (
    userIds: string[],
    amount: number,
    reason: string
  ) => {
    const result = await sendCreditsToBulkUsers(userIds, amount, reason);

    if (result.successful > 0) {
      // Update credits for successful users in the local state
      setUsers((prev) =>
        prev.map((user) =>
          userIds.includes(user.uid)
            ? { ...user, credits: user.credits + amount }
            : user
        )
      );

      // Clear selection
      setSelectedUserIds([]);
    }

    return result;
  };

  const showNotification = (
    message: string,
    type: "success" | "error" | "info"
  ) => {
    setNotification({
      message,
      type,
      isVisible: true,
    });

    setTimeout(() => {
      setNotification((prev) => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-purple mb-2 flex items-center">
          <FiGift className="mr-2" /> Credit Management
        </h1>
        <p className="text-gray-600">
          Send credits to users as gifts or rewards
        </p>
      </div>

      {/* Notification */}
      {notification.isVisible && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            notification.type === "success"
              ? "bg-green-500"
              : notification.type === "error"
              ? "bg-red-500"
              : "bg-blue-500"
          } text-white`}
        >
          {notification.message}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users by name"
              className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-purple text-white rounded-lg hover:bg-opacity-90"
          >
            Search
          </button>
          <button
            onClick={() => {
              setSearchTerm("");
              loadUsers(true);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center"
          >
            <FiRefreshCw className="mr-2" /> Reset
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={
                selectedUserIds.length === users.length && users.length > 0
              }
              onChange={handleSelectAll}
              className="mr-2 h-4 w-4 text-purple"
            />
            <span className="text-sm">
              {selectedUserIds.length} user
              {selectedUserIds.length !== 1 ? "s" : ""} selected
            </span>
          </div>
          <button
            onClick={openBulkGiftModal}
            disabled={selectedUserIds.length === 0}
            className={`px-4 py-2 rounded-lg flex items-center ${
              selectedUserIds.length === 0
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-purple text-white hover:bg-opacity-90"
            }`}
          >
            <FiGift className="mr-2" /> Gift Credits to Selected Users
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={
                    selectedUserIds.length === users.length && users.length > 0
                  }
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-purple"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center">
                    <FiRefreshCw className="animate-spin mr-2" /> Loading
                    users...
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.uid)}
                      onChange={() => handleUserSelect(user.uid)}
                      className="h-4 w-4 text-purple"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-purple rounded-full flex items-center justify-center text-white">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          user.displayName?.charAt(0) || "?"
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.displayName}
                        </div>
                        {user.lastLogin && (
                          <div className="text-xs text-gray-500">
                            Last login:{" "}
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple bg-opacity-10 text-purple">
                      {user.credits}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openGiftModal(user)}
                      className="text-purple hover:text-indigo-900 mr-4 flex items-center"
                    >
                      <FiGift className="mr-1" /> Gift Credits
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-700">Page {page}</span>
          <div className="flex space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={page === 1 || loading}
              className={`px-3 py-1 rounded flex items-center text-sm ${
                page === 1 || loading
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-purple text-white hover:bg-opacity-90"
              }`}
            >
              <FiChevronLeft className="mr-1" /> Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={!hasMore || loading}
              className={`px-3 py-1 rounded flex items-center text-sm ${
                !hasMore || loading
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-purple text-white hover:bg-opacity-90"
              }`}
            >
              Next <FiChevronRight className="ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Gift Credit Modal */}
      <GiftCreditModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        user={selectedUser}
        onSendCredits={handleSendCredits}
      />

      {/* Bulk Gift Modal */}
      <BulkGiftModal
        isOpen={showBulkGiftModal}
        onClose={() => setShowBulkGiftModal(false)}
        selectedUsers={users.filter((user) =>
          selectedUserIds.includes(user.uid)
        )}
        onSendBulkCredits={handleSendBulkCredits}
      />
    </div>
  );
};

export default CreditManagement;
