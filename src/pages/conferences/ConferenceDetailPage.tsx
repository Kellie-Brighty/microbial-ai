import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getConference,
  Conference,
  isUserRegisteredForConference,
  registerForConference,
  getUserRegistrationForConference,
  ConferenceRegistration,
} from "../../utils/firebase";
import { getComputedStatus } from "../../utils/conferenceStatus";
import { ConferencePlayer } from "../../components/conferences";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationCircle,
  FaHistory,
  FaCalendarCheck,
  FaMapMarkerAlt,
  FaQrcode,
} from "react-icons/fa";
import Header from "../../components/Header";
// import { signOut, auth } from "../../utils/firebase";
import { useAuth } from "../../context/AuthContext";
import AuthModal from "../../components/auth/AuthModal";
import Notification from "../../components/ui/Notification";
import { MdLiveTv } from "react-icons/md";
import { QRCodeSVG } from "qrcode.react";

// Employment status options
const EMPLOYMENT_STATUS_OPTIONS = [
  "Employed",
  "Self-employed",
  "Student",
  "Unemployed",
  "Retired",
  "Other",
];

// Marital status options
const MARITAL_STATUS_OPTIONS = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
  "Separated",
  "Prefer not to say",
];

// Simple helper to check if a conference has ended
const isConferencePast = (conference: Conference): boolean => {
  return getComputedStatus(conference) === "ended";
};

// Add QR Code modal component
interface RegistrationQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: ConferenceRegistration | null;
  conference: Conference | null;
}

