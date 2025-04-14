import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Conference } from "../../utils/firebase";
import { FaCalendarAlt, FaYoutube, FaPlay, FaHistory } from "react-icons/fa";
import { MdLiveTv } from "react-icons/md";

interface ConferenceCardProps {
  conference: Conference;
  isCompact?: boolean;
}

// Helper function to safely format timestamps
const safeFormatDate = (timestamp: any): string => {
  try {
    if (!timestamp) return "Date not available";

    // Handle Firestore Timestamp objects
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      return format(timestamp.toDate(), "MMM dd, yyyy • h:mm a");
    }

    // Handle timestamp with seconds and nanoseconds
    if (timestamp.seconds && timestamp.nanoseconds) {
      const date = new Date(timestamp.seconds * 1000);
      return format(date, "MMM dd, yyyy • h:mm a");
    }

    // Handle Date objects
    if (timestamp instanceof Date) {
      return format(timestamp, "MMM dd, yyyy • h:mm a");
    }

    // Handle string timestamps
    if (typeof timestamp === "string") {
      return format(new Date(timestamp), "MMM dd, yyyy • h:mm a");
    }

    return "Invalid date format";
  } catch (error) {
    console.error("Error formatting date:", error, timestamp);
    return "Date format error";
  }
};

// Determine if a conference is past its end time
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

// Get computed status based on database status and actual time
const getComputedStatus = (
  conference: Conference
): "live" | "upcoming" | "ended" => {
  // Trust the database status if it's "live" or "ended"
  if (conference.status === "live" || conference.status === "ended") {
    return conference.status;
  }

  // Check if the conference is past its end time despite being marked as upcoming
  if (conference.status === "upcoming" && isConferencePast(conference)) {
    return "ended";
  }

  // Default to the database status
  return conference.status;
};

// Countdown timer component
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
    <div className="flex items-center bg-red-600/90 text-white px-2 py-1 rounded-full font-medium text-xs ml-2">
      Ends in: {padWithZero(timeLeft.hours)}:{padWithZero(timeLeft.minutes)}:
      {padWithZero(timeLeft.seconds)}
    </div>
  );
};

