import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Conference, db } from "../../utils/firebase";
import { FaPlus, FaCalendarAlt, FaHistory, FaPlay } from "react-icons/fa";
import { MdLiveTv } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";
import AuthModal from "../../components/auth/AuthModal";
import Notification, {
  NotificationType,
} from "../../components/ui/Notification";
import { collection, getDocs, query } from "firebase/firestore";
import { ConferenceCard } from "../../components/conferences";

type FilterType = "live" | "upcoming" | "past" | "all";

// CountdownTimer component specifically for ConferencesPage
const CountdownTimer: React.FC<{ endTime: any }> = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!endTime || !endTime.seconds) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTimeMs = new Date(endTime.seconds * 1000).getTime();
      const difference = endTimeMs - now;

      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update countdown every second
    const timer = setInterval(() => {
      const timeRemaining = calculateTimeLeft();
      setTimeLeft(timeRemaining);

      // Clear interval when countdown reaches zero
      if (
        timeRemaining.hours <= 0 &&
        timeRemaining.minutes <= 0 &&
        timeRemaining.seconds <= 0
      ) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  // Format with leading zeros
  const padWithZero = (num: number) => String(num).padStart(2, "0");

  return (
    <div className="flex items-center bg-red-600 text-white px-2 py-1 rounded-full font-medium text-xs">
      <span className="mr-1">⏱️</span>
      {padWithZero(timeLeft.hours)}:{padWithZero(timeLeft.minutes)}:
      {padWithZero(timeLeft.seconds)}
    </div>
  );
};

// Live Conference Card Component for the ConferencesPage
const LiveConferenceCard: React.FC<{ conference: Conference }> = ({
  conference,
}) => {
  return (
    <Link to={`/conferences/${conference.id}`} className="block h-full">
      <div className="h-full bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ring-2 ring-red-500">
        <div className="relative">
          <img
            src={
              conference.thumbnailUrl ||
              "https://via.placeholder.com/600x338?text=Conference"
            }
            alt={conference.title || "Untitled Conference"}
            className="w-full h-[200px] md:h-[169px] object-cover"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.src =
                "https://via.placeholder.com/600x338?text=Conference";
            }}
          />
          {/* Always show the LIVE NOW badge */}
          <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center animate-pulse">
            <MdLiveTv className="mr-1" size={16} /> LIVE NOW
          </div>
          {conference.endTime && (
            <div className="absolute top-3 right-3 z-20">
              <CountdownTimer endTime={conference.endTime} />
            </div>
          )}
          <div className="absolute bottom-3 right-3 bg-black/70 text-white rounded-full p-2.5">
            <FaPlay size={20} />
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-charcoal text-lg line-clamp-2">
            {conference.title || "Untitled Conference"}
          </h3>
          <div className="text-sm text-gray-500 mt-2 flex items-center">
            <FaCalendarAlt className="mr-2 text-red-500" />
            {conference.startTime
              ? new Date(
                  conference.startTime.seconds * 1000
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "Date not available"}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            By {conference.organizer || "Anonymous"}
          </div>

          <p className="text-gray-600 mt-3 line-clamp-2 text-sm">
            {conference.description || "No description available"}
          </p>

          <div className="mt-4 text-sm flex items-center font-medium text-red-600">
            <MdLiveTv className="mr-1" /> Watch Live Now
          </div>
        </div>
      </div>
    </Link>
  );
};

// Helper function to check if a conference is past its end time
const isConferencePast = (conference: Conference): boolean => {
  try {
    const now = new Date().getTime();

    // Check if endTime exists and is in the past
    if (conference.endTime?.seconds) {
      const confEndTime = new Date(conference.endTime.seconds * 1000).getTime();
      return now > confEndTime;
    }

    // If no endTime, check startTime (assume conference lasts 1 hour)
    if (conference.startTime?.seconds) {
      const confStartTime = new Date(
        conference.startTime.seconds * 1000
      ).getTime();
      // Add 1 hour to startTime as fallback end time
      return now > confStartTime + 60 * 60 * 1000;
    }

    return false;
  } catch (error) {
    console.error("Error checking if conference is past:", error);
    return false;
  }
};