const RegistrationQRModal = ({
  isOpen,
  onClose,
  registration,
  conference,
}: RegistrationQRModalProps) => {
  if (!isOpen || !registration) return null;

  // Generate a registration QR code value - include useful information
  const qrValue = `CONFERENCE REGISTRATION
Name: ${registration.fullName}
Conference: ${conference?.title || "Conference"}
Date: ${
    conference?.startTime
      ? new Date(conference.startTime.seconds * 1000).toLocaleDateString()
      : "N/A"
  }
Venue: ${conference?.venue || "N/A"}
Registration ID: ${registration.id}
Email: ${registration.email}
Verified: YES`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-charcoal mb-2">
          Your Registration QR Code
        </h3>
        <p className="text-gray-600 mb-4">
          Present this QR code at the venue entrance for quick check-in.
        </p>

        <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col items-center">
          <div className="p-2 bg-white rounded-lg shadow-md mb-4">
            <QRCodeSVG
              value={qrValue}
              size={200}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          <div className="text-center">
            <h4 className="font-bold text-charcoal">
              {conference?.title || "Conference"}
            </h4>
            <p className="text-sm text-gray-600">{registration.fullName}</p>
            {conference?.venue && (
              <p className="text-sm text-gray-500 mt-1 flex items-center justify-center">
                <FaMapMarkerAlt className="mr-1" size={12} /> {conference.venue}
              </p>
            )}
            {conference?.startTime && (
              <p className="text-xs text-gray-500 mt-1">
                {new Date(
                  conference.startTime.seconds * 1000
                ).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Registration ID: {registration.id.slice(0, 8)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const ConferenceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conference, setConference] = useState<Conference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const [computedStatus, setComputedStatus] = useState<
    "live" | "upcoming" | "ended"
  >("upcoming");
  const [isPast, setIsPast] = useState(false);

  // Registration related states
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null
  );
  const [_registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userRegistration, setUserRegistration] =
    useState<ConferenceRegistration | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [institution, setInstitution] = useState("");
  const [stateOfOrigin, setStateOfOrigin] = useState("");
  const [lgaOfOrigin, setLgaOfOrigin] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [level, setLevel] = useState("");
  const [nin, setNin] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [skill, setSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");

  // Notification state
  const [notification, setNotification] = useState({
    type: "success" as "success" | "error" | "info",
    message: "",
    isVisible: false,
  });

  // Add QR modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Update computed status when conference data changes
  useEffect(() => {
    if (conference) {
      const status = getComputedStatus(conference);
      const past = isConferencePast(conference);
      setComputedStatus(status);
      setIsPast(past);
    }
    console.log(conference);
  }, [conference]);

  // Check if conference is upcoming and registration is allowed
  const registrationOpen =
    computedStatus === "upcoming" && !isPast && conference !== null;

  // Check if user is the creator of the conference
  const isCreator =
    currentUser?.uid && conference?.organizerId === currentUser.uid;

  useEffect(() => {
    const fetchConference = async () => {
      if (!id) {
        setError("No conference ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const conferenceData = await getConference(id);

        if (conferenceData) {
          setConference(conferenceData);
          // Set computed status right away
          setComputedStatus(getComputedStatus(conferenceData));
          setIsPast(isConferencePast(conferenceData));
        } else {
          setError("Conference not found");
        }
      } catch (err) {
        console.error("Error fetching conference:", err);
        setError("Failed to load conference data");
      } finally {
        setLoading(false);
      }
    };

    fetchConference();
  }, [id]);

  // Check if user is registered for this conference
  useEffect(() => {
    const checkRegistration = async () => {
      if (!currentUser || !id) return;

      try {
        const isRegistered = await isUserRegisteredForConference(
          currentUser.uid,
          id
        );
        setIsRegistered(isRegistered);

        if (isRegistered) {
          const registration = await getUserRegistrationForConference(
            currentUser.uid,
            id
          );
          setUserRegistration(registration);
        }
      } catch (error) {
        console.error("Error checking registration status:", error);
      }
    };

    checkRegistration();
  }, [currentUser, id]);

  // Pre-fill email if user is signed in
  useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
    if (currentUser?.displayName) {
      setFullName(currentUser.displayName);
    }
  }, [currentUser]);

  // const handleSignOut = async () => {
  //   try {
  //     await signOut(auth);
  //     window.location.href = "/";
  //   } catch (error) {
  //     console.error("Error signing out:", error);
  //   }
  // };

  const showNotification = (
    type: "success" | "error" | "info",
    message: string
  ) => {
    setNotification({
      type,
      message,
      isVisible: true,
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, isVisible: false }));
    }, 5000);
  };

  const handleAddSkill = () => {
    if (skill.trim() && !skills.includes(skill.trim())) {
      setSkills((prev) => [...prev, skill.trim()]);
      setSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    // Prevent creators from registering for their own conference
    if (isCreator) {
      setRegistrationError("You cannot register for your own conference");
      showNotification("error", "You cannot register for your own conference");
      return;
    }

    // Validate form
    if (
      !fullName ||
      !age ||
      !institution ||
      !stateOfOrigin ||
      !lgaOfOrigin ||
      !employmentStatus ||
      !nin ||
      !maritalStatus ||
      skills.length === 0 ||
      !phoneNumber ||
      !email
    ) {
      setRegistrationError("Please fill in all required fields");
      showNotification("error", "Please fill in all required fields");
      return;
    }

    // Validate age is a number
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum <= 0) {
      setRegistrationError("Please enter a valid age");
      showNotification("error", "Please enter a valid age");
      return;
    }

    // Validate phone number
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setRegistrationError("Please enter a valid phone number");
      showNotification("error", "Please enter a valid phone number");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setRegistrationError("Please enter a valid email address");
      showNotification("error", "Please enter a valid email address");
      return;
    }

    setRegistrationLoading(true);
    setRegistrationError(null);

    try {
      if (!id) throw new Error("Conference ID is missing");

      await registerForConference(id, currentUser.uid, {
        fullName,
        age: ageNum,
        institution,
        stateOfOrigin,
        lgaOfOrigin,
        employmentStatus,
        matricNumber: matricNumber || undefined,
        level: level || undefined,
        nin,
        maritalStatus,
        skills,
        phoneNumber,
        email,
        twitterHandle: twitterHandle || undefined,
      });

      setRegistrationSuccess(true);
      setIsRegistered(true);
      showNotification(
        "success",
        "Successfully registered for the conference!"
      );

      // Get updated registration details
      const registration = await getUserRegistrationForConference(
        currentUser.uid,
        id
      );
      setUserRegistration(registration);

      // Reset form and close it
      setShowRegistrationForm(false);
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof Error) {
        setRegistrationError(error.message);
        showNotification("error", error.message);
      } else {
        setRegistrationError("Failed to register for the conference");
        showNotification("error", "Failed to register for the conference");
      }
    } finally {
      setRegistrationLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-24">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-[50vh] bg-gray-200 rounded-xl mb-6"></div>
            <div className="h-8 bg-gray-200 w-3/4 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 w-1/2 rounded mb-8"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !conference) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-24 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-charcoal mb-4">
            {error || "Conference not found"}
          </h1>
          <p className="text-gray-600 mb-6">
            The conference you are looking for could not be found or is no
            longer available.
          </p>
          <button
            onClick={() => navigate("/conferences")}
            className="bg-mint text-white px-4 py-2 rounded-full hover:bg-purple transition-colors"
          >
            View All Conferences
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAuthModalOpen={() => setAuthModalOpen(true)} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          showNotification(
            "success",
            "Successfully signed in! Now you can register for the conference."
          );
        }}
      />

      {/* QR Code Modal */}
      <RegistrationQRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        registration={userRegistration}
        conference={conference}
      />

      {/* Notification */}
      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />

      <div className="pt-16 md:pt-16 pb-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center mb-6 mt-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-teal-500 hover:text-blue-600 transition-colors"
            >
              <FaArrowLeft className="mr-2" /> Back
            </button>
          </div>

          {/* Show status and venue information */}
          {conference && (
            <>
              <div
                className={`rounded-lg px-4 py-3 mb-6 flex items-center ${
                  computedStatus === "live"
                    ? "bg-red-100 text-red-800 border-l-4 border-red-500"
                    : computedStatus === "upcoming"
                    ? "bg-mint/10 text-mint"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {computedStatus === "live" && (
                  <>
                    <span className="inline-block w-3 h-3 rounded-full bg-red-600 mr-2 animate-pulse"></span>
                    <span className="font-medium">LIVE NOW:</span> This
                    conference is streaming live! Join now to participate in
                    real-time.
                  </>
                )}
                {computedStatus === "upcoming" && !isPast && (
                  <>
                    <FaCalendarCheck className="mr-2" />
                    This conference is upcoming and open for registration.
                  </>
                )}
                {(computedStatus === "ended" || isPast) && (
                  <>
                    <FaHistory className="mr-2" />
                    This conference has already ended. You can still watch the
                    recording.
                  </>
                )}
              </div>

              {/* Display venue information */}
              {conference.venue && (
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="text-mint mt-1 mr-3" size={20} />
                    <div>
                      <h3 className="font-medium text-lg text-charcoal mb-1">
                        Venue Information
                      </h3>
                      <p className="text-gray-600">{conference.venue}</p>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(
                          conference.venue
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mint hover:text-purple text-sm inline-flex items-center mt-2"
                      >
                        View on Google Maps
                        <svg
                          className="w-3 h-3 ml-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content - conference player */}
            <div className="lg:col-span-2">
              <ConferencePlayer conference={conference} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Registration Section */}
              {conference && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <h2 className="text-xl font-bold text-charcoal mb-4">
                    Conference{" "}
                    {registrationOpen ? "Registration" : "Information"}
                  </h2>

                  {isRegistered ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center text-green-600 mb-2">
                        <FaCheckCircle className="mr-2" />
                        <span className="font-medium">
                          Registration Complete!
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        You're all set for this conference. Check your email for
                        confirmation details.
                      </p>
                      {userRegistration && (
                        <div className="mt-4 pt-4 border-t border-green-200">
                          <h3 className="text-sm font-medium text-charcoal mb-2">
                            Registration Details:
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Name:</span>{" "}
                            {userRegistration.fullName}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">
                              Registration Date:
                            </span>{" "}
                            {userRegistration.registeredAt
                              ? new Date(
                                  userRegistration.registeredAt.seconds * 1000
                                ).toLocaleDateString()
                              : "Processing..."}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">
                              Registration ID:
                            </span>{" "}
                            {userRegistration.id.slice(0, 8)}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link
                              to="/dashboard"
                              className="text-mint hover:underline text-sm flex items-center"
                            >
                              View all my registrations
                              <svg
                                className="w-3 h-3 ml-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </Link>

                            <button
                              onClick={() => setQrModalOpen(true)}
                              className="bg-purple text-white text-sm px-3 py-1 rounded-md flex items-center hover:bg-purple/80 transition-colors"
                            >
                              <FaQrcode className="mr-1" size={14} /> View QR
                              Code
                            </button>
                          </div>

                          <div className="mt-4 pt-4 border-t border-green-200">
                            <h3 className="text-sm font-medium text-charcoal mb-2">
                              Conference Activities:
                            </h3>
                            <Link
                              to={`/conferences/${id}/quizzes`}
                              className="bg-blue-600 text-white text-sm px-3 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors mt-2 w-full justify-center"
                            >
                              <span className="mr-2">🧠</span> Take Quiz
                              Sessions
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : isPast || computedStatus === "ended" ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center text-gray-600 mb-2">
                        <FaHistory className="mr-2" />
                        <span className="font-medium">
                          Conference Has Ended
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        This conference has already taken place. You can still
                        watch the recording.
                      </p>
                      <Link
                        to="#player"
                        className="bg-purple text-white text-sm px-4 py-2 rounded-lg inline-block"
                      >
                        Watch Recording
                      </Link>
                    </div>
                  ) : computedStatus === "live" ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-4">
                      <div className="flex items-center mb-3">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                        <span className="font-medium text-red-700 text-lg">
                          Live Now!
                        </span>
                      </div>

                      <p className="text-gray-700 mb-4">
                        <span className="font-medium">Don't miss out!</span>{" "}
                        This conference is streaming live right now. Join the
                        conversation and interact with experts in real-time.
                      </p>

                      {conference.endTime && (
                        <div className="mb-4 p-3 bg-white rounded-lg border border-red-200">
                          <div className="text-sm text-gray-600 mb-1">
                            Live stream ends in:
                          </div>
                          <div className="text-red-700 font-semibold">
                            {Math.floor(
                              (new Date(
                                conference.endTime.seconds * 1000
                              ).getTime() -
                                new Date().getTime()) /
                                3600000
                            )}{" "}
                            hours{" "}
                            {Math.floor(
                              ((new Date(
                                conference.endTime.seconds * 1000
                              ).getTime() -
                                new Date().getTime()) %
                                3600000) /
                                60000
                            )}{" "}
                            minutes
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-3">
                        <a
                          href={conference.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-red-600 text-white px-4 py-3 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors shadow-md"
                        >
                          <MdLiveTv className="mr-2" size={20} /> Join Live
                          Stream Now
                        </a>

                        {isRegistered ? (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-center bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg">
                              <FaCheckCircle className="mr-2" size={16} />
                              <span className="font-medium">
                                You are registered for this event
                              </span>
                            </div>
                            <Link
                              to={`/conferences/${id}/quizzes`}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                            >
                              <span className="mr-2">🧠</span> Participate in
                              Quiz Sessions
                            </Link>
                          </div>
                        ) : (
                          <div className="text-sm text-center text-gray-600 p-2">
                            Registration is currently unavailable during live
                            conferences
                          </div>
                        )}
                      </div>
                    </div>
                  ) : isCreator ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center text-blue-700 mb-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-medium">
                          Conference Organizer Tools
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        As the organizer, you have access to special tools to
                        manage your conference.
                      </p>
                      <div className="mt-4 flex flex-col gap-3">
                        <Link
                          to={`/conferences/${id}/registrants`}
                          className="bg-mint text-white text-sm px-4 py-2 rounded-md flex items-center justify-center hover:bg-purple transition-colors"
                        >
                          <span className="mr-2">👥</span> View & Manage
                          Registrants
                        </Link>
                        <Link
                          to={`/conferences/${id}/quizzes`}
                          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md flex items-center justify-center hover:bg-blue-700 transition-colors"
                        >
                          <span className="mr-2">🧠</span> Manage Quiz Sessions
                        </Link>
                        <Link
                          to="/dashboard"
                          className="bg-gray-500 text-white text-sm px-4 py-2 rounded-md flex items-center justify-center hover:bg-gray-600 transition-colors"
                        >
                          <span className="mr-2">📊</span> Go to Dashboard
                        </Link>
                      </div>
                    </div>
                  ) : !showRegistrationForm ? (
                    <>
                      <p className="text-gray-600 mb-6">
                        Register now to secure your spot for this conference.
                        You'll receive updates and access to the live stream.
                      </p>

                      <button
                        onClick={() => {
                          if (!currentUser) {
                            setAuthModalOpen(true);
                          } else {
                            setShowRegistrationForm(true);
                          }
                        }}
                        className="w-full bg-mint text-white font-medium rounded-lg py-2 px-4 hover:bg-purple transition-colors"
                      >
                        Register Now
                      </button>
                    </>
                  ) : (
                    <div>
                      {registrationError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-600">
                          <div className="flex items-center mb-1">
                            <FaExclamationCircle className="mr-2" />
                            <span className="font-medium">
                              Registration Error
                            </span>
                          </div>
                          <p>{registrationError}</p>
                        </div>
                      )}

                      <form
                        onSubmit={handleRegistrationSubmit}
                        className="space-y-4"
                      >
                        {/* Personal Information */}
                        <div>
                          <h3 className="text-md font-medium text-charcoal mb-3">
                            Personal Information
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-mint"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Age *
                              </label>
                              <input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-mint"
                                required
                                min="1"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Marital Status *
                              </label>
                              <select
                                value={maritalStatus}
                                onChange={(e) =>
                                  setMaritalStatus(e.target.value)
                                }
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-mint"
                                required
                              >
                                <option value="">Select Marital Status</option>
                                {MARITAL_STATUS_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                NIN (National Identification Number) *
                              </label>
                              <input
                                type="text"
                                value={nin}
                                onChange={(e) => setNin(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-mint"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* Location Information */}
                        <div>
                          <h3 className="text-md font-medium text-charcoal mb-3">
                            Location Information
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                State of Origin *
                              </label>
                              <input
                                type="text"
                                value={stateOfOrigin}
                                onChange={(e) =>
                                  setStateOfOrigin(e.target.value)
                                }
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-mint"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                LGA of Origin *
                              </label>
                              <input
                                type="text"
                                value={lgaOfOrigin}
                                onChange={(e) => setLgaOfOrigin(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-mint"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* Education/Employment */}
                        <div>
                          <h3 className="text-md font-medium text-charcoal mb-3">
                            Education & Employment
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Institution *
                              </label>
                              <input
                                type="text"
                                value={institution}
                                onChange={(e) => setInstitution(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-mint"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Employment Status *
                              </label>
                              <select
                                value={employmentStatus}
                                onChange={(e) =>
                                  setEmploymentStatus(e.target.value)
                                }
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-mint"
                                required
                              >
                                <option value="">
                                  Select Employment Status
                                </option>
                                {EMPLOYMENT_STATUS_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Matric Number (if student)
                              </label>
                              <input
                                type="text"
                                value={matricNumber}
                                onChange={(e) =>
                                  setMatricNumber(e.target.value)
                                }
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-mint"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Level (if student)
                              </label>
                              <input
                                type="text"
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-mint"
                                placeholder="e.g. 300 Level, Masters, PhD"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Skills */}
                        <div>
                          <h3 className="text-md font-medium text-charcoal mb-3">
                            Skills *
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {skills.map((s, index) => (
                              <div
                                key={index}
                                className="bg-mint text-white px-2 py-1 rounded-full text-xs flex items-center"
                              >
                                <span>{s}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSkill(s)}
                                  className="ml-1 hover:text-red-200"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="flex">
                            <input
                              type="text"
                              value={skill}
                              onChange={(e) => setSkill(e.target.value)}
                              placeholder="Add a skill"
                              className="flex-grow px-3 py-2 border rounded-l-md focus:outline-none focus:ring-1 focus:ring-mint"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddSkill();
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleAddSkill}
                              className="bg-mint text-white px-4 py-2 rounded-r-md hover:bg-purple transition-colors"
                            >
                              Add
                            </button>
                          </div>
                          {skills.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">
                              Please add at least one skill
                            </p>
                          )}
                        </div>

                        {/* Contact Information */}
                        <div>
                          <h3 className="text-md font-medium text-charcoal mb-3">
                            Contact Information
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number *
                              </label>
                              <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-mint"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                              </label>
                              <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-mint"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Twitter Handle (optional)
                              </label>
                              <input
                                type="text"
                                value={twitterHandle}
                                onChange={(e) =>
                                  setTwitterHandle(e.target.value)
                                }
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-mint"
                                placeholder="@username"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 flex justify-between space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowRegistrationForm(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={registrationLoading}
                            className="flex-1 px-4 py-2 bg-mint text-white rounded-md hover:bg-purple focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {registrationLoading
                              ? "Registering..."
                              : "Complete Registration"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-charcoal mb-4">
                  About the Organizer
                </h2>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-xl mr-3">
                    {conference.organizer.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-charcoal">
                      {conference.organizer}
                    </div>
                    <div className="text-sm text-gray-500">NAMSITE Member</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  The organizer has not provided additional information.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-charcoal mb-4">
                  Related Conferences
                </h2>
                <div className="text-gray-600 text-sm">
                  No related conferences available at this time.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConferenceDetailPage;
