import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Conference,
  getLiveConferences,
  getUpcomingConferences,
  getPastConferences,
} from "../../utils/firebase";
import { FaArrowRight, FaCalendarAlt, FaHistory, FaPlay } from "react-icons/fa";
import { MdLiveTv } from "react-icons/md";

// import { useAuth } from "../../context/AuthContext";

// import { signOut } from "firebase/auth";
// import { auth } from "../../utils/firebase";

// CountdownTimer component
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
    <div className="flex items-center bg-red-600/90 text-white px-2 py-1 rounded-full font-medium text-xs">
      Ends in: {padWithZero(timeLeft.hours)}:{padWithZero(timeLeft.minutes)}:
      {padWithZero(timeLeft.seconds)}
    </div>
  );
};

const LiveConferenceSection: React.FC = () => {
  const [liveConferences, setLiveConferences] = useState<Conference[]>([]);
  const [upcomingConferences, setUpcomingConferences] = useState<Conference[]>(
    []
  );
  const [pastConferences, setPastConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  // const { currentUser } = useAuth();
  // const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">(
    "upcoming"
  );

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  }, []);

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        setLoading(true);
        // Fetch all conference types simultaneously
        const [liveData, upcomingData, pastData] = await Promise.all([
          getLiveConferences(),
          getUpcomingConferences(),
          getPastConferences(10), // Limit to 10 past conferences
        ]);

        console.log(`Received live conferences: ${liveData.length}`);
        console.log(`Received upcoming conferences: ${upcomingData.length}`);
        console.log(`Received past conferences: ${pastData.length}`);

        // Ensure we don't have duplicates between live and upcoming
        // Filter out any conferences from upcoming that are already in live
        const liveIds = new Set(liveData.map((conf) => conf.id));
        const filteredUpcoming = upcomingData.filter(
          (conf) => !liveIds.has(conf.id)
        );

        setLiveConferences(liveData);
        setUpcomingConferences(filteredUpcoming);
        setPastConferences(pastData);
      } catch (error) {
        console.error("Error fetching conferences:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConferences();

    // Refresh data every 5 minutes to check for newly started livestreams and status changes
    const intervalId = setInterval(fetchConferences, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // const handleSignOut = async () => {
  //   try {
  //     await signOut(auth);
  //     // Navigate to home page after sign out
  //     window.location.href = "/";
  //   } catch (error) {
  //     console.error("Error signing out:", error);
  //   }
  // };

  // Check if a conference date has passed
  // const isConferencePast = (conference: Conference): boolean => {
  //   const now = new Date().getTime();
  //   const confEndTime = conference.endTime?.seconds
  //     ? new Date(conference.endTime.seconds * 1000).getTime()
  //     : null;

  //   return confEndTime ? confEndTime < now : false;
  // };

  // Replace the calculateTimeLeft function (since we now have a full component)
  // const calculateTimeLeft = (endTime: any): string => {
  //   if (!endTime || !endTime.seconds) return "soon";

  //   const now = new Date().getTime();
  //   const endTimeMs = new Date(endTime.seconds * 1000).getTime();
  //   const difference = endTimeMs - now;

  //   if (difference <= 0) return "soon";

  //   const hours = Math.floor(difference / (1000 * 60 * 60));
  //   const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

  //   if (hours > 0) {
  //     return `${hours}h ${minutes}m`;
  //   } else {
  //     return `${minutes}m`;
  //   }
  // };

  // If there are no conferences and still loading, show skeleton
  if (
    loading &&
    liveConferences.length === 0 &&
    upcomingConferences.length === 0 &&
    pastConferences.length === 0
  ) {
    return (
      <>
        <section className="py-8 md:py-10 lg:py-16 bg-gray-50 pt-24 md:pt-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6 md:mb-8 lg:mb-12">
              <span className="inline-block px-3 py-1 bg-purple bg-opacity-10 text-purple rounded-full text-sm font-medium mb-2 md:mb-3">
                MICROBIAL AI CONFERENCES
              </span>
              <h2 className="text-xl md:text-2xl lg:text-4xl font-bold text-charcoal mb-2 md:mb-3 lg:mb-4">
                Conference Hub
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
                Discover and join upcoming conferences or access recordings from
                past events in the microbiology community.
              </p>
            </div>

            <div className="animate-pulse space-y-3 md:space-y-4">
              <div className="h-40 md:h-48 lg:h-64 bg-gray-200 rounded-xl"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="h-32 md:h-36 lg:h-48 bg-gray-200 rounded-xl"></div>
                <div className="h-32 md:h-36 lg:h-48 bg-gray-200 rounded-xl"></div>
                <div className="h-32 md:h-36 lg:h-48 bg-gray-200 rounded-xl hidden sm:block"></div>
                <div className="h-32 md:h-36 lg:h-48 bg-gray-200 rounded-xl hidden lg:block"></div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  // If no conferences are available, show a better empty state instead of hiding
  if (
    !loading &&
    liveConferences.length === 0 &&
    upcomingConferences.length === 0 &&
    pastConferences.length === 0
  ) {
    return (
      <section className="py-8 md:py-10 lg:py-16 bg-gray-50 pt-16 md:pt-16">
        <div className="container mx-auto px-4 mt-4">
          <div className="text-center mb-6 md:mb-8 lg:mb-12">
            <span className="inline-block px-3 py-1 bg-purple bg-opacity-10 text-purple rounded-full text-sm font-medium mb-2 md:mb-3">
              CONFERENCES
            </span>
            <h2 className="text-xl md:text-2xl lg:text-4xl font-bold text-charcoal mb-2 md:mb-3 lg:mb-4">
              No Conferences Available
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base mb-6">
              There are no upcoming or live conferences scheduled right now. Be
              the first to host one!
            </p>

            <Link
              to="/conferences/create"
              className="inline-flex items-center bg-mint text-white px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-medium hover:bg-purple transition-colors"
            >
              Host Your Own Conference
              <FaArrowRight className="ml-1 md:ml-2" size={12} />
            </Link>
          </div>

          <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              Why Host a Conference?
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-mint mr-2">•</span>
                <span>
                  Share your research with the global microbiology community
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-mint mr-2">•</span>
                <span>
                  Connect with fellow researchers and build your network
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-mint mr-2">•</span>
                <span>
                  Get feedback on your work from peers around the world
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-mint mr-2">•</span>
                <span>
                  Increase visibility of your research and institution
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-6 md:py-10">
        <div className="container mx-auto px-4">
          {/* Tab navigation */}
          <div className="flex space-x-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`pb-3 px-1 font-medium text-sm md:text-base relative ${
                activeTab === "upcoming"
                  ? "text-mint border-b-2 border-mint"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Upcoming & Live
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`pb-3 px-1 font-medium text-sm md:text-base relative ${
                activeTab === "completed"
                  ? "text-mint border-b-2 border-mint"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Completed
            </button>
          </div>

          {/* Content container - only show loading state or content, never both */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mint"></div>
            </div>
          ) : (
            <div>
              {/* Upcoming & Live Tab Content */}
              {activeTab === "upcoming" && (
                <>
                  {liveConferences.length > 0 ||
                  upcomingConferences.length > 0 ? (
                    <div>
                      {/* Featured live or upcoming conference */}
                      {liveConferences.length > 0 ? (
                        <div className="mb-8">
                          <div className="flex items-center justify-between mb-3 md:mb-4">
                            <h3 className="text-base md:text-lg lg:text-xl font-bold text-charcoal flex items-center">
                              <MdLiveTv
                                className="mr-1 md:mr-2 text-red-600"
                                size={20}
                              />
                              Live Now
                            </h3>
                            <Link
                              to="/conferences?filter=live"
                              className="text-mint hover:text-purple font-medium text-xs md:text-sm flex items-center"
                            >
                              View all live
                              <FaArrowRight
                                className="ml-1 md:ml-2"
                                size={12}
                              />
                            </Link>
                          </div>

                          {/* Featured live conference */}
                          <Link
                            to={`/conferences/${liveConferences[0].id}`}
                            className="block rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow relative group"
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                            <img
                              src={
                                liveConferences[0].thumbnailUrl ||
                                "https://via.placeholder.com/1200x675"
                              }
                              alt={liveConferences[0].title}
                              className="w-full h-[200px] md:h-[300px] lg:h-[400px] object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute top-4 left-4 z-20">
                              <div className="flex items-center bg-red-600 text-white px-3 py-1 rounded-full font-medium text-sm">
                                <MdLiveTv className="mr-1" size={16} /> LIVE
                              </div>
                            </div>
                            {liveConferences[0].endTime && (
                              <div className="absolute top-4 right-4 z-20">
                                <CountdownTimer
                                  endTime={liveConferences[0].endTime}
                                />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-20">
                              <h3 className="text-white font-bold text-xl md:text-2xl mb-2">
                                {liveConferences[0].title}
                              </h3>
                              <p className="text-gray-200 text-sm md:text-base mb-4 line-clamp-2">
                                {liveConferences[0].description}
                              </p>
                              <div className="inline-flex items-center bg-white text-charcoal px-4 py-2 rounded-full font-medium text-sm hover:bg-mint hover:text-white transition-colors">
                                Join Stream{" "}
                                <FaPlay className="ml-2" size={10} />
                              </div>
                            </div>
                          </Link>
                        </div>
                      ) : upcomingConferences.length > 0 ? (
                        <div className="mb-8">
                          <div className="flex items-center justify-between mb-3 md:mb-4">
                            <h3 className="text-base md:text-lg lg:text-xl font-bold text-charcoal flex items-center">
                              <FaCalendarAlt
                                className="mr-1 md:mr-2 text-mint"
                                size={16}
                              />{" "}
                              Featured Upcoming
                            </h3>
                            <Link
                              to="/conferences?filter=upcoming"
                              className="text-mint hover:text-purple font-medium text-xs md:text-sm flex items-center"
                            >
                              View all upcoming
                              <FaArrowRight
                                className="ml-1 md:ml-2"
                                size={12}
                              />
                            </Link>
                          </div>

                          {/* Featured upcoming conference */}
                          <Link
                            to={`/conferences/${upcomingConferences[0].id}`}
                            className="block rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow relative group"
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                            <img
                              src={
                                upcomingConferences[0].thumbnailUrl ||
                                "https://via.placeholder.com/1200x675"
                              }
                              alt={upcomingConferences[0].title}
                              className="w-full h-[200px] md:h-[300px] lg:h-[400px] object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute top-4 left-4 z-20">
                              <div className="flex items-center bg-mint text-white px-3 py-1 rounded-full font-medium text-sm">
                                <FaCalendarAlt className="mr-1" size={14} />{" "}
                                UPCOMING
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-20">
                              <h3 className="text-white font-bold text-xl md:text-2xl mb-2">
                                {upcomingConferences[0].title}
                              </h3>
                              <p className="text-gray-200 text-sm md:text-base mb-4 line-clamp-2">
                                {upcomingConferences[0].description}
                              </p>
                              <div className="inline-flex items-center bg-white text-charcoal px-4 py-2 rounded-full font-medium text-sm">
                                {upcomingConferences[0].startTime && (
                                  <span>
                                    Starts{" "}
                                    {new Date(
                                      upcomingConferences[0].startTime.seconds *
                                        1000
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        </div>
                      ) : null}

                      {/* More live or upcoming conferences */}
                      <div className="mt-6 md:mt-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          {liveConferences.length > 1
                            ? liveConferences.slice(1, 3).map((conference) => (
                                <Link
                                  key={conference.id}
                                  to={`/conferences/${conference.id}`}
                                  className="block h-[160px] rounded-xl overflow-hidden relative group"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                                  <img
                                    src={
                                      conference.thumbnailUrl ||
                                      "https://via.placeholder.com/1200x675"
                                    }
                                    alt={conference.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                  <div className="absolute top-2 left-2 z-20">
                                    <div className="flex items-center bg-red-600 text-white px-2 py-0.5 rounded-full font-medium text-xs">
                                      <MdLiveTv className="mr-1" size={12} />{" "}
                                      LIVE
                                    </div>
                                  </div>
                                  {conference.endTime && (
                                    <div className="absolute top-2 right-2 z-20">
                                      <CountdownTimer
                                        endTime={conference.endTime}
                                      />
                                    </div>
                                  )}
                                  <div className="absolute bottom-0 left-0 right-0 p-2 z-20">
                                    <h3 className="text-white font-medium text-sm line-clamp-2">
                                      {conference.title}
                                    </h3>
                                  </div>
                                </Link>
                              ))
                            : upcomingConferences.length > 1
                            ? upcomingConferences
                                .slice(1, 3)
                                .map((conference) => (
                                  <Link
                                    key={conference.id}
                                    to={`/conferences/${conference.id}`}
                                    className="block h-[160px] rounded-xl overflow-hidden relative group"
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                                    <img
                                      src={
                                        conference.thumbnailUrl ||
                                        "https://via.placeholder.com/1200x675"
                                      }
                                      alt={conference.title}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute top-2 left-2 z-20">
                                      <div className="flex items-center bg-mint text-white px-2 py-0.5 rounded-full font-medium text-xs">
                                        <FaCalendarAlt
                                          className="mr-1"
                                          size={10}
                                        />{" "}
                                        UPCOMING
                                      </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-2 z-20">
                                      <h3 className="text-white font-medium text-sm line-clamp-2">
                                        {conference.title}
                                      </h3>
                                    </div>
                                  </Link>
                                ))
                            : null}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-600 mb-6">
                        There are no live or upcoming conferences available
                        right now.
                      </p>
                      <Link
                        to="/conferences/create"
                        className="inline-flex items-center bg-mint text-white px-4 py-2 rounded-lg font-medium hover:bg-purple transition-colors"
                      >
                        Host Your Own Conference
                        <FaArrowRight className="ml-2" size={12} />
                      </Link>
                    </div>
                  )}
                </>
              )}

              {/* Completed Conferences Tab Content */}
              {activeTab === "completed" && (
                <>
                  {pastConferences.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-charcoal flex items-center">
                          <FaHistory className="mr-2 text-purple" size={16} />
                          Completed Conferences
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {pastConferences.slice(0, 4).map((conference) => (
                          <Link
                            key={conference.id}
                            to={`/conferences/${conference.id}`}
                            className="block rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow relative group"
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                            <img
                              src={
                                conference.thumbnailUrl ||
                                "https://via.placeholder.com/600x338"
                              }
                              alt={conference.title}
                              className="w-full h-[180px] object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute top-2 right-2 z-20">
                              <div className="flex items-center bg-purple/90 text-white px-2 py-1 rounded-full font-medium text-xs">
                                <FaHistory className="mr-1" size={10} />{" "}
                                COMPLETED
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                              <h3 className="text-white font-bold text-base mb-1 line-clamp-2">
                                {conference.title}
                              </h3>
                              <p className="text-white/80 text-xs line-clamp-1">
                                {conference.organizer}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>

                      {pastConferences.length > 4 && (
                        <div className="text-center mt-6">
                          <Link
                            to="/conferences?filter=completed"
                            className="inline-flex items-center text-mint hover:text-purple font-medium"
                          >
                            View all completed conferences
                            <FaArrowRight className="ml-2" size={12} />
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-600 mb-6">
                        There are no completed conferences available.
                      </p>
                      <Link
                        to="/conferences/create"
                        className="inline-flex items-center bg-mint text-white px-4 py-2 rounded-lg font-medium hover:bg-purple transition-colors"
                      >
                        Host Your First Conference
                        <FaArrowRight className="ml-2" size={12} />
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default LiveConferenceSection;
