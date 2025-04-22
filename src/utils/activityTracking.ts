import {
  collection,
  addDoc,
  Timestamp,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Activity types that can be tracked
export enum ActivityType {
  LOGIN = "Login",
  LOGOUT = "Logout",
  CREATE_THREAD = "Create Thread",
  SEND_MESSAGE = "Send Message",
  IMAGE_ANALYSIS = "Image Analysis",
  COMMUNITY_POST = "Community Post",
  PROFILE_UPDATE = "Profile Update",
  SEARCH = "Search",
  COMMUNITY_JOIN = "Community Join",
  COMMUNITY_LEAVE = "Community Leave",
}

// Record a user activity in the logs
export const recordUserActivity = async (
  userId: string,
  userName: string,
  action: ActivityType | string,
  details?: any
) => {
  try {
    const activityData = {
      userId,
      userName,
      action,
      details,
      timestamp: serverTimestamp(),
    };

    console.log("Recording activity:", {
      userId,
      userName,
      action,
      actionType: typeof action,
      details,
    });

    // Add activity to activity logs
    await addDoc(collection(db, "activityLogs"), activityData);

    // Update user's last active timestamp
    await updateUserActivity(userId);

    console.log(`Activity recorded: ${action} by ${userName}`);
  } catch (error) {
    console.error("Error recording user activity:", error);
  }
};

// Update a user's last active timestamp
export const updateUserActivity = async (userId: string) => {
  try {
    // Check if user activity document exists
    const userActivityQuery = query(
      collection(db, "userActivity"),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(userActivityQuery);

    if (querySnapshot.empty) {
      // Create new user activity document
      await addDoc(collection(db, "userActivity"), {
        userId,
        lastActive: serverTimestamp(),
        firstActive: serverTimestamp(),
      });
    } else {
      // Update existing document
      const docId = querySnapshot.docs[0].id;
      await updateDoc(doc(db, "userActivity", docId), {
        lastActive: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error updating user activity:", error);
  }
};

// Record visit to the platform (for analytics)
export const recordVisit = async (userId?: string) => {
  try {
    await addDoc(collection(db, "visits"), {
      timestamp: serverTimestamp(),
      userId: userId || "anonymous",
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      path: window.location.pathname,
    });
  } catch (error) {
    console.error("Error recording visit:", error);
  }
};

// Get hourly visit statistics for the past 24 hours
export const getHourlyVisits = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const visitsQuery = query(
      collection(db, "visits"),
      where("timestamp", ">=", Timestamp.fromDate(yesterday))
    );

    const querySnapshot = await getDocs(visitsQuery);

    // Process data to group by hour
    const hourlyData: { [hour: string]: number } = {};

    // Initialize all hours with zero
    for (let i = 0; i < 24; i++) {
      const hourString = i < 10 ? `0${i}:00` : `${i}:00`;
      hourlyData[hourString] = 0;
    }

    // Count visits by hour
    querySnapshot.forEach((doc) => {
      const visit = doc.data();
      if (visit.timestamp) {
        const date = visit.timestamp.toDate();
        const hour = date.getHours();
        const hourString = hour < 10 ? `0${hour}:00` : `${hour}:00`;
        hourlyData[hourString] = (hourlyData[hourString] || 0) + 1;
      }
    });

    // Convert to array format for charts
    const result = Object.keys(hourlyData).map((hour) => ({
      name: hour,
      value: hourlyData[hour],
    }));

    return result;
  } catch (error) {
    console.error("Error getting hourly visits:", error);
    return [];
  }
};

// Get statistics on activity by type for the given time period
export const getActivityByType = async (days: number = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activityQuery = query(
      collection(db, "activityLogs"),
      where("timestamp", ">=", Timestamp.fromDate(startDate))
    );

    const querySnapshot = await getDocs(activityQuery);

    // Count activities by type
    const activityCounts: { [key: string]: number } = {};

    querySnapshot.forEach((doc) => {
      const activity = doc.data();
      const activityType = activity.action;
      activityCounts[activityType] = (activityCounts[activityType] || 0) + 1;
    });

    // Convert to array format for charts
    const result = Object.keys(activityCounts).map((type) => ({
      name: formatActivityType(type),
      value: activityCounts[type],
    }));

    return result;
  } catch (error) {
    console.error("Error getting activity by type:", error);
    return [];
  }
};

// Helper function to format activity types for display
const formatActivityType = (type: string): string => {
  // First check if it's one of our predefined types
  const knownTypes = Object.values(ActivityType);
  if (knownTypes.includes(type as ActivityType)) {
    return type; // Already properly formatted
  }

  // For legacy or custom activity types, format from snake_case
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
