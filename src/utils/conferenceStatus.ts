import { db, updateConference, Conference } from "./firebase";
import { collection, query, getDocs, Timestamp } from "firebase/firestore";

/**
 * Function to check and update conference statuses based on their start and end times
 * This can be called by a Cloud Function or a client-side timer
 */
export const updateConferenceStatuses = async (): Promise<void> => {
  try {
    console.log("Running automatic conference status update check");
    const now = new Date();
    const conferencesRef = collection(db, "conferences");
    const querySnapshot = await getDocs(query(conferencesRef));

    let updatedCount = 0;

    for (const doc of querySnapshot.docs) {
      const conference = doc.data() as Conference;
      conference.id = doc.id;

      // Skip if no start or end time
      if (!conference.startTime || !conference.endTime) {
        continue;
      }

      // Convert Firestore timestamps to JS Date objects
      const startTime =
        conference.startTime instanceof Timestamp
          ? conference.startTime.toDate()
          : new Date(conference.startTime.seconds * 1000);

      const endTime =
        conference.endTime instanceof Timestamp
          ? conference.endTime.toDate()
          : new Date(conference.endTime.seconds * 1000);

      let newStatus = conference.status;

      // Upcoming -> Live transition
      if (
        conference.status === "upcoming" &&
        now >= startTime &&
        now <= endTime
      ) {
        newStatus = "live";
      }
      // Live -> Ended transition
      else if (conference.status === "live" && now > endTime) {
        newStatus = "ended";
      }
      // Edge case: If conference is marked as upcoming but end time has passed
      else if (conference.status === "upcoming" && now > endTime) {
        newStatus = "ended";
      }

      // Only update if status has changed
      if (newStatus !== conference.status) {
        console.log(
          `Updating conference ${conference.id} status from ${conference.status} to ${newStatus}`
        );
        await updateConference(conference.id, { status: newStatus });
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} conference statuses`);
  } catch (error) {
    console.error("Error updating conference statuses:", error);
  }
};

/**
 * Helper function to compute the status of a conference based on its start/end times
 * This is useful for determining what to display in the UI, regardless of what's stored in the DB
 */
export const getComputedStatus = (
  conference: Conference
): "upcoming" | "live" | "ended" => {
  if (!conference.startTime || !conference.endTime) {
    return conference.status || "upcoming";
  }

  const now = new Date();
  const startTime =
    conference.startTime instanceof Timestamp
      ? conference.startTime.toDate()
      : new Date(conference.startTime.seconds * 1000);

  const endTime =
    conference.endTime instanceof Timestamp
      ? conference.endTime.toDate()
      : new Date(conference.endTime.seconds * 1000);

  if (now < startTime) {
    return "upcoming";
  } else if (now >= startTime && now <= endTime) {
    return "live";
  } else {
    return "ended";
  }
};

/**
 * Start a client-side timer to periodically check and update conference statuses
 * This should be called once when the app initializes
 */
export const startConferenceStatusTimer = (): (() => void) => {
  console.log("Starting conference status timer");

  // Update every 60 seconds
  const intervalId = setInterval(updateConferenceStatuses, 60 * 1000);

  // Run once immediately
  updateConferenceStatuses();

  // Return a cleanup function
  return () => {
    console.log("Stopping conference status timer");
    clearInterval(intervalId);
  };
};
