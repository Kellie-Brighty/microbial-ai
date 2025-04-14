import React, { useEffect, useState } from "react";
import { Conference } from "../../utils/firebase";
import { FaCalendarAlt, FaUserAlt, FaTags } from "react-icons/fa";
import { format } from "date-fns";

interface ConferencePlayerProps {
  conference: Conference;
}

const ConferencePlayer: React.FC<ConferencePlayerProps> = ({ conference }) => {
  const [videoId, setVideoId] = useState<string | null>(null);

  useEffect(() => {
    // Extract video ID from YouTube URL
    if (conference.youtubeUrl) {
      // Handle different YouTube URL formats
      let extractedId = null;

      try {
        const url = new URL(conference.youtubeUrl);

        if (url.hostname.includes("youtube.com")) {
          // Format: https://www.youtube.com/watch?v=VIDEO_ID
          extractedId = url.searchParams.get("v");
        } else if (url.hostname.includes("youtu.be")) {
          // Format: https://youtu.be/VIDEO_ID
          extractedId = url.pathname.substring(1);
        }

        // If it's already just the ID
        if (
          !extractedId &&
          !conference.youtubeUrl.includes("/") &&
          !conference.youtubeUrl.includes("?")
        ) {
          extractedId = conference.youtubeUrl;
        }

        setVideoId(extractedId);
      } catch (error) {
        console.error("Invalid URL format:", error);
        // If URL parsing fails, check if it's just the ID
        if (
          !conference.youtubeUrl.includes("/") &&
          !conference.youtubeUrl.includes("?")
        ) {
          setVideoId(conference.youtubeUrl);
        }
      }
    }
  }, [conference.youtubeUrl]);

  const formattedDate = conference.startTime
    ? format(conference.startTime.toDate(), "MMMM dd, yyyy • h:mm a")
    : "";

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md">
      {/* YouTube Embed */}
      <div className="aspect-video w-full bg-black">
        {videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={conference.title}
          ></iframe>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <p>Video unavailable or ID could not be processed.</p>
          </div>
        )}
      </div>

      {/* Conference Details */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-charcoal mb-2">
          {conference.title}
        </h1>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
          <div className="flex items-center">
            <FaCalendarAlt className="mr-2 text-mint" />
            {formattedDate}
          </div>
          <div className="flex items-center">
            <FaUserAlt className="mr-2 text-mint" />
            {conference.organizer}
          </div>
          {conference.tags && conference.tags.length > 0 && (
            <div className="flex items-center">
              <FaTags className="mr-2 text-mint" />
              {conference.tags.join(", ")}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg mb-6">
          <h3 className="font-semibold text-charcoal mb-2">
            About this conference
          </h3>
          <p className="text-gray-600 whitespace-pre-line">
            {conference.description}
          </p>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="font-semibold text-charcoal mb-3">
            Share this conference
          </h3>
          <div className="flex space-x-2">
            <button className="bg-[#3b5998] text-white px-4 py-2 rounded">
              Facebook
            </button>
            <button className="bg-[#1da1f2] text-white px-4 py-2 rounded">
              Twitter
            </button>
            <button className="bg-[#0077b5] text-white px-4 py-2 rounded">
              LinkedIn
            </button>
            <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded">
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConferencePlayer;
