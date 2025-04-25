import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCreditHistory } from "../../utils/creditsSystem";
import {
  FiClock,
  FiDollarSign,
  FiPlus,
  FiMinus,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { format } from "date-fns";

// Define the credit history entry interface
interface CreditHistoryEntry {
  amount: number;
  type: string;
  description: string;
  timestamp: string;
}

interface CreditHistoryTableProps {
  limit?: number;
  showAllLink?: boolean;
}

const CreditHistoryTable: React.FC<CreditHistoryTableProps> = ({
  limit = 10,
  showAllLink = true,
}) => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<CreditHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchCreditHistory = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const creditHistory = await getCreditHistory(currentUser.uid);
        // Sort by timestamp (newest first)
        const sortedHistory = [...creditHistory].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setHistory(sortedHistory);
      } catch (err) {
        console.error("Error fetching credit history:", err);
        setError("Failed to load credit history. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreditHistory();
  }, [currentUser]);

  // Format timestamp to readable date
  const formatDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d, yyyy h:mm a");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Get icon and color based on transaction type
  const getTransactionDetails = (entry: CreditHistoryEntry) => {
    if (entry.amount > 0) {
      return {
        icon: <FiPlus className="text-green-500" />,
        colorClass: "text-green-600",
        bgClass: "bg-green-50",
        label: "Added",
      };
    } else {
      return {
        icon: <FiMinus className="text-red-500" />,
        colorClass: "text-red-600",
        bgClass: "bg-red-50",
        label: "Used",
      };
    }
  };

  // Get display name for the transaction type
  const getTypeDisplayName = (type: string) => {
    const typeMap: Record<string, string> = {
      welcome_bonus: "Welcome Bonus",
      purchase: "Purchase",
      chat_message: "Chat Message",
      image_analysis: "Image Analysis",
      conference_hosting: "Conference",
      reward: "Reward",
    };

    return typeMap[type.toLowerCase()] || type;
  };

  // Calculate how many entries to display
  const displayEntries = showAll ? history : history.slice(0, limit);

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-lg">
        <FiClock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          No transaction history
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Your credit transactions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
          <FiDollarSign className="mr-2 text-mint" /> Credit Transaction History
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          View your recent credit transactions
        </p>
      </div>
      <div className="border-t border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayEntries.map((entry, index) => {
                const { colorClass } = getTransactionDetails(entry);
                return (
                  <tr key={`${entry.timestamp}-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {getTypeDisplayName(entry.type)}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${colorClass}`}
                    >
                      {entry.amount > 0 ? "+" : ""}
                      {entry.amount} credits
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(entry.timestamp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {history.length > limit && showAllLink && !showAll && (
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center px-4 py-2 border border-mint rounded-md shadow-sm text-sm font-medium text-mint bg-white hover:bg-mint hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint transition-colors"
          >
            <FiArrowDown className="mr-2 -ml-1 h-5 w-5" />
            Show all transactions
          </button>
        </div>
      )}

      {showAll && history.length > limit && (
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button
            onClick={() => setShowAll(false)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint"
          >
            <FiArrowUp className="mr-2 -ml-1 h-5 w-5" />
            Show less
          </button>
        </div>
      )}
    </div>
  );
};

export default CreditHistoryTable;