// Helper function to check if a conference is live based on time
const isConferenceLive = (conference: Conference): boolean => {
  try {
    const now = new Date().getTime();

    // If marked as live in the database, consider it live
    if (conference.status === "live") {
      return true;
    }

    // Check if conference is between start and end times
    if (conference.startTime?.seconds) {
      const startTime = new Date(conference.startTime.seconds * 1000).getTime();

      // If it has an end time, check if current time is between start and end
      if (conference.endTime?.seconds) {
        const endTime = new Date(conference.endTime.seconds * 1000).getTime();
        // Current time is after start time and before end time
        return now >= startTime && now <= endTime;
      } else {
        // If no end time specified, consider conference live if it started
        // within the last 2 hours (conservative estimate for a conference duration)
        const twoHoursInMs = 2 * 60 * 60 * 1000;
        return now >= startTime && now <= startTime + twoHoursInMs;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking if conference is live:", error);
    return false;
  }
};

// Helper to sort conferences by start time (newest first for upcoming, oldest first for live)
const sortConferences = (
  conferences: Conference[],
  type: string
): Conference[] => {
  return [...conferences].sort((a, b) => {
    const aTime = a.startTime?.seconds || 0;
    const bTime = b.startTime?.seconds || 0;

    // For past conferences, newest end time first
    if (type === "past") {
      return bTime - aTime; // Descending order
    }

    // For live conferences, oldest start time first (started earliest)
    if (type === "live") {
      return aTime - bTime; // Ascending order
    }

    // For upcoming conferences, earliest start time first
    return aTime - bTime; // Ascending order
  });
};

const ConferencesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  // Add states for different conference types
  const [liveConferences, setLiveConferences] = useState<Conference[]>([]);
  const [upcomingConferences, setUpcomingConferences] = useState<Conference[]>(
    []
  );
  const [pastConferences, setPastConferences] = useState<Conference[]>([]);

  // Add states for AuthModal and notifications
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notification, setNotification] = useState({
    type: "success" as NotificationType,
    message: "",
    isVisible: false,
  });

  // Function to directly fetch conferences from Firestore
  const fetchConferencesFromDatabase = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      console.log("Fetching conferences directly from Firestore database...");
      const conferencesRef = collection(db, "conferences");
      const conferenceQuery = query(conferencesRef);
      const querySnapshot = await getDocs(conferenceQuery);

      // Arrays to store different types of conferences
      const live: Conference[] = [];
      const upcoming: Conference[] = [];
      const past: Conference[] = [];

      console.log(`Found ${querySnapshot.size} total conferences in database`);

      // Process each conference
      querySnapshot.forEach((doc) => {
        const conferenceData = doc.data();
        const conference = {
          id: doc.id,
          ...conferenceData,
        } as Conference;

        // Log each conference for debugging
        console.log(
          `Processing conference: ${conference.id} - ${
            conference.title || "Untitled"
          } - Status: ${conference.status}`
        );

        // Categorize based on status and time
        if (isConferenceLive(conference)) {
          console.log(`  → Categorized as LIVE: ${conference.title}`);
          live.push(conference);
        } else if (
          conference.status === "upcoming" &&
          !isConferencePast(conference)
        ) {
          console.log(`  → Categorized as UPCOMING: ${conference.title}`);
          upcoming.push(conference);
        } else if (
          conference.status === "ended" ||
          isConferencePast(conference)
        ) {
          console.log(`  → Categorized as PAST: ${conference.title}`);
          past.push(conference);
        } else {
          console.log(`  → Could not categorize: ${conference.title}`);
        }
      });

      // Sort conferences appropriately before setting state
      const sortedLive = sortConferences(live, "live");
      const sortedUpcoming = sortConferences(upcoming, "upcoming");
      const sortedPast = sortConferences(past, "past");

      // Update state with categorized conferences
      setLiveConferences(sortedLive);
      setUpcomingConferences(sortedUpcoming);
      setPastConferences(sortedPast);

      console.log(`Categorized conferences:
        Live: ${live.length}
        Upcoming: ${upcoming.length}
        Past: ${past.length}
        Total: ${live.length + upcoming.length + past.length}
      `);

      // Show success notification if refresh was requested
      if (!loading) {
        showNotification("success", "Conferences refreshed successfully!");
      }
    } catch (error) {
      console.error("Error fetching conferences from database:", error);
      setFetchError("Failed to load conferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Log the disabled message and fetch conferences when component mounts
  useEffect(() => {
    console.log("Conferences page loaded - fetching data from database");
    fetchConferencesFromDatabase();
  }, []);

  useEffect(() => {
    // Get filter from URL or default to 'all'
    const filterParam = searchParams.get("filter") as FilterType;
    if (
      filterParam &&
      ["live", "upcoming", "past", "all"].includes(filterParam)
    ) {
      setActiveFilter(filterParam);
    } else {
      setActiveFilter("all");
    }
  }, [searchParams]);

  const handleFilterChange = (filter: FilterType) => {
    setSearchParams({ filter });
  };

  const handleRefresh = () => {
    // Actually fetch conferences from database
    console.log("Refresh requested, fetching new data from database");
    fetchConferencesFromDatabase();
  };

  // Add notification utility functions
  const showNotification = (type: NotificationType, message: string) => {
    setNotification({
      type,
      message,
      isVisible: true,
    });
  };

  const hideNotification = () => {
    setNotification((prev) => ({
      ...prev,
      isVisible: false,
    }));
  };

  // Update the Link to include auth check
  const handleHostClick = (e: React.MouseEvent) => {
    if (!currentUser) {
      e.preventDefault();
      setAuthModalOpen(true);
    }
  };

  // Add signOut handler function
  // const handleSignOut = async () => {
  //   try {
  //     await signOut(auth);
  //     // Navigate to home page after sign out
  //     window.location.href = "/";
  //   } catch (error) {
  //     console.error("Error signing out:", error);
  //   }
  // };

  // Get the list of conferences to display based on active filter
  const getDisplayConferences = (): Conference[] => {
    switch (activeFilter) {
      case "live":
        // Force status to be "live" for all conferences in the Live tab
        return liveConferences.map((conf) => ({
          ...conf,
          status: "live" as const,
        }));
      case "upcoming":
        return upcomingConferences;
      case "past":
        return pastConferences;
      case "all":
      default:
        // For the "all" filter, we need to clearly mark live conferences
        // We'll use the status field which is already checked when rendering
        // Create copies of the conferences to avoid mutating the original arrays
        const allConferences = [
          ...liveConferences.map((conf) => ({
            ...conf,
            status: "live" as const,
          })),
          ...upcomingConferences,
          ...pastConferences,
        ];
        return allConferences;
    }
  };

  // Check if there are any conferences to display
  // const hasConferences =
  //   liveConferences.length > 0 ||
  //   upcomingConferences.length > 0 ||
  //   pastConferences.length > 0;

  // Get conferences to display based on current filter
  const conferencesToDisplay = getDisplayConferences();

  // Log state of conferences when active filter changes
  useEffect(() => {
    console.log(`Active filter changed to: ${activeFilter}`);
    console.log(`Conferences for display: ${getDisplayConferences().length}`);
  }, [activeFilter, liveConferences, upcomingConferences, pastConferences]);

  return (
    <div className="min-h-screen bg-offWhite">
      <Header onAuthModalOpen={() => setAuthModalOpen(true)} />

      {/* Auth Modal */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(message) => showNotification("success", message)}
          redirectPath="/conferences/create"
        />
      )}

      {/* Notification Component */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="container mx-auto px-4 py-6 mt-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-charcoal mb-2 mt-5">
                MicrobialAI Conferences
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                Join live streams and discover upcoming conference events
              </p>
            </div>

            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center bg-purple text-white px-4 py-2 rounded-full font-medium hover:bg-opacity-90 transition-colors text-sm disabled:opacity-70"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>

              <Link
                to="/conferences/create"
                onClick={handleHostClick}
                className="inline-flex items-center bg-mint text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full font-medium hover:bg-purple transition-colors text-sm md:text-base"
              >
                <FaPlus className="mr-2" /> Host Conference
              </Link>
            </div>
          </div>

          {/* Filter tabs - Mobile Responsive */}
          <div className="mb-6 md:mb-8 border-b border-gray-200">
            <div className="flex flex-nowrap overflow-x-auto no-scrollbar">
              <button
                onClick={() => handleFilterChange("all")}
                className={`px-3 py-2 md:px-4 md:py-3 text-sm md:text-base font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeFilter === "all"
                    ? "border-mint text-mint"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                All Conferences
              </button>
              <button
                onClick={() => handleFilterChange("live")}
                className={`px-3 py-2 md:px-4 md:py-3 text-sm md:text-base font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${
                  activeFilter === "live"
                    ? "border-mint text-mint"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <MdLiveTv className="mr-1 md:mr-2" /> Live Now
              </button>
              <button
                onClick={() => handleFilterChange("upcoming")}
                className={`px-3 py-2 md:px-4 md:py-3 text-sm md:text-base font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${
                  activeFilter === "upcoming"
                    ? "border-mint text-mint"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <FaCalendarAlt className="mr-1 md:mr-2" /> Upcoming
              </button>
              <button
                onClick={() => handleFilterChange("past")}
                className={`px-3 py-2 md:px-4 md:py-3 text-sm md:text-base font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${
                  activeFilter === "past"
                    ? "border-mint text-mint"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <FaHistory className="mr-1 md:mr-2" /> Completed
              </button>
            </div>
          </div>

          {/* Display error if any */}
          {fetchError && !loading && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{fetchError}</span>
              </div>
              <button
                onClick={handleRefresh}
                className="bg-red-700 text-white px-3 py-1 rounded-md text-sm hover:bg-red-800"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Live conference count info - only show on All tab */}
          {activeFilter === "all" && liveConferences.length > 0 && !loading && (
            <div className="mb-4 flex items-center">
              <div className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded-full mr-2">
                <MdLiveTv className="mr-1" size={14} />
                {liveConferences.length} Live Now
              </div>
              <span className="text-gray-600 text-sm">
                Watch these conferences happening right now!
              </span>
            </div>
          )}

          {/* Conferences grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-white rounded-xl overflow-hidden shadow">
                    <div className="h-40 md:h-48 bg-gray-200"></div>
                    <div className="p-3 md:p-4">
                      <div className="h-5 md:h-6 bg-gray-200 rounded w-3/4 mb-2 md:mb-3"></div>
                      <div className="h-3 md:h-4 bg-gray-200 rounded w-1/2 mb-2 md:mb-3"></div>
                      <div className="h-3 md:h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : conferencesToDisplay.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {conferencesToDisplay.map((conference) => (
                <div key={conference.id}>
                  {conference.status === "live" || activeFilter === "live" ? (
                    <LiveConferenceCard conference={conference} />
                  ) : (
                    <ConferenceCard conference={conference} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 md:py-16">
              <div className="text-4xl md:text-5xl mb-4 text-gray-300">🎬</div>
              <h2 className="text-xl md:text-2xl font-bold text-charcoal mb-2">
                No conferences found
              </h2>
              <p className="text-gray-600 text-sm md:text-base mb-6 md:mb-8 max-w-md mx-auto">
                {activeFilter === "live"
                  ? "There are no live conferences happening right now."
                  : activeFilter === "upcoming"
                  ? "There are no upcoming conferences scheduled yet."
                  : activeFilter === "past"
                  ? "No past conferences are available to watch."
                  : "No conferences are available at the moment."}
              </p>
              <Link
                to="/conferences/create"
                className="inline-flex items-center bg-mint text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full font-medium hover:bg-purple transition-colors text-sm md:text-base"
              >
                <FaPlus className="mr-2" /> Host Your Own Conference
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConferencesPage;
