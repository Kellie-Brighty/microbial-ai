import React, { useState } from "react";
import { Link } from "react-router-dom";
import AgenNicky from "../assets/microbial-profile.png";
import { GiDna1, GiMicroscope } from "react-icons/gi";
import {
  FaMicrochip,
  FaRobot,
  FaArrowRight,
  FaFlask,
  FaChartBar,
  FaUsers,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaHandshake,
  FaBriefcase,
  FaMoneyBillWave,
  FaMicroscope,
} from "react-icons/fa";
import { MdLiveTv } from "react-icons/md";
import { LiveConferenceSection } from "../components/conferences";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/auth/AuthModal";
import Notification, { NotificationType } from "../components/ui/Notification";
import Header from "../components/Header";
import { DEFAULT_NEW_USER_CREDITS, CREDIT_COSTS } from "../utils/creditsSystem";
// import { signOut, auth } from "../utils/firebase";

const LandingPage: React.FC = () => {
  const { currentUser } = useAuth();
  // const { currentUser, logOut } = useAuth();
  // const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Add state for AuthModal and notifications
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notification, setNotification] = useState({
    type: "success" as NotificationType,
    message: "",
    isVisible: false,
  });

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

  // const handleLogout = async () => {
  //   try {
  //     await logOut();
  //     showNotification("success", "Successfully signed out");
  //   } catch (error) {
  //     showNotification("error", "Failed to sign out");
  //     console.error("Error signing out:", error);
  //   }
  // };

  // const handleSignOut = async () => {
  //   try {
  //     await signOut(auth);
  //     // Navigate to home page after sign out
  //     window.location.href = "/";
  //   } catch (error) {
  //     console.error("Error signing out:", error);
  //   }
  // };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Auth Modal */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(message) => showNotification("success", message)}
        />
      )}

      {/* Notification Component */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      {/* Header Section */}
      <Header onAuthModalOpen={() => setAuthModalOpen(true)} />

      {/* Hero Section with padding for fixed header */}
      <div className="bg-gradient-to-br from-mint to-purple text-white relative overflow-hidden pt-16 md:pt-20">
        {/* Decorative elements */}
        <div className="absolute opacity-10 top-20 left-10">
          <GiDna1 size={120} />
        </div>
        <div className="absolute opacity-10 bottom-10 right-10">
          <FaMicrochip size={100} />
        </div>
        <div className="absolute opacity-10 top-40 right-1/4">
          <GiMicroscope size={80} />
        </div>

        <div className="absolute w-full h-full bg-gradient-to-b from-transparent to-black opacity-20"></div>

        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 md:pr-12 mb-12 md:mb-0">
              <div className="inline-block mb-2 bg-white bg-opacity-20 backdrop-filter backdrop-blur-md rounded-full px-4 py-1 text-sm font-medium text-mint">
                The Future of Microbiology Research
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight">
                Microbial <span className="text-mint">AI</span> Platform
              </h1>
              <p className="text-lg sm:text-xl mb-8 leading-relaxed text-white text-opacity-90 max-w-xl">
                An advanced AI companion for microbiology researchers, students,
                and professionals, offering personalized insights and
                specialized knowledge.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/chat"
                  className="bg-white text-purple hover:bg-gray-100 font-bold py-3 px-8 rounded-full inline-flex items-center justify-center shadow-lg hover:shadow-xl transition-all group"
                >
                  Start Chat
                  <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/credits"
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-purple font-bold py-3 px-8 rounded-full inline-flex items-center justify-center transition-colors group"
                >
                  Get Credits
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="mt-12 grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-bold">99.8%</div>
                  <div className="text-xs text-center">Accuracy Rate</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-bold">2500+</div>
                  <div className="text-xs text-center">
                    Research Papers Analyzed
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-bold">50+</div>
                  <div className="text-xs text-center">Lab Integrations</div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative max-w-sm">
                <div className="absolute inset-0 bg-purple rounded-full blur-3xl opacity-20 transform -rotate-12"></div>
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-white/10 backdrop-filter backdrop-blur-lg p-2 relative z-10 shadow-2xl">
                  <div className="w-full h-full rounded-full border-4 border-mint flex items-center justify-center bg-gradient-to-br from-purple/20 to-mint/20 relative overflow-hidden">
                    <img
                      src={AgenNicky}
                      alt="Microbial AI"
                      className="w-3/4 h-3/4 object-contain z-10"
                    />
                    <div className="absolute top-0 left-0 w-full h-full z-0">
                      <div className="animate-orbit absolute">
                        <GiDna1
                          size={40}
                          className="text-mint filter drop-shadow-lg"
                        />
                      </div>
                      <div
                        className="animate-orbit absolute"
                        style={{
                          animationDelay: "1s",
                          animationDuration: "18s",
                        }}
                      >
                        <FaMicrochip
                          size={30}
                          className="text-purple filter drop-shadow-lg"
                        />
                      </div>
                      <div
                        className="animate-orbit absolute"
                        style={{
                          animationDelay: "2s",
                          animationDuration: "20s",
                        }}
                      >
                        <GiMicroscope
                          size={35}
                          className="text-mint filter drop-shadow-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-3 -right-3 bg-mint text-white p-3 rounded-full shadow-lg z-20">
                  <FaRobot size={28} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg
            className="relative block w-full h-10 sm:h-16"
            data-name="Layer 1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0Z"
              fill="#ffffff"
            ></path>
          </svg>
        </div>
      </div>

      {/* AI Features Section */}
      <div className="bg-offWhite py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
              Our AI Research Tools
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Enhance your microbiology research with our specialized AI
              assistance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature Card 1 */}
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-8">
              <div className="h-14 w-14 rounded-full bg-mint flex items-center justify-center mx-auto mb-6">
                <FaFlask className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-4 text-center">
                Literature Analysis
              </h3>
              <p className="text-gray-600 text-center">
                Search, summarize, and analyze microbiology research papers to
                find the information you need.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-8">
              <div className="h-14 w-14 rounded-full bg-purple flex items-center justify-center mx-auto mb-6">
                <FaChartBar className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-4 text-center">
                Data Interpretation
              </h3>
              <p className="text-gray-600 text-center">
                Get help analyzing your experimental data and interpreting
                results with statistical insights.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-8">
              <div className="h-14 w-14 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-6">
                <FaUsers className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-4 text-center">
                The Anonymous Lounge
              </h3>
              <p className="text-gray-600 text-center">
                Share memes, vent about lab life, and discuss science freely in
                our anonymous social platform powered by Whizpar.
              </p>
              <div className="text-center mt-4">
                <Link
                  to="/communities"
                  className="text-blue-500 hover:text-blue-700 font-medium"
                >
                  Join the Fun →
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/chat"
              className="bg-mint hover:bg-purple text-white font-semibold px-8 py-3 rounded-full transition-colors shadow-md"
            >
              Try Our AI Chat
            </Link>
          </div>
        </div>
      </div>

      {/* Conference Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
              Microbiology Conferences
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Attend virtual conferences to learn from experts and share your
              knowledge
            </p>
          </div>

          <div className="bg-gradient-to-br from-mint/10 to-purple/10 rounded-xl p-8 md:p-10 shadow-md max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-charcoal mb-4">
                  Live & Upcoming Sessions
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="text-mint mr-3 mt-1">
                      <MdLiveTv size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-charcoal">
                        Access to live conferences
                      </p>
                      <p className="text-gray-600 text-sm">
                        Join expert-led sessions on various microbiology topics
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="text-mint mr-3 mt-1">
                      <FaUsers size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-charcoal">
                        Networking opportunities
                      </p>
                      <p className="text-gray-600 text-sm">
                        Connect with other microbiologists during sessions
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="text-mint mr-3 mt-1">
                      <FaCalendarAlt size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-charcoal">
                        Session recordings
                      </p>
                      <p className="text-gray-600 text-sm">
                        Access past conference recordings at your convenience
                      </p>
                    </div>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link
                    to="/conferences"
                    className="inline-flex items-center bg-mint hover:bg-purple text-white font-semibold px-6 py-2 rounded-full transition-colors shadow-sm"
                  >
                    Explore Conferences <FaArrowRight className="ml-2" />
                  </Link>
                </div>
              </div>
              <div className="hidden md:block">
                <img
                  src="/src/assets/conference-illustration.svg"
                  alt="Conference Illustration"
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Conference Section */}
      <LiveConferenceSection />

      {/* Coming Soon Section */}
      <div className="bg-gradient-to-r from-purple to-lightPurple py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block bg-mint/20 text-mint font-semibold px-4 py-1 rounded-full mb-4">
              Coming Soon
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Exciting New Features
            </h2>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto">
              We're constantly improving the platform with new features designed
              for microbiologists
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Coming Soon Feature 1 */}
            <div className="bg-purple/30 backdrop-blur-sm border border-purple/20 rounded-xl p-6 hover:border-mint/30 transition-colors">
              <div className="bg-gradient-to-r from-mint to-purple w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <FaChalkboardTeacher className="text-white" size={20} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Lecture Hosting
              </h3>
              <p className="text-gray-300 text-sm">
                Manage attendance, population sizes, and material distribution
                for your lectures and workshops.
              </p>
            </div>

            {/* Coming Soon Feature 2 */}
            <div className="bg-purple/30 backdrop-blur-sm border border-purple/20 rounded-xl p-6 hover:border-mint/30 transition-colors">
              <div className="bg-gradient-to-r from-mint to-purple w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <FaUsers className="text-white" size={20} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Microbiology Cooperative
              </h3>
              <p className="text-gray-300 text-sm">
                Access a community of microbiologists sharing resources,
                methodologies, and research insights.
              </p>
            </div>

            {/* Coming Soon Feature 3 */}
            <div className="bg-purple/30 backdrop-blur-sm border border-purple/20 rounded-xl p-6 hover:border-mint/30 transition-colors">
              <div className="bg-gradient-to-r from-mint to-purple w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <FaHandshake className="text-white" size={20} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Collaboration Tools
              </h3>
              <p className="text-gray-300 text-sm">
                Work together with other researchers on projects with
                specialized collaboration tools.
              </p>
            </div>

            {/* Coming Soon Feature 4 */}
            <div className="bg-purple/30 backdrop-blur-sm border border-purple/20 rounded-xl p-6 hover:border-mint/30 transition-colors">
              <div className="bg-gradient-to-r from-mint to-purple w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <FaBriefcase className="text-white" size={20} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Job Opportunities
              </h3>
              <p className="text-gray-300 text-sm">
                Discover career opportunities in microbiology research,
                academia, and industry.
              </p>
            </div>

            {/* Coming Soon Feature 5 */}
            <div className="bg-purple/30 backdrop-blur-sm border border-purple/20 rounded-xl p-6 hover:border-mint/30 transition-colors">
              <div className="bg-gradient-to-r from-mint to-purple w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <FaMoneyBillWave className="text-white" size={20} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Monetize Your Notes
              </h3>
              <p className="text-gray-300 text-sm">
                Earn money for every note you upload to our AI system to help
                train and improve the platform.
              </p>
            </div>

            {/* Coming Soon Feature 6 */}
            <div className="bg-purple/30 backdrop-blur-sm border border-purple/20 rounded-xl p-6 hover:border-mint/30 transition-colors">
              <div className="bg-gradient-to-r from-mint to-purple w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <GiMicroscope className="text-white" size={20} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Research Funding
              </h3>
              <p className="text-gray-300 text-sm">
                Get connected to microbiology research grants and funding
                opportunities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-offWhite py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block bg-mint/20 text-mint font-semibold px-4 py-1 rounded-full mb-4">
              Credit System
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
              Pay Only For What You Use
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Our flexible credit system allows you to use features as needed
              without monthly commitments
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-6 md:gap-8">
            {/* Free Credits */}
            <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="bg-gradient-to-r from-mint to-mint/80 p-6 text-center">
                <h3 className="text-2xl font-bold text-white">
                  New User Bonus
                </h3>
                <div className="mt-4 flex items-baseline justify-center">
                  <span className="text-5xl font-extrabold tracking-tight text-white">
                    {DEFAULT_NEW_USER_CREDITS}
                  </span>
                  <span className="ml-1 text-xl text-white">Free Credits</span>
                </div>
              </div>

              <div className="p-6">
                <p className="text-center text-gray-600 mb-6">
                  Every new account starts with {DEFAULT_NEW_USER_CREDITS}{" "}
                  credits to explore our platform
                </p>

                <div className="mt-8">
                  {currentUser ? (
                    <Link
                      to="/chat"
                      className="block w-full bg-mint hover:bg-purple text-white font-semibold px-4 py-3 rounded-full transition-colors shadow-md text-center"
                    >
                      Start Using Credits
                    </Link>
                  ) : (
                    <button
                      onClick={() => setAuthModalOpen(true)}
                      className="block w-full bg-mint hover:bg-purple text-white font-semibold px-4 py-3 rounded-full transition-colors shadow-md text-center"
                    >
                      Create Free Account
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Credit Packages */}
            <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="bg-gradient-to-r from-purple to-purple/80 p-6 text-center">
                <h3 className="text-2xl font-bold text-white">
                  Credit Packages
                </h3>
                <div className="mt-4 flex items-baseline justify-center">
                  <span className="text-5xl font-extrabold tracking-tight text-white">
                    50-300
                  </span>
                  <span className="ml-1 text-xl text-white">Credits</span>
                </div>
              </div>

              <div className="p-6">
                <ul className="space-y-4 mb-6">
                  <li className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="flex items-center">
                      <FaRobot className="text-purple mr-2" />
                      <span>AI Chat Messages</span>
                    </div>
                    <span className="bg-gray-100 px-2 py-1 rounded-full text-sm">
                      {CREDIT_COSTS.CHAT_MESSAGE} credit/msg
                    </span>
                  </li>
                  <li className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="flex items-center">
                      <FaMicroscope className="text-purple mr-2" />
                      <span>Image Analysis</span>
                    </div>
                    <span className="bg-gray-100 px-2 py-1 rounded-full text-sm">
                      {CREDIT_COSTS.IMAGE_ANALYSIS} credits/image
                    </span>
                  </li>
                  <li className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="flex items-center">
                      <MdLiveTv className="text-purple mr-2" />
                      <span>Conference Hosting</span>
                    </div>
                    <span className="bg-gray-100 px-2 py-1 rounded-full text-sm">
                      {CREDIT_COSTS.CONFERENCE_HOSTING} credits
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaUsers className="text-purple mr-2" />
                      <span>Price Range</span>
                    </div>
                    <span className="bg-gray-100 px-2 py-1 rounded-full text-sm">
                      ₦1500-₦6000
                    </span>
                  </li>
                </ul>

                <div className="mt-8">
                  {currentUser ? (
                    <Link
                      to="/credits"
                      className="block w-full bg-purple hover:bg-mint text-white font-semibold px-4 py-3 rounded-full transition-colors shadow-md text-center"
                    >
                      Purchase Credits
                    </Link>
                  ) : (
                    <button
                      onClick={() => setAuthModalOpen(true)}
                      className="block w-full bg-purple hover:bg-mint text-white font-semibold px-4 py-3 rounded-full transition-colors shadow-md text-center"
                    >
                      Sign Up to Buy
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Credit system benefits */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow">
              <div className="w-12 h-12 bg-mint/20 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-mint"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">
                No Monthly Fees
              </h3>
              <p className="text-gray-600">
                Pay only for what you use without being locked into recurring
                subscription charges.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow">
              <div className="w-12 h-12 bg-mint/20 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-mint"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">
                Never Expires
              </h3>
              <p className="text-gray-600">
                Your credits remain valid as long as your account is active. No
                pressure to use them by a deadline.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow">
              <div className="w-12 h-12 bg-mint/20 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-mint"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">
                Complete Flexibility
              </h3>
              <p className="text-gray-600">
                Choose how to allocate your credits across features based on
                your specific research needs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section - Simplified */}
      <div className="py-16 md:py-20 bg-gradient-to-r from-purple to-lightPurple">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Elevate Your Microbiology Work?
          </h2>
          <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto">
            Join our growing community of microbiologists who are advancing
            their research with our specialized AI platform.
          </p>
          <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
            {currentUser ? (
              <Link
                to="/credits"
                className="bg-mint hover:bg-white hover:text-mint text-white font-semibold px-8 py-3 rounded-full transition-colors shadow-md"
              >
                Purchase Credits
              </Link>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="bg-mint hover:bg-white hover:text-mint text-white font-semibold px-8 py-3 rounded-full transition-colors shadow-md"
              >
                Create Free Account
              </button>
            )}
            <Link
              to="/chat"
              className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-full transition-colors shadow-md"
            >
              Try AI Chat
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-6">
                <div className="relative mr-3">
                  <div className="w-10 h-10 rounded-full bg-mint flex items-center justify-center">
                    <GiDna1 className="text-white" size={18} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 text-purple">
                    <FaMicrochip size={10} />
                  </div>
                </div>
                <span className="text-xl font-bold">Microbial AI</span>
              </div>
              <p className="text-gray-100 mb-4 text-sm">
                An advanced AI platform for microbiology research, education,
                and professional development.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-gray-100 hover:text-mint transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-100 hover:text-mint transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-100 hover:text-mint transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"></path>
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-100 hover:text-mint transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">
                Features
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-mint transition-colors"
                  >
                    AI Assistant
                  </a>
                </li>
                <li>
                  <Link
                    to="/communities"
                    className="text-gray-100 hover:text-mint transition-colors"
                  >
                    Communities
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-mint transition-colors"
                  >
                    Conferences
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-mint transition-colors"
                  >
                    Credit System
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-mint transition-colors"
                  >
                    Learning Resources
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">
                Resources
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-mint transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-mint transition-colors"
                  >
                    Microbiology Guides
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-mint transition-colors"
                  >
                    Support
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-mint transition-colors"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Company</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-mint transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-mint transition-colors"
                  >
                    Team
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-mint transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <Link
                    to="/credits"
                    className="text-mint hover:text-white transition-colors"
                  >
                    Purchase Credits
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-100 text-sm">
              © {new Date().getFullYear()} Microbial AI. All rights reserved.
            </p>
            <div className="flex mt-4 md:mt-0 space-x-6 text-sm">
              <a
                href="#"
                className="text-gray-100 hover:text-mint transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-100 hover:text-mint transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-gray-100 hover:text-mint transition-colors"
              >
                Credits Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
