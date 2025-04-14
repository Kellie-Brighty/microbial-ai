import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";

interface LiveConferenceTabsProps {
  // Optional props if needed
}

const LiveConferenceTabs: React.FC<LiveConferenceTabsProps> = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">(
    "upcoming"
  );

  // Simple log without actually fetching anything
  useEffect(() => {
    console.log(
      "Conference page loaded, but not fetching any conferences as requested"
    );

    // Simulate loading delay, then set loading to false
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Render the tab header
  const renderTabHeader = () => (
    <div className="text-center mb-6 md:mb-8 lg:mb-12">
      <span className="inline-block px-3 py-1 bg-purple bg-opacity-10 text-purple rounded-full text-sm font-medium mb-2 md:mb-3">
        MICROBIAL AI CONFERENCES
      </span>
      <h2 className="text-xl md:text-2xl lg:text-4xl font-bold text-charcoal mb-2 md:mb-3 lg:mb-4">
        Conference Hub
      </h2>
      <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
        Discover and join upcoming conferences or access recordings from past
        events in the microbiology community.
      </p>

      {/* Tab Navigation */}
      <div className="bg-white rounded-full inline-flex p-1 mt-5 shadow-sm">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            activeTab === "upcoming"
              ? "bg-mint text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Upcoming & Live
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            activeTab === "completed"
              ? "bg-mint text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Completed
        </button>
      </div>
    </div>
  );

  // Render loading state
  const renderLoading = () => (
    <div className="animate-pulse space-y-3 md:space-y-4">
      <div className="h-40 md:h-48 lg:h-64 bg-gray-200 rounded-xl"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <div className="h-32 md:h-36 lg:h-48 bg-gray-200 rounded-xl"></div>
        <div className="h-32 md:h-36 lg:h-48 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );

  // Render empty state - this is the only state that will be shown
  const renderEmpty = () => (
    <div className="text-center py-8">
      <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base mb-6">
        There are no conferences available right now. Be the first to host one!
      </p>
      <Link
        to="/conferences/create"
        className="inline-flex items-center bg-mint text-white px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-medium hover:bg-purple transition-colors"
      >
        Host Your Own Conference
        <FaArrowRight className="ml-1 md:ml-2" size={12} />
      </Link>
    </div>
  );

  return (
    <section className="py-8 md:py-10 lg:py-16 bg-gray-50 pt-16 md:pt-16">
      <div className="container mx-auto px-4 mt-4">
        {renderTabHeader()}

        {loading ? renderLoading() : renderEmpty()}
      </div>
    </section>
  );
};

export default LiveConferenceTabs;
