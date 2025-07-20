import React, { useState, useEffect } from "react";
import { FaDollarSign, FaUsers, FaChartLine, FaSpinner } from "react-icons/fa";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../utils/firebase";

interface AuthorEarning {
  authorId: string;
  authorName: string;
  totalEarnings: number;
  totalCommission: number;
  lastUpdated: any;
}

interface EarningsTransaction {
  authorId: string;
  authorName: string;
  articleTitle: string;
  purchasePrice: number;
  authorEarnings: number;
  adminCommission: number;
  transactionDate: any;
}

const AuthorEarningsPage: React.FC = () => {
  const [authorEarnings, setAuthorEarnings] = useState<AuthorEarning[]>([]);
  const [transactions, setTransactions] = useState<EarningsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPlatformRevenue, setTotalPlatformRevenue] = useState(0);
  const [totalAuthorPayouts, setTotalAuthorPayouts] = useState(0);

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      setLoading(true);

      // Load author earnings
      const earningsRef = collection(db, "authorEarnings");
      const earningsSnapshot = await getDocs(earningsRef);
      const earningsData: AuthorEarning[] = [];

      earningsSnapshot.forEach((doc) => {
        const data = doc.data();
        earningsData.push({
          authorId: doc.id,
          authorName: data.authorName || "Unknown Author",
          totalEarnings: data.totalEarnings || 0,
          totalCommission: data.totalCommission || 0,
          lastUpdated: data.lastUpdated,
        });
      });

      setAuthorEarnings(earningsData);

      // Load transactions
      const transactionsRef = collection(db, "earningsTransactions");
      const transactionsQuery = query(
        transactionsRef,
        orderBy("transactionDate", "desc")
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsData: EarningsTransaction[] = [];

      transactionsSnapshot.forEach((doc) => {
        const data = doc.data();
        transactionsData.push({
          authorId: data.authorId,
          authorName: data.authorName || "Unknown Author",
          articleTitle: data.articleTitle,
          purchasePrice: data.purchasePrice || 0,
          authorEarnings: data.authorEarnings || 0,
          adminCommission: data.adminCommission || 0,
          transactionDate: data.transactionDate,
        });
      });

      setTransactions(transactionsData);

      // Calculate totals
      const totalRevenue = transactionsData.reduce(
        (sum, t) => sum + t.purchasePrice,
        0
      );
      const totalPayouts = transactionsData.reduce(
        (sum, t) => sum + t.authorEarnings,
        0
      );

      setTotalPlatformRevenue(totalRevenue);
      setTotalAuthorPayouts(totalPayouts);
    } catch (error) {
      console.error("Error loading earnings data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch (error) {
      return "Unknown date";
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <FaSpinner className="animate-spin text-mint text-3xl mb-4" />
            <p className="text-gray-500">Loading earnings data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-charcoal mb-2">
          Author Earnings & Revenue
        </h1>
        <p className="text-gray-600">
          Monitor platform revenue and author earnings
        </p>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <FaDollarSign className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Platform Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPlatformRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <FaUsers className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Author Payouts</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalAuthorPayouts)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <FaChartLine className="text-purple-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Platform Commission</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(totalPlatformRevenue - totalAuthorPayouts)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Author Earnings Table */}
      <div className="bg-white rounded-lg shadow-sm mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-charcoal">
            Author Earnings Summary
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Authors receive 80% of article sales, platform takes 20% commission
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Earnings (80%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform Commission (20%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {authorEarnings.map((earning) => (
                <tr key={earning.authorId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {earning.authorName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-green-600 font-medium">
                      {formatCurrency(earning.totalEarnings)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-purple-600 font-medium">
                      {formatCurrency(earning.totalCommission)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(earning.lastUpdated)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-charcoal">
            Recent Transactions
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Article
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author Earnings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.slice(0, 10).map((transaction, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.transactionDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.authorName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {transaction.articleTitle}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.purchasePrice)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-green-600 font-medium">
                      {formatCurrency(transaction.authorEarnings)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-purple-600 font-medium">
                      {formatCurrency(transaction.adminCommission)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuthorEarningsPage;
