import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../../utils/firebase";
import {
  FiUsers,
  FiMessageSquare,
  FiImage,
  FiActivity,
  FiLogOut,
  FiClock,
  FiCalendar,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getActivityByType,
  getHourlyVisits,
} from "../../utils/activityTracking";

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: Timestamp;
  details?: any;
}

interface UserStats {
  totalUsers: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  newUsersToday: number;
}

interface ActivityStats {
  totalMessages: number;
  totalThreads: number;
  totalImageAnalysis: number;
  messagesByHour: { name: string; value: number }[];
  activityByType: { name: string; value: number }[];
}

const COLORS = ["#00C9A7", "#845EC2", "#D65DB1", "#FF9671", "#FFC75F"];

// Action display component for debugging
const ActionDisplay = ({ action }: { action: any }) => {
  const actionValue =
    action === undefined || action === null
      ? "Unknown"
      : typeof action === "string"
      ? action
      : typeof action === "object"
      ? JSON.stringify(action)
      : String(action);

  // Debug info
  console.log("ActionDisplay:", {
    action,
    actionValue,
    type: typeof action,
  });

  return (
    <span className="px-2 py-1 text-xs rounded-full bg-opacity-10 bg-mint text-mint">
      {actionValue}
    </span>
  );
};

const ActivityDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsersToday: 0,
    activeUsersWeek: 0,
    newUsersToday: 0,
  });
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    totalMessages: 0,
    totalThreads: 0,
    totalImageAnalysis: 0,
    messagesByHour: [],
    activityByType: [],
  });
  const [timeFilter, setTimeFilter] = useState<"day" | "week" | "month">("day");

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    navigate("/admin");
  };

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      // Get total user count
      const usersCol = collection(db, "users");
      const userCountSnapshot = await getCountFromServer(usersCol);
      const totalUsers = userCountSnapshot.data().count;

      // Get active users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);

      const activeUsersQuery = query(
        collection(db, "userActivity"),
        where("lastActive", ">=", todayTimestamp)
      );
      const activeUsersSnapshot = await getCountFromServer(activeUsersQuery);
      const activeUsersToday = activeUsersSnapshot.data().count;

      // Get active users this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekTimestamp = Timestamp.fromDate(oneWeekAgo);

      const weeklyUsersQuery = query(
        collection(db, "userActivity"),
        where("lastActive", ">=", weekTimestamp)
      );
      const weeklyUsersSnapshot = await getCountFromServer(weeklyUsersQuery);
      const activeUsersWeek = weeklyUsersSnapshot.data().count;

      // Get new users today
      const newUsersQuery = query(
        collection(db, "users"),
        where("createdAt", ">=", todayTimestamp)
      );
      const newUsersSnapshot = await getCountFromServer(newUsersQuery);
      const newUsersToday = newUsersSnapshot.data().count;

      setUserStats({
        totalUsers,
        activeUsersToday,
        activeUsersWeek,
        newUsersToday,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  // Fetch activity statistics
  const fetchActivityStats = async () => {
    try {
      // Get message count
      const messagesCol = collection(db, "messages");
      const messageCountSnapshot = await getCountFromServer(messagesCol);
      const totalMessages = messageCountSnapshot.data().count;

      // Get thread count
      const threadsCol = collection(db, "threads");
      const threadCountSnapshot = await getCountFromServer(threadsCol);
      const totalThreads = threadCountSnapshot.data().count;

      // Get image analysis count
      const imageAnalysisCol = collection(db, "imageAnalysis");
      const imageAnalysisSnapshot = await getCountFromServer(imageAnalysisCol);
      const totalImageAnalysis = imageAnalysisSnapshot.data().count;

      // Get hourly visit data
      const messagesByHour = await getHourlyVisits();

      // Get activity by type
      let activityByType = await getActivityByType(
        timeFilter === "day" ? 1 : timeFilter === "week" ? 7 : 30
      );

      // If no activity data, use placeholder data
      if (activityByType.length === 0) {
        activityByType = [
          { name: "Chat Messages", value: totalMessages },
          { name: "New Threads", value: totalThreads },
          { name: "Image Analysis", value: totalImageAnalysis },
          {
            name: "Community Posts",
            value: Math.floor(Math.random() * 100) + 50,
          },
          { name: "User Logins", value: Math.floor(Math.random() * 200) + 100 },
        ];
      }

      setActivityStats({
        totalMessages,
        totalThreads,
        totalImageAnalysis,
        messagesByHour,
        activityByType,
      });
    } catch (error) {
      console.error("Error fetching activity stats:", error);
    }
  };

  // Fetch recent activity logs
  const fetchRecentActivityLogs = async () => {
    try {
      let timeConstraint;
      if (timeFilter === "day") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        timeConstraint = Timestamp.fromDate(yesterday);
      } else if (timeFilter === "week") {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        timeConstraint = Timestamp.fromDate(lastWeek);
      } else {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        timeConstraint = Timestamp.fromDate(lastMonth);
      }

      const activityQuery = query(
        collection(db, "activityLogs"),
        where("timestamp", ">=", timeConstraint),
        orderBy("timestamp", "desc"),
        limit(50)
      );

      const activitySnapshot = await getDocs(activityQuery);
      const activities = activitySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ActivityLog[];

      // Debug log
      console.log("Activity logs data:", activities);
      if (activities.length > 0) {
        console.log("Sample action value:", activities[0].action);
        console.log("Sample action type:", typeof activities[0].action);
      }

      setActivityLogs(activities);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    }
  };

  // Function to fetch all dashboard data
  const fetchData = async () => {
    setLoading(true);
    try {
      await fetchUserStats();
      await fetchActivityStats();
      await fetchRecentActivityLogs();
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch activity data based on time filter
  useEffect(() => {
    const isAdmin = localStorage.getItem("adminAuthenticated") === "true";
    if (!isAdmin) {
      navigate("/admin");
      return;
    }

    fetchData();
  }, [navigate, timeFilter]);

  // Format timestamp for display
  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== "function") {
      return "Invalid date";
    }

    try {
      const date = timestamp.toDate();
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(date);
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Date error";
    }
  };

  // Check if admin is authenticated
  const isAdminAuthenticated =
    localStorage.getItem("adminAuthenticated") === "true";
  if (!isAdminAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen bg-offWhite">
      {/* Admin Header */}
      <header className="bg-white border-b border-lightGray shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-charcoal">Admin Portal</h1>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/admin/activity")}
                className="text-mint font-medium border-b-2 border-mint px-3 py-2"
              >
                Activity Dashboard
              </button>
              <button
                onClick={() => navigate("/admin/communities")}
                className="text-charcoal hover:text-mint transition-colors px-3 py-2"
              >
                Communities
              </button>
              <button
                onClick={() => navigate("/admin/moderation")}
                className="text-charcoal hover:text-mint transition-colors px-3 py-2"
              >
                Content Moderation
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center text-red-500 hover:text-red-700 transition-colors"
                title="Logout"
              >
                <FiLogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">
                Activity Dashboard
              </h2>
              <p className="text-gray-600">
                Monitor user activity and engagement on the Microbial AI
                platform.
              </p>
            </div>
            <button
              onClick={() => fetchData()}
              className="bg-white py-2 px-4 rounded-lg border border-lightGray hover:bg-offWhite transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-mint rounded-full border-t-transparent"></div>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="bi bi-arrow-clockwise"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"
                    />
                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
                  </svg>
                  <span>Refresh Data</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Time filter controls */}
        <div className="flex items-center mb-6 bg-white p-3 rounded-lg shadow-sm">
          <span className="mr-3 text-gray-700 font-medium">Time Period:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeFilter("day")}
              className={`px-4 py-2 rounded-full flex items-center ${
                timeFilter === "day"
                  ? "bg-mint text-white"
                  : "bg-offWhite text-charcoal"
              }`}
            >
              <FiClock className="mr-1" />
              24 Hours
            </button>
            <button
              onClick={() => setTimeFilter("week")}
              className={`px-4 py-2 rounded-full flex items-center ${
                timeFilter === "week"
                  ? "bg-mint text-white"
                  : "bg-offWhite text-charcoal"
              }`}
            >
              <FiCalendar className="mr-1" />7 Days
            </button>
            <button
              onClick={() => setTimeFilter("month")}
              className={`px-4 py-2 rounded-full flex items-center ${
                timeFilter === "month"
                  ? "bg-mint text-white"
                  : "bg-offWhite text-charcoal"
              }`}
            >
              <FiCalendar className="mr-1" />
              30 Days
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-lightGray">
                <div className="flex items-center mb-2">
                  <div className="p-2 bg-purple bg-opacity-10 rounded-full mr-3">
                    <FiUsers className="text-purple" size={20} />
                  </div>
                  <h3 className="text-gray-500 font-medium">Total Users</h3>
                </div>
                <p className="text-3xl font-bold text-charcoal">
                  {userStats.totalUsers}
                </p>
                <p className="text-sm text-green-500 mt-2">
                  +{userStats.newUsersToday} today
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border border-lightGray">
                <div className="flex items-center mb-2">
                  <div className="p-2 bg-mint bg-opacity-10 rounded-full mr-3">
                    <FiActivity className="text-mint" size={20} />
                  </div>
                  <h3 className="text-gray-500 font-medium">Active Today</h3>
                </div>
                <p className="text-3xl font-bold text-charcoal">
                  {userStats.activeUsersToday}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {Math.round(
                    (userStats.activeUsersToday / userStats.totalUsers) * 100
                  )}
                  % of total users
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border border-lightGray">
                <div className="flex items-center mb-2">
                  <div className="p-2 bg-blue-500 bg-opacity-10 rounded-full mr-3">
                    <FiMessageSquare className="text-blue-500" size={20} />
                  </div>
                  <h3 className="text-gray-500 font-medium">Total Messages</h3>
                </div>
                <p className="text-3xl font-bold text-charcoal">
                  {activityStats.totalMessages}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Across {activityStats.totalThreads} threads
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border border-lightGray">
                <div className="flex items-center mb-2">
                  <div className="p-2 bg-pink-500 bg-opacity-10 rounded-full mr-3">
                    <FiImage className="text-pink-500" size={20} />
                  </div>
                  <h3 className="text-gray-500 font-medium">Image Analysis</h3>
                </div>
                <p className="text-3xl font-bold text-charcoal">
                  {activityStats.totalImageAnalysis}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Visual AI queries processed
                </p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Messages by Hour Chart */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-lightGray">
                <h3 className="text-lg font-semibold text-charcoal mb-4">
                  Messages by Hour
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activityStats.messagesByHour}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#00C9A7" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activity by Type Chart */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-lightGray">
                <h3 className="text-lg font-semibold text-charcoal mb-4">
                  Activity Distribution
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityStats.activityByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {activityStats.activityByType.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Activity Logs */}
            <div className="bg-white rounded-lg shadow-sm border border-lightGray overflow-hidden">
              <div className="p-4 border-b border-lightGray">
                <h3 className="text-lg font-semibold text-charcoal">
                  Recent Activity
                </h3>
                <p className="text-sm text-gray-500">
                  Showing latest user actions from the past{" "}
                  {timeFilter === "day"
                    ? "24 hours"
                    : timeFilter === "week"
                    ? "7 days"
                    : "30 days"}
                </p>
              </div>

              {activityLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No activity logs found for this time period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-lightGray">
                    <thead className="bg-offWhite">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-lightGray">
                      {activityLogs.map((log) => {
                        // Debug log for each row
                        console.log(
                          `Log row: ${log.id}, action:`,
                          log.action,
                          "action type:",
                          typeof log.action
                        );

                        return (
                          <tr key={log.id} className="hover:bg-offWhite">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-charcoal">
                                {log.userName || "Anonymous"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {log.userId}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <ActionDisplay action={log.action} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatTimestamp(log.timestamp)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {log.details
                                ? typeof log.details === "object"
                                  ? Object.entries(log.details)
                                      .map(([key, value]) => `${key}: ${value}`)
                                      .join(", ")
                                      .substring(0, 50) +
                                    (JSON.stringify(log.details).length > 50
                                      ? "..."
                                      : "")
                                  : String(log.details).substring(0, 50) +
                                    (String(log.details).length > 50
                                      ? "..."
                                      : "")
                                : "No details"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityDashboard;