const ConferenceCard: React.FC<ConferenceCardProps> = ({
  conference,
  isCompact = false,
}) => {
  if (!conference) {
    console.error("Conference data is missing");
    return null;
  }

  const {
    id,
    title,
    description,
    startTime,
    status: dbStatus,
    thumbnailUrl,
    organizer,
    tags,
  } = conference;

  // Get computed status based on actual dates rather than just the stored status
  const status = getComputedStatus(conference);
  const isPast = isConferencePast(conference);

  // Add debug logging
  console.log(`Rendering conference card:
    ID: ${id || "missing"}
    Title: ${title || "missing"}
    DB Status: ${dbStatus || "missing"}
    Computed Status: ${status}
    Is Past: ${isPast}
    StartTime: ${
      startTime ? new Date(startTime.seconds * 1000).toString() : "undefined"
    }
  `);

  const isLive = status === "live";
  const formattedDate = safeFormatDate(startTime);

  // Handle both URL and Base64 encoded images
  const isBase64Image = (url: string) => {
    return url?.startsWith("data:image/");
  };

  const getImageUrl = (url: string | undefined) => {
    if (!url) return "https://via.placeholder.com/600x338?text=Conference";

    // If it's already a Base64 string or a valid URL, use it directly
    if (isBase64Image(url) || url.startsWith("http")) {
      return url;
    }

    // Fallback
    return "https://via.placeholder.com/600x338?text=Conference";
  };

  // Render compact card for horizontally scrolling lists
  if (isCompact) {
    return (
      <Link to={`/conferences/${id}`} className="block w-[280px] flex-shrink-0">
        <div
          className={`h-full rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg ${
            isLive ? "ring-2 ring-mint" : ""
          }`}
        >
          <div className="relative">
            <img
              src={getImageUrl(thumbnailUrl)}
              alt={title || "Untitled Conference"}
              className={`w-full h-[158px] object-cover ${
                status === "ended" ? "opacity-90" : ""
              }`}
            />
            {isLive && (
              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                <MdLiveTv className="mr-1" /> LIVE NOW
              </div>
            )}
            {isLive && conference.endTime && (
              <div className="absolute top-2 right-2 z-20">
                <CountdownTimer endTime={conference.endTime} />
              </div>
            )}
            {status === "upcoming" && (
              <div className="absolute top-2 left-2 bg-mint/90 text-white text-xs font-bold px-2 py-1 rounded-full">
                UPCOMING
              </div>
            )}
            {status === "ended" && (
              <div className="absolute top-2 left-2 bg-gray-700/90 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                <FaHistory className="mr-1" size={10} /> COMPLETED
              </div>
            )}
            {status === "ended" && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white rounded-full p-2">
                <FaPlay size={18} />
              </div>
            )}
          </div>
          <div className="p-3">
            <h3 className="font-bold text-charcoal text-sm line-clamp-2">
              {title || "Untitled Conference"}
            </h3>
            <div className="text-xs text-gray-500 mt-1 flex items-center">
              <FaCalendarAlt className="mr-1 text-mint" size={12} />
              {formattedDate}
            </div>
            <div className="text-xs text-gray-600 mt-1 line-clamp-1">
              By {organizer || "Anonymous"}
            </div>

            {status === "upcoming" && !isPast && (
              <div className="mt-2 text-xs bg-gray-100 text-charcoal px-2 py-1 rounded-full inline-block">
                Register
              </div>
            )}
            {status === "ended" && (
              <div className="mt-2 text-xs bg-purple/10 text-purple px-2 py-1 rounded-full inline-block">
                View Recording
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Render full card for grid layouts
  return (
    <Link to={`/conferences/${id}`} className="block h-full">
      <div
        className={`h-full bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
          isLive ? "ring-2 ring-mint" : ""
        }`}
      >
        <div className="relative">
          <img
            src={getImageUrl(thumbnailUrl)}
            alt={title || "Untitled Conference"}
            className={`w-full h-[200px] md:h-[169px] object-cover ${
              status === "ended" ? "opacity-90" : ""
            }`}
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.src =
                "https://via.placeholder.com/600x338?text=Conference";
            }}
          />
          {isLive && (
            <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
              <MdLiveTv className="mr-1" /> LIVE NOW
            </div>
          )}
          {isLive && conference.endTime && (
            <div className="absolute top-3 right-3 z-20">
              <CountdownTimer endTime={conference.endTime} />
            </div>
          )}
          {status === "upcoming" && (
            <div className="absolute top-3 left-3 bg-mint/90 text-white text-xs font-bold px-3 py-1 rounded-full">
              UPCOMING
            </div>
          )}
          {status === "ended" && (
            <div className="absolute top-3 left-3 bg-gray-700/90 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
              <FaHistory className="mr-1" size={10} /> COMPLETED
            </div>
          )}
          {status === "ended" && (
            <div className="absolute bottom-3 right-3 bg-black/70 text-white rounded-full p-2.5">
              <FaPlay size={20} />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-charcoal text-lg line-clamp-2">
            {title || "Untitled Conference"}
          </h3>
          <div className="text-sm text-gray-500 mt-2 flex items-center">
            <FaCalendarAlt className="mr-2 text-mint" />
            {formattedDate}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            By {organizer || "Anonymous"}
          </div>

          <p className="text-gray-600 mt-3 line-clamp-2 text-sm">
            {description || "No description available"}
          </p>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  +{tags.length - 3} more
                </span>
              )}
            </div>
          )}

          <div
            className={`mt-4 text-sm flex items-center font-medium ${
              isLive
                ? "text-red-600"
                : status === "ended"
                ? "text-purple"
                : "text-mint"
            }`}
          >
            {isLive ? (
              <>
                <MdLiveTv className="mr-1" /> Watch Live Stream
              </>
            ) : status === "upcoming" && !isPast ? (
              <>
                <FaCalendarAlt className="mr-1" /> Register Now
              </>
            ) : (
              <>
                <FaYoutube className="mr-1" /> Watch Recording
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ConferenceCard;
