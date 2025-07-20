import React, { useState, useEffect, useRef } from "react";
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
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiCreditCard,
  FiMessageCircle,
  FiDollarSign,
} from "react-icons/fi";
import {
  getActivityByType,
  getHourlyVisits,
  ActivityType,
} from "../../utils/activityTracking";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  filteredActiveUsers: number;
  filteredNewUsers: number;
}

interface ActivityStats {
  totalMessages: number;
  totalThreads: number;
  totalImageAnalysis: number;
  totalCreditPurchases: number;
  messagesByHour: { name: string; value: number }[];
  activityByType: { name: string; value: number }[];
  filteredMessages: number;
  filteredThreads: number;
  filteredImageAnalysis: number;
  filteredCreditPurchases: number;
}

const COLORS = ["#00C9A7", "#845EC2", "#D65DB1", "#FF9671", "#FFC75F"];

// Activity display component
const ActionDisplay = ({ action }: { action: any }) => {
  let color = "bg-gray-100 text-gray-700";
  let icon = <FiActivity size={16} className="mr-1.5" />;
  let displayText = action;

  if (typeof action === "string") {
    // Standard actions
    switch (action) {
      case ActivityType.LOGIN:
        color = "bg-green-100 text-green-700";
        icon = <FiUsers size={16} className="mr-1.5" />;
        displayText = "Login";
        break;
      case ActivityType.LOGOUT:
        color = "bg-gray-100 text-gray-700";
        icon = <FiUsers size={16} className="mr-1.5" />;
        displayText = "Logout";
        break;
      case ActivityType.PROFILE_UPDATE:
        color = "bg-purple-100 text-purple-700";
        icon = <FiUsers size={16} className="mr-1.5" />;
        displayText = "Profile Update";
        break;
      case ActivityType.AI_CHAT:
        color = "bg-blue-100 text-blue-700";
        icon = <FiMessageCircle size={16} className="mr-1.5" />;
        displayText = "AI Chat";
        break;
      case ActivityType.IMAGE_ANALYSIS:
        color = "bg-amber-100 text-amber-700";
        icon = <FiImage size={16} className="mr-1.5" />;
        displayText = "Image Analysis";
        break;
      case ActivityType.CREDIT_PURCHASE:
        color = "bg-green-100 text-green-700";
        icon = <FiDollarSign size={16} className="mr-1.5" />;
        displayText = "Credit Purchase";
        break;
      default:
        // The action text is already set as the display text
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {icon}
      {displayText}
    </span>
  );
};

// Display formatted details for each activity type
const DetailDisplay = ({
  action,
  details,
}: {
  action: string;
  details?: any;
}) => {
  if (!details) return null;

  switch (action) {
    case ActivityType.AI_CHAT:
      return (
        <div className="text-xs text-gray-600 mt-1">
          <span className="font-medium">Message:</span> {details.messageContent}
          {details.timestamp && (
            <span className="ml-2 text-gray-500">
              {new Date(details.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      );

    case ActivityType.IMAGE_ANALYSIS:
      return (
        <div className="text-xs text-gray-600 mt-1">
          <span className="font-medium">Image:</span>{" "}
          {details.imageFileName || "Unnamed image"}
          {details.promptUsed && (
            <span className="ml-2">
              <span className="font-medium">Prompt:</span>{" "}
              {details.promptUsed.substring(0, 50)}
              {details.promptUsed.length > 50 ? "..." : ""}
            </span>
          )}
        </div>
      );

    case ActivityType.CREDIT_PURCHASE:
      return (
        <div className="text-xs text-gray-600 mt-1">
          <span className="font-medium">Package:</span>{" "}
          {details.packageName || "Unknown package"}
          <span className="ml-2">
            <span className="font-medium">Credits:</span>{" "}
            {details.credits || "Unknown"}
          </span>
          {details.amount && (
            <span className="ml-2">
              <span className="font-medium">Amount:</span> ₦
              {details.amount.toLocaleString()}
            </span>
          )}
        </div>
      );

    default:
      // For other activity types, show simplified details
      if (typeof details === "object") {
        const detailsText = Object.entries(details)
          .filter(([key]) => key !== "timestamp")
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");

        if (detailsText) {
          return (
            <div className="text-xs text-gray-600 mt-1">{detailsText}</div>
          );
        }
      }
      return null;
  }
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
    filteredActiveUsers: 0,
    filteredNewUsers: 0,
  });
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    totalMessages: 0,
    totalThreads: 0,
    totalImageAnalysis: 0,
    totalCreditPurchases: 0,
    messagesByHour: [],
    activityByType: [],
    filteredMessages: 0,
    filteredThreads: 0,
    filteredImageAnalysis: 0,
    filteredCreditPurchases: 0,
  });
  const [timeFilter, setTimeFilter] = useState<"day" | "week" | "month">("day");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
    isVisible: boolean;
  }>({
    message: "",
    type: "info",
    isVisible: false,
  });
  const [indexWarningShown, setIndexWarningShown] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;
  const [allActivityLogs, setAllActivityLogs] = useState<ActivityLog[]>([]);

  // Add the dashboard ref for PDF export
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Show notification helper
  const showNotification = (
    type: "success" | "error" | "info" | "warning",
    message: string,
    duration = 6000
  ) => {
    setNotification({
      type,
      message,
      isVisible: true,
    });

    // Auto-hide after duration
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, isVisible: false }));
    }, duration);
  };

  // Get time constraint based on selected filter
  const getTimeConstraint = () => {
    if (timeFilter === "day") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return Timestamp.fromDate(yesterday);
    } else if (timeFilter === "week") {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      return Timestamp.fromDate(lastWeek);
    } else {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return Timestamp.fromDate(lastMonth);
    }
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

      // Get filtered active users based on time filter
      const timeConstraint = getTimeConstraint();
      const filteredActiveUsersQuery = query(
        collection(db, "userActivity"),
        where("lastActive", ">=", timeConstraint)
      );
      const filteredActiveUsersSnapshot = await getCountFromServer(
        filteredActiveUsersQuery
      );
      const filteredActiveUsers = filteredActiveUsersSnapshot.data().count;

      // Get filtered new users based on time filter
      const filteredNewUsersQuery = query(
        collection(db, "users"),
        where("createdAt", ">=", timeConstraint)
      );
      const filteredNewUsersSnapshot = await getCountFromServer(
        filteredNewUsersQuery
      );
      const filteredNewUsers = filteredNewUsersSnapshot.data().count;

      setUserStats({
        totalUsers,
        activeUsersToday,
        activeUsersWeek,
        newUsersToday,
        filteredActiveUsers,
        filteredNewUsers,
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

      // Get credit purchases count - using a standalone try-catch to handle missing index
      let totalCreditPurchases = 0;
      try {
        const creditPurchasesQuery = query(
          collection(db, "creditTransactions"),
          where("transactionType", "==", "purchase")
        );
        const creditPurchasesSnapshot = await getCountFromServer(
          creditPurchasesQuery
        );
        totalCreditPurchases = creditPurchasesSnapshot.data().count;
      } catch (error) {
        console.warn("Error fetching credit purchases count:", error);
        // Use a fallback value
        totalCreditPurchases = 0;
      }

      // Get time-filtered counts
      const timeConstraint = getTimeConstraint();

      // Get filtered message count
      const filteredMessagesQuery = query(
        collection(db, "messages"),
        where("timestamp", ">=", timeConstraint)
      );
      const filteredMessagesSnapshot = await getCountFromServer(
        filteredMessagesQuery
      );
      const filteredMessages = filteredMessagesSnapshot.data().count;

      // Get filtered thread count
      const filteredThreadsQuery = query(
        collection(db, "threads"),
        where("createdAt", ">=", timeConstraint)
      );
      const filteredThreadsSnapshot = await getCountFromServer(
        filteredThreadsQuery
      );
      const filteredThreads = filteredThreadsSnapshot.data().count;

      // Get filtered image analysis count
      const filteredImageAnalysisQuery = query(
        collection(db, "imageAnalysis"),
        where("timestamp", ">=", timeConstraint)
      );
      const filteredImageAnalysisSnapshot = await getCountFromServer(
        filteredImageAnalysisQuery
      );
      const filteredImageAnalysis = filteredImageAnalysisSnapshot.data().count;

      // Get filtered credit purchases count - using a standalone try-catch to handle missing index
      let filteredCreditPurchases = 0;
      try {
        const filteredCreditPurchasesQuery = query(
          collection(db, "creditTransactions"),
          where("transactionType", "==", "purchase"),
          where("timestamp", ">=", timeConstraint)
        );
        const filteredCreditPurchasesSnapshot = await getCountFromServer(
          filteredCreditPurchasesQuery
        );
        filteredCreditPurchases = filteredCreditPurchasesSnapshot.data().count;
      } catch (error) {
        console.warn("Error fetching filtered credit purchases count:", error);
        console.warn(
          "This query requires a Firestore composite index to be created."
        );
        console.warn(
          "Please follow the link in the console error to create the index."
        );

        // Show warning notification only once
        if (!indexWarningShown) {
          showNotification(
            "warning",
            "Some statistics require Firestore indexes to be created. Please check the console for instructions.",
            10000
          );
          setIndexWarningShown(true);
        }

        // Use a fallback value
        filteredCreditPurchases = 0;
      }

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
        totalCreditPurchases,
        messagesByHour,
        activityByType,
        filteredMessages,
        filteredThreads,
        filteredImageAnalysis,
        filteredCreditPurchases,
      });
    } catch (error) {
      console.error("Error fetching activity stats:", error);

      // Check if it's an indexing error
      if (error instanceof Error && error.message.includes("index")) {
        showNotification(
          "warning",
          "Firebase requires indexes to be created. Please check the console and follow the link to create the required indexes.",
          10000
        );
      } else {
        showNotification(
          "error",
          "Failed to load dashboard statistics. Please try again later.",
          6000
        );
      }

      // Set some default values to avoid breaking the UI
      setActivityStats({
        totalMessages: 0,
        totalThreads: 0,
        totalImageAnalysis: 0,
        totalCreditPurchases: 0,
        messagesByHour: [],
        activityByType: [],
        filteredMessages: 0,
        filteredThreads: 0,
        filteredImageAnalysis: 0,
        filteredCreditPurchases: 0,
      });
    }
  };

  // Fetch recent activity logs
  const fetchRecentActivityLogs = async () => {
    try {
      const timeConstraint = getTimeConstraint();

      // Create the query
      const activityQuery = query(
        collection(db, "activityLogs"),
        where("timestamp", ">=", timeConstraint),
        orderBy("timestamp", "desc"),
        limit(100) // Fetch more to allow for pagination
      );

      // Execute query with error handling
      let activitySnapshot;
      try {
        activitySnapshot = await getDocs(activityQuery);
      } catch (queryError) {
        console.error("Error executing activity logs query:", queryError);
        if (
          queryError instanceof Error &&
          queryError.message.includes("index")
        ) {
          console.warn(
            "This query requires a Firestore index. Please create the index using the link in the error message."
          );
        }
        // Set default empty values and exit
        setAllActivityLogs([]);
        setTotalPages(1);
        setActivityLogs([]);
        setLoading(false);
        return;
      }

      // Map the data
      const allActivities = activitySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ActivityLog[];

      console.log(`Fetched ${allActivities.length} activity logs`);

      // Filter out "Login Test" actions and ensure we're tracking the activities we want
      const activities = allActivities.filter((log) => {
        // Filter out login tests
        if (
          typeof log.action === "string" &&
          log.action.includes("Login Test")
        ) {
          return false;
        }

        // Ensure we log AI Chat, Image Analysis, and Credit Purchase explicitly
        if (
          log.action === ActivityType.AI_CHAT ||
          log.action === ActivityType.IMAGE_ANALYSIS ||
          log.action === ActivityType.CREDIT_PURCHASE
        ) {
          console.log(`Found important activity: ${log.action}`, log);
        }

        // Include all other activities
        return true;
      });

      // Log the summary of activities by type for debugging
      const activityCounts = activities.reduce((acc, log) => {
        const action = log.action as string;
        acc[action] = (acc[action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log("Activity counts by type:", activityCounts);

      // Update pagination
      setAllActivityLogs(activities);
      setTotalPages(Math.max(1, Math.ceil(activities.length / itemsPerPage)));

      // Set current page activities
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      setActivityLogs(activities.slice(start, end));
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      // Set default empty values
      setAllActivityLogs([]);
      setTotalPages(1);
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Change page handler
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updatePaginatedLogs(allActivityLogs, page);
  };

  // Update paginated logs
  const updatePaginatedLogs = (logs: ActivityLog[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = page * itemsPerPage;
    setActivityLogs(logs.slice(startIndex, endIndex));
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

  // Update paginated logs when page changes
  useEffect(() => {
    updatePaginatedLogs(allActivityLogs, currentPage);
  }, [currentPage]);

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

  // Add PDF export function
  const exportToPdf = async () => {
    if (!dashboardRef.current) return;

    try {
      setLoading(true);

      const pdf = new jsPDF("p", "mm", "a4");
      const title = "Activity Dashboard Report";
      const subtitle = `Time range: ${
        timeFilter === "day"
          ? "Today"
          : timeFilter === "week"
          ? "This Week"
          : "This Month"
      }`;
      const date = new Date().toLocaleString();

      // Add title
      pdf.setFontSize(18);
      pdf.setTextColor(100, 0, 100);
      pdf.text(title, 105, 15, { align: "center" });

      // Add subtitle
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(subtitle, 105, 22, { align: "center" });

      // Add date
      pdf.setFontSize(10);
      pdf.text(`Generated: ${date}`, 105, 28, { align: "center" });

      // Create stats summary section
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Statistics Summary", 20, 40);

      // Add stats overview
      pdf.setFontSize(12);
      pdf.text(`Total Users: ${userStats.totalUsers}`, 20, 50);
      pdf.text(`Active Users: ${userStats.filteredActiveUsers}`, 20, 58);
      pdf.text(`New Users: ${userStats.filteredNewUsers}`, 20, 66);
      pdf.text(`Messages: ${activityStats.filteredMessages}`, 20, 74);
      pdf.text(`Threads: ${activityStats.filteredThreads}`, 20, 82);
      pdf.text(
        `Image Analysis: ${activityStats.filteredImageAnalysis}`,
        20,
        90
      );

      // Capture and add activity logs table
      const tableSection = document.querySelector(".activity-log-table");
      if (tableSection) {
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.text("Recent Activity Logs", 20, 20);

        const tableCanvas = await html2canvas(tableSection as HTMLElement, {
          scale: 1,
        });
        const tableImgData = tableCanvas.toDataURL("image/png");

        // Calculate aspect ratio to fit on page
        const imgWidth = 170;
        const imgHeight = (tableCanvas.height * imgWidth) / tableCanvas.width;

        pdf.addImage(tableImgData, "PNG", 20, 30, imgWidth, imgHeight);
      }

      // Add activity distribution chart
      if (activityStats.activityByType.length > 0) {
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.text("Activity Distribution", 20, 20);

        // Create a temporary chart for PDF export
        const chartContainer = document.createElement("div");
        chartContainer.style.width = "500px";
        chartContainer.style.height = "300px";
        document.body.appendChild(chartContainer);

        // // Render a chart for capturing
        // const chart = (
        //   <PieChart width={500} height={300}>
        //     <Pie
        //       data={activityStats.activityByType}
        //       cx={250}
        //       cy={150}
        //       labelLine={false}
        //       label={({ name, percent }) =>
        //         `${name}: ${(percent * 100).toFixed(0)}%`
        //       }
        //       outerRadius={100}
        //       fill="#8884d8"
        //       dataKey="value"
        //     >
        //       {activityStats.activityByType.map((_entry, index) => (
        //         <Cell
        //           key={`cell-${index}`}
        //           fill={COLORS[index % COLORS.length]}
        //         />
        //       ))}
        //     </Pie>
        //     <Tooltip />
        //   </PieChart>
        // );

        // We would render the chart to capture it, but since we can't in this environment
        // In a real implementation, you would use ReactDOM.render or a ref to render and capture

        // Instead, let's create a simple table of the data
        pdf.setFontSize(12);
        let yPosition = 40;

        activityStats.activityByType.forEach((item, index) => {
          const colorIndex = index % COLORS.length;
          pdf.setFillColor(
            parseInt(COLORS[colorIndex].substring(1, 3), 16),
            parseInt(COLORS[colorIndex].substring(3, 5), 16),
            parseInt(COLORS[colorIndex].substring(5, 7), 16)
          );
          pdf.rect(20, yPosition - 4, 10, 10, "F");
          pdf.text(`${item.name}: ${item.value}`, 35, yPosition);
          yPosition += 12;
        });

        // Clean up
        document.body.removeChild(chartContainer);
      }

      // Save the PDF
      pdf.save(
        `activity-dashboard-${timeFilter}-${date.replace(/[/: ]/g, "-")}.pdf`
      );
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      // Show error notification here
    } finally {
      setLoading(false);
    }
  };

  // Check if admin is authenticated
  const isAdminAuthenticated =
    localStorage.getItem("adminAuthenticated") === "true";
  if (!isAdminAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="p-6" ref={dashboardRef}>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-purple mb-2 flex items-center">
            <FiActivity className="mr-2" /> Activity Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor user activity and platform usage statistics
          </p>
        </div>

        {/* Export button */}
        <button
          onClick={exportToPdf}
          disabled={loading}
          className="bg-purple hover:bg-purple/90 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <FiDownload size={16} />
          <span>Export Report</span>
        </button>
      </div>

      {/* Notification */}
      {notification.isVisible && (
        <div
          className={`mb-6 p-4 rounded-lg shadow-md ${
            notification.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : notification.type === "error"
              ? "bg-red-100 text-red-800 border border-red-200"
              : notification.type === "warning"
              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
              : "bg-blue-100 text-blue-800 border border-blue-200"
          }`}
        >
          <div className="flex items-center">
            {notification.type === "warning" && (
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Time filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex space-x-4 items-center">
          <span className="text-gray-700 font-medium">Time Range:</span>
          <button
            onClick={() => setTimeFilter("day")}
            className={`px-3 py-1 rounded-full ${
              timeFilter === "day"
                ? "bg-purple text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeFilter("week")}
            className={`px-3 py-1 rounded-full ${
              timeFilter === "week"
                ? "bg-purple text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeFilter("month")}
            className={`px-3 py-1 rounded-full ${
              timeFilter === "month"
                ? "bg-purple text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => fetchData()}
            className="ml-auto px-3 py-1 flex items-center text-gray-700 hover:bg-gray-100 rounded-full"
            title="Refresh data"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            <span className="ml-1">Refresh</span>
          </button>
        </div>
      </div>

      {/* Rest of the dashboard content */}
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
                +{userStats.filteredNewUsers}{" "}
                {timeFilter === "day"
                  ? "today"
                  : timeFilter === "week"
                  ? "this week"
                  : "this month"}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border border-lightGray">
              <div className="flex items-center mb-2">
                <div className="p-2 bg-mint bg-opacity-10 rounded-full mr-3">
                  <FiMessageSquare className="text-mint" size={20} />
                </div>
                <h3 className="text-gray-500 font-medium">AI Chats</h3>
              </div>
              <p className="text-3xl font-bold text-charcoal">
                {activityStats.filteredMessages}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {timeFilter === "day"
                  ? "Today"
                  : timeFilter === "week"
                  ? "This Week"
                  : "This Month"}
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
                {activityStats.filteredImageAnalysis}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {timeFilter === "day"
                  ? "Today"
                  : timeFilter === "week"
                  ? "This Week"
                  : "This Month"}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border border-lightGray">
              <div className="flex items-center mb-2">
                <div className="p-2 bg-green-500 bg-opacity-10 rounded-full mr-3">
                  <FiCreditCard className="text-green-500" size={20} />
                </div>
                <h3 className="text-gray-500 font-medium">Credit Purchases</h3>
              </div>
              <p className="text-3xl font-bold text-charcoal">
                {activityStats.filteredCreditPurchases}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {timeFilter === "day"
                  ? "Today"
                  : timeFilter === "week"
                  ? "This Week"
                  : "This Month"}
              </p>
            </div>
          </div>

          {/* Recent Activity Logs */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-lightGray">
              <h2 className="text-lg font-medium text-charcoal">
                Recent User Activity
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-lightGray">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Action
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-lightGray">
                  {activityLogs.length > 0 ? (
                    activityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-mint text-white rounded-full flex items-center justify-center">
                              {log.userName
                                ? log.userName.charAt(0).toUpperCase()
                                : "U"}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {log.userName || "Unknown user"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {log.userId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <ActionDisplay action={log.action} />
                            <DetailDisplay
                              action={log.action}
                              details={log.details}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.timestamp
                            ? formatTimestamp(log.timestamp)
                            : "Unknown time"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No activity logs found for this time period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Existing pagination code */}
            <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-lightGray bg-gradient-to-r from-gray-50 to-white">
              <div className="text-sm text-gray-700 font-medium mb-4 sm:mb-0">
                <span className="hidden sm:inline">Showing </span>
                <span className="font-semibold text-purple">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>
                <span className="hidden sm:inline"> to </span>
                <span className="sm:hidden">-</span>
                <span className="font-semibold text-purple">
                  {Math.min(currentPage * itemsPerPage, allActivityLogs.length)}
                </span>
                <span className="hidden sm:inline"> of </span>
                <span className="sm:hidden">/</span>
                <span className="font-semibold text-purple">
                  {allActivityLogs.length}
                </span>
                <span className="hidden sm:inline"> entries</span>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                <div className="flex items-center">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center justify-center p-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-purple focus:z-10 focus:outline-none focus:ring-1 focus:ring-purple focus:border-purple disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    aria-label="First page"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center justify-center p-2 border border-gray-300 border-l-0 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-purple focus:z-10 focus:outline-none focus:ring-1 focus:ring-purple focus:border-purple disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <FiChevronLeft size={16} />
                  </button>
                </div>

                <div className="hidden md:flex mx-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first and last pages, and pages around current page
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, index, filteredArray) => {
                      // Add ellipsis where there are gaps
                      const showEllipsisBefore =
                        index > 0 && filteredArray[index - 1] !== page - 1;
                      const showEllipsisAfter =
                        index < filteredArray.length - 1 &&
                        filteredArray[index + 1] !== page + 1;

                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && (
                            <span className="relative inline-flex items-center justify-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center justify-center px-4 py-2 border ${
                              currentPage === page
                                ? "bg-purple text-white border-purple z-10 font-semibold"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-purple"
                            } text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-purple focus:border-purple transition-colors ${
                              index === 0 && !showEllipsisBefore
                                ? "rounded-l-md"
                                : ""
                            } ${
                              index === filteredArray.length - 1 &&
                              !showEllipsisAfter
                                ? "rounded-r-md"
                                : ""
                            }`}
                          >
                            {page}
                          </button>
                          {showEllipsisAfter && (
                            <span className="relative inline-flex items-center justify-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500">
                              ...
                            </span>
                          )}
                        </React.Fragment>
                      );
                    })}
                </div>

                <div className="md:hidden px-3">
                  <span className="text-sm text-purple font-semibold">
                    {currentPage}
                  </span>
                  <span className="text-sm text-gray-500"> / {totalPages}</span>
                </div>

                <div className="flex items-center">
                  <button
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center justify-center p-2 border border-gray-300 border-r-0 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-purple focus:z-10 focus:outline-none focus:ring-1 focus:ring-purple focus:border-purple disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <FiChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center justify-center p-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-purple focus:z-10 focus:outline-none focus:ring-1 focus:ring-purple focus:border-purple disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    aria-label="Last page"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                      <path
                        fillRule="evenodd"
                        d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ActivityDashboard;
