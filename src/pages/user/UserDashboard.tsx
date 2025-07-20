import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getUserConferenceRegistrations,
  getUserQuizSubmissions,
  getUserCertificates,
  getUserOrganizedConferences,
  getConference,
  getQuiz,
  checkAuthorStatus,
  getAuthorApplication,
  getArticlesByAuthor,
  updateConference,
  endConference,
} from "../../utils/firebase";
import {
  Conference,
  ConferenceRegistration,
  QuizSubmission,
  Quiz,
  Certificate,
} from "../../utils/firebase";
import {
  FaMedal,
  FaBook,
  FaPen,
  FaPlus,
  FaEye,
  FaCheckCircle,
} from "react-icons/fa";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../../utils/firebase";
import Header from "../../components/Header";
import AuthModal from "../../components/auth/AuthModal";
import { EmailVerification } from "../../components/auth";
import AuthorApplicationModal from "../../components/articles/AuthorApplicationModal";
import ArticleCreationModal from "../../components/articles/ArticleCreationModal";
import {
  FaCalendarAlt,
  FaHistory,
  FaClock,
  // FaTrash,
  FaPlay,
  FaStop,
  FaQrcode,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaTrophy,
  FaBrain,
  FaTimes,
  FaEnvelope,
  FaExclamationTriangle,
} from "react-icons/fa";
import { MdAddCircle } from "react-icons/md";
import Notification from "../../components/ui/Notification";
import { getComputedStatus } from "../../utils/conferenceStatus";
import { QRCodeSVG } from "qrcode.react";
import { FiDollarSign } from "react-icons/fi";
import { getUserCredits } from "../../utils/creditsSystem";
import CreditHistoryTable from "../../components/credits/CreditHistoryTable";
// import { Timestamp as FirestoreTimestamp } from "firebase/firestore";

// Add a confirmation modal component
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText: string;
  isLoading: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-charcoal mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Add a QR modal component to display QR codes
interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: (ConferenceRegistration & { conference?: Conference }) | null;
  conference?: Conference;
}

const QRCodeModal = ({
  isOpen,
  onClose,
  registration,
  conference,
}: QRCodeModalProps) => {
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
            <p className="text-sm text-gray-600">{registration?.fullName}</p>
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
              Registration ID: {registration?.id?.slice(0, 8)}
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

// Add a Points Breakdown modal component
interface PointsBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizSubmissions: Array<QuizSubmission & { quiz?: Quiz }>;
  totalPoints: number;
}

const PointsBreakdownModal: React.FC<PointsBreakdownModalProps> = ({
  isOpen,
  onClose,
  quizSubmissions,
  totalPoints,
}) => {
  if (!isOpen) return null;

  // Sort submissions by score percentage (highest first)
  const sortedSubmissions = [...quizSubmissions].sort((a, b) => {
    const aPercentage = (a.score / a.maxPossibleScore) * 100;
    const bPercentage = (b.score / b.maxPossibleScore) * 100;
    return bPercentage - aPercentage;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full p-6 max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-charcoal">Your Quiz Points</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="mb-6 bg-offWhite p-4 rounded-lg border border-lightGray">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaTrophy className="text-yellow-500 mr-3 text-2xl" />
              <div>
                <h4 className="font-bold text-lg text-charcoal">
                  Total Points
                </h4>
                <p className="text-gray-600">From all quiz completions</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-mint">{totalPoints}</div>
          </div>
        </div>

        <h4 className="font-bold text-lg text-charcoal mb-3">
          Points Breakdown
        </h4>

        {quizSubmissions.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <FaBrain className="mx-auto text-gray-300 text-3xl mb-2" />
            <p className="text-gray-500">
              You haven't completed any quizzes yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedSubmissions.map((submission) => {
              const scorePercentage = Math.round(
                (submission.score / submission.maxPossibleScore) * 100
              );
              const isPassing = scorePercentage >= 70;

              return (
                <div
                  key={submission.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div
                    className={`p-3 border-b ${
                      isPassing
                        ? "bg-green-50 border-green-100"
                        : "bg-red-50 border-red-100"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h5 className="font-medium text-charcoal">
                        {submission.quiz?.title || "Quiz"}
                      </h5>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isPassing
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {scorePercentage}%
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <div>
                          Points earned:{" "}
                          <span className="font-bold">{submission.score}</span>
                        </div>
                        <div>Total possible: {submission.maxPossibleScore}</div>
                        {submission.completedAt && (
                          <div className="text-xs mt-1 text-gray-500">
                            Completed on{" "}
                            {new Date(
                              submission.completedAt.seconds * 1000
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="text-2xl font-bold text-mint">
                        +{submission.score}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end">
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

const UserDashboard: React.FC = () => {
  const { currentUser, isEmailVerified } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<
    Array<ConferenceRegistration & { conference?: Conference }>
  >([]);
  const [organizedConferences, setOrganizedConferences] = useState<
    Conference[]
  >([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<
    Array<QuizSubmission & { quiz?: Quiz }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [organizerLoading, setOrganizerLoading] = useState(true);
  const [certificatesLoading, setCertificatesLoading] = useState(true);
  const [_quizSubmissionsLoading, setQuizSubmissionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizerError, setOrganizerError] = useState<string | null>(null);
  const [certificatesError, setCertificatesError] = useState<string | null>(
    null
  );
  const [_quizSubmissionsError, setQuizSubmissionsError] = useState<
    string | null
  >(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  // Credit balance state
  const [credits, setCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);

  // Notification state
  const [notification, setNotification] = useState({
    type: "success" as "success" | "error" | "info",
    message: "",
    isVisible: false,
  });

  // Email verification related state
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  // const [resendingVerification, setResendingVerification] = useState(false);

  // Add state for QR code modal
  const [selectedRegistration, setSelectedRegistration] = useState<
    (ConferenceRegistration & { conference?: Conference }) | null
  >(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Add state for the points breakdown modal
  const [pointsModalOpen, setPointsModalOpen] = useState(false);

  // Add state for the confirmation modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [conferenceToEnd, setConferenceToEnd] = useState<string | null>(null);
  const [conferenceToStart, setConferenceToStart] = useState<string | null>(
    null
  );

  // Articles state
  const [authorStatus, setAuthorStatus] = useState<string | null>(null);
  const [authorApplication, setAuthorApplication] = useState<any>(null);
  const [userArticles, setUserArticles] = useState<any[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [authorStatusUnsubscribe, setAuthorStatusUnsubscribe] = useState<
    (() => void) | null
  >(null);
  const [authorApplicationModalOpen, setAuthorApplicationModalOpen] =
    useState(false);
  const [articleCreationModalOpen, setArticleCreationModalOpen] =
    useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  }, []);

  // Fetch user's quiz submissions
  useEffect(() => {
    const fetchQuizSubmissions = async () => {
      if (!currentUser) {
        setQuizSubmissionsLoading(false);
        return;
      }

      try {
        setQuizSubmissionsLoading(true);
        const submissions = await getUserQuizSubmissions(currentUser.uid);

        // Fetch quiz details for each submission
        const submissionsWithQuizzes = await Promise.all(
          submissions.map(async (submission) => {
            try {
              const quiz = await getQuiz(submission.quizId);
              return { ...submission, quiz: quiz || undefined };
            } catch (error) {
              console.error(`Error fetching quiz ${submission.quizId}:`, error);
              return { ...submission, quiz: undefined };
            }
          })
        );

        setQuizSubmissions(submissionsWithQuizzes);
      } catch (error) {
        console.error("Error fetching quiz submissions:", error);
        setQuizSubmissionsError(
          "Failed to load your quiz submissions. Please try again later."
        );
      } finally {
        setQuizSubmissionsLoading(false);
      }
    };

    fetchQuizSubmissions();
  }, [currentUser]);

  // Fetch user's registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userRegistrations = await getUserConferenceRegistrations(
          currentUser.uid
        );

        // Fetch conference details for each registration
        const registrationsWithConferences = await Promise.all(
          userRegistrations.map(async (registration) => {
            try {
              const conference = await getConference(registration.conferenceId);
              // Convert null to undefined to match our state type
              return { ...registration, conference: conference || undefined };
            } catch (error) {
              console.error(
                `Error fetching conference ${registration.conferenceId}:`,
                error
              );
              return { ...registration, conference: undefined };
            }
          })
        );

        setRegistrations(registrationsWithConferences);
      } catch (error) {
        console.error("Error fetching user registrations:", error);
        setError("Failed to load your registrations. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [currentUser]);

  // Fetch user's certificates
  useEffect(() => {
    const fetchCertificates = async () => {
      if (!currentUser) {
        setCertificatesLoading(false);
        return;
      }

      try {
        setCertificatesLoading(true);
        const userCertificates = await getUserCertificates(currentUser.uid);
        setCertificates(userCertificates);
      } catch (error) {
        console.error("Error fetching certificates:", error);
        setCertificatesError(
          "Failed to load your certificates. Please try again later."
        );
      } finally {
        setCertificatesLoading(false);
      }
    };

    fetchCertificates();
  }, [currentUser]);

  // Fetch conferences organized by the user
  useEffect(() => {
    const fetchOrganizedConferences = async () => {
      if (!currentUser) {
        setOrganizerLoading(false);
        return;
      }

      try {
        setOrganizerLoading(true);
        const conferences = await getUserOrganizedConferences(currentUser.uid);
        setOrganizedConferences(conferences);
      } catch (error) {
        console.error("Error fetching organized conferences:", error);
        setOrganizerError(
          "Failed to load your created conferences. Please try again later."
        );
      } finally {
        setOrganizerLoading(false);
      }
    };

    fetchOrganizedConferences();
  }, [currentUser]);

  // Fetch user credits
  useEffect(() => {
    const fetchUserCredits = async () => {
      if (!currentUser) {
        setCreditsLoading(false);
        return;
      }

      try {
        setCreditsLoading(true);
        const userCredits = await getUserCredits(currentUser.uid);
        setCredits(userCredits);
      } catch (error) {
        console.error("Error fetching user credits:", error);
        // Don't set error state for credits as it's not critical
      } finally {
        setCreditsLoading(false);
      }
    };

    fetchUserCredits();
  }, [currentUser]);

  // Fetch articles data
  const fetchArticlesData = async () => {
    if (!currentUser) return;

    setArticlesLoading(true);
    try {
      // Get author status and application
      const authorStatus = await checkAuthorStatus(currentUser.uid);
      setAuthorStatus(authorStatus);

      if (authorStatus === "pending" || authorStatus === "rejected") {
        const application = await getAuthorApplication(currentUser.uid);
        setAuthorApplication(application);
      }

      // Get user's published articles
      const articles = await getArticlesByAuthor(currentUser.uid);
      setUserArticles(articles);

      // Set up real-time listener for author application status
      const unsubscribe = onSnapshot(
        doc(db, "authorApplications", currentUser.uid),
        (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setAuthorStatus(data.verificationStatus);
            setAuthorApplication(data);
          } else {
            setAuthorStatus(null);
            setAuthorApplication(null);
          }
        },
        (error) => {
          console.error("Error listening to author application:", error);
        }
      );

      // Store unsubscribe function
      setAuthorStatusUnsubscribe(() => unsubscribe);
    } catch (error) {
      console.error("Error fetching articles data:", error);
    } finally {
      setArticlesLoading(false);
    }
  };

  useEffect(() => {
    fetchArticlesData();
  }, [currentUser]);

  // Cleanup real-time listener on unmount
  useEffect(() => {
    return () => {
      if (authorStatusUnsubscribe) {
        authorStatusUnsubscribe();
      }
    };
  }, [authorStatusUnsubscribe]);

  // const handleResendVerification = async () => {
  //   if (!currentUser) return;

  //   setResendingVerification(true);
  //   try {
  //     const success = await sendVerificationEmail();
  //     if (success) {
  //       showNotification(
  //         "success",
  //         "Verification email sent! Please check your inbox."
  //       );
  //       setVerificationModalOpen(false);
  //     } else {
  //       showNotification(
  //         "error",
  //         "Failed to send verification email. Please try again later."
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Error sending verification email:", error);
  //     showNotification(
  //       "error",
  //       "An error occurred while sending the verification email."
  //     );
  //   } finally {
  //     setResendingVerification(false);
  //   }
  // };

  // const handleSignOut = async () => {
  //   try {
  //     await signOut(auth);
  //     navigate("/");
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

  // Group registrations by status
  const upcomingRegistrations = registrations.filter(
    (reg) => reg.conference?.status === "upcoming"
  );

  const liveRegistrations = registrations.filter(
    (reg) => reg.conference?.status === "live"
  );

  const pastRegistrations = registrations.filter(
    (reg) => reg.conference?.status === "ended"
  );

  // Group organized conferences by status
  const upcomingOrganized = organizedConferences.filter(
    (conf) => getComputedStatus(conf) === "upcoming"
  );

  const liveOrganized = organizedConferences.filter(
    (conf) => getComputedStatus(conf) === "live"
  );

  const pastOrganized = organizedConferences.filter(
    (conf) => getComputedStatus(conf) === "ended"
  );

  // Show confirmation modal for starting a conference
  const showStartConfirmation = (conferenceId: string) => {
    setConferenceToStart(conferenceId);
    setConfirmModalOpen(true);
  };

  // Handle starting a conference (change status to live)
  const handleStartConference = async (conferenceId: string) => {
    if (!currentUser) return;

    try {
      setActionInProgress(conferenceId);

      // Use a JavaScript Date for the current time
      const now = new Date();

      // Update the conference with status "live" and current time as startTime
      await updateConference(conferenceId, {
        status: "live",
        startTime: now, // Firebase will handle the conversion appropriately
      });

      // Update local state
      setOrganizedConferences((prev) =>
        prev.map((conf) =>
          conf.id === conferenceId
            ? {
                ...conf,
                status: "live",
                // Create a Timestamp-like object for the UI
                startTime: {
                  seconds: Math.floor(now.getTime() / 1000),
                  nanoseconds: 0,
                },
              }
            : conf
        )
      );

      showNotification("success", "Conference is now live!");
    } catch (error) {
      console.error("Error starting conference:", error);
      showNotification(
        "error",
        "Failed to start conference. Please try again."
      );
    } finally {
      setActionInProgress(null);
      // Close the modal if it was opened
      setConfirmModalOpen(false);
      setConferenceToStart(null);
    }
  };

  // Handle the actual start conference action after confirmation
  const handleStartConferenceConfirmed = async () => {
    if (!conferenceToStart) return;
    await handleStartConference(conferenceToStart);
  };

  // Handle ending a conference
  // const handleEndConference = async (conferenceId: string) => {
  //   if (!currentUser) return;

  //   try {
  //     setActionInProgress(conferenceId);

  //     // Use a JavaScript Date for the current time
  //     const now = new Date();

  //     // Update the conference with status "ended" and current time as endTime
  //     await updateConference(conferenceId, {
  //       status: "ended",
  //       endTime: now, // Firebase will handle the conversion appropriately
  //     });

  //     // Update local state
  //     setOrganizedConferences((prev) =>
  //       prev.map((conf) =>
  //         conf.id === conferenceId
  //           ? {
  //               ...conf,
  //               status: "ended",
  //               // Create a Timestamp-like object for the UI
  //               endTime: {
  //                 seconds: Math.floor(now.getTime() / 1000),
  //                 nanoseconds: 0,
  //               },
  //             }
  //           : conf
  //       )
  //     );

  //     showNotification("success", "Conference has been ended successfully.");
  //   } catch (error) {
  //     console.error("Error ending conference:", error);
  //     showNotification("error", "Failed to end conference. Please try again.");
  //   } finally {
  //     setActionInProgress(null);
  //     // Close the modal
  //     setConfirmModalOpen(false);
  //     setConferenceToEnd(null);
  //   }
  // };

  // Show confirmation modal for ending a livestream
  const showEndConfirmation = (conferenceId: string) => {
    setConferenceToEnd(conferenceId);
    setConfirmModalOpen(true);
  };

  // Handle the actual end conference action after confirmation
  const handleEndConferenceConfirmed = async () => {
    if (!conferenceToEnd) return;

    try {
      setActionInProgress(conferenceToEnd);

      // Use the dedicated endConference function
      await endConference(conferenceToEnd);

      // Update local state
      setOrganizedConferences((prev) =>
        prev.map((conf) =>
          conf.id === conferenceToEnd
            ? {
                ...conf,
                status: "ended",
                // Create a Timestamp-like object for the UI with current time
                endTime: {
                  seconds: Math.floor(Date.now() / 1000),
                  nanoseconds: 0,
                },
              }
            : conf
        )
      );

      showNotification("success", "Conference has been ended successfully.");
    } catch (error) {
      console.error("Error ending conference:", error);
      showNotification("error", "Failed to end conference. Please try again.");
    } finally {
      setActionInProgress(null);
      // Close the modal
      setConfirmModalOpen(false);
      setConferenceToEnd(null);
    }
  };

  // Show QR code modal
  const showQRCode = (
    registration: ConferenceRegistration & { conference?: Conference }
  ) => {
    setSelectedRegistration(registration);
    setQrModalOpen(true);
  };

  // Calculate total points
  const totalQuizPoints = quizSubmissions.reduce(
    (total, submission) => total + submission.score,
    0
  );

  // If not logged in, redirect to login
  if (!currentUser && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onAuthModalOpen={() => setAuthModalOpen(true)} />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setAuthModalOpen(false);
            showNotification("success", "Successfully signed in!");
            window.location.reload(); // Reload to fetch user data
          }}
        />
        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8 text-center">
              <div className="text-gray-400 text-5xl mb-4">🔒</div>
              <h1 className="text-2xl font-bold text-charcoal mb-4">
                Please Sign In
              </h1>
              <p className="text-gray-600 mb-6">
                You need to be signed in to view your dashboard and manage your
                conference registrations.
              </p>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="bg-mint text-white px-6 py-2 rounded-full hover:bg-purple transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAuthModalOpen={() => setAuthModalOpen(true)} />

      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />

      {/* Email Verification Warning */}
      {currentUser && !isEmailVerified() && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap">
              <div className="w-0 flex-1 flex items-center">
                <span className="flex p-2 rounded-lg bg-yellow-100">
                  <FaExclamationTriangle className="h-5 w-5 text-yellow-600" />
                </span>
                <p className="ml-3 font-medium text-yellow-700 truncate">
                  <span className="hidden md:inline">
                    Your email address hasn't been verified. Some features might
                    be restricted.
                  </span>
                  <span className="inline md:hidden">
                    Email verification required
                  </span>
                </p>
              </div>
              <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
                <button
                  onClick={() => setVerificationModalOpen(true)}
                  className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-yellow-600 bg-white hover:bg-yellow-50 transition-colors"
                >
                  <FaEnvelope className="mr-2" />
                  Verify now
                </button>
              </div>
              <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
                <button
                  type="button"
                  className="-mr-1 flex p-2 rounded-md hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  onClick={() => setVerificationModalOpen(false)}
                >
                  <span className="sr-only">Dismiss</span>
                  <FaTimes className="h-4 w-4 text-yellow-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        registration={selectedRegistration}
        conference={selectedRegistration?.conference}
      />

      {/* Points Breakdown Modal */}
      <PointsBreakdownModal
        isOpen={pointsModalOpen}
        onClose={() => setPointsModalOpen(false)}
        quizSubmissions={quizSubmissions}
        totalPoints={totalQuizPoints}
      />

      {/* Confirmation Modal for ending a livestream */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setConferenceToEnd(null);
          setConferenceToStart(null);
        }}
        onConfirm={
          conferenceToEnd
            ? handleEndConferenceConfirmed
            : handleStartConferenceConfirmed
        }
        title={conferenceToEnd ? "End Conference" : "Start Conference"}
        message={
          conferenceToEnd
            ? "Are you sure you want to end this conference? This will mark it as complete and stop the live stream."
            : "Are you sure you want to start this conference now? This will make it live immediately."
        }
        confirmButtonText={
          conferenceToEnd ? "End Conference" : "Start Conference"
        }
        isLoading={!!actionInProgress}
      />

      {/* Email Verification Modal */}
      {verificationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <EmailVerification
              onClose={() => setVerificationModalOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-mint to-purple text-white rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-2xl font-bold mb-2">
                  Welcome, {currentUser?.displayName || "User"}!
                </h1>
                <p className="text-mint-100">
                  Manage your conferences and registrations
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/conferences"
                  className="bg-white text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-center font-medium"
                >
                  Browse Conferences
                </Link>
                <Link
                  to="/conferences/create"
                  className="bg-white text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-center font-medium"
                >
                  + Create Conference
                </Link>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center">
                  <FaMedal className="text-yellow-500 mr-2" />
                  <span className="font-medium text-gray-800">
                    {totalQuizPoints} Quiz Points
                  </span>
                </div>
                <button
                  onClick={() => setPointsModalOpen(true)}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Details
                </button>
              </div>
            </div>
          </div>

          {/* Articles Section - Prominent Position */}
          {currentUser && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-mint/10 to-purple/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-charcoal flex items-center">
                    <FaBook className="mr-2 text-mint" /> Articles &
                    Publications
                  </h2>
                  <Link
                    to="/articles"
                    className="text-sm text-mint hover:text-purple transition-colors"
                  >
                    Browse All Articles
                  </Link>
                </div>
              </div>

              {articlesLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-t-mint border-gray-200 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500">Loading articles data...</p>
                </div>
              ) : authorStatus === null ? (
                <div className="p-6 text-center">
                  <div className="text-gray-400 text-4xl mb-4">✍️</div>
                  <h3 className="text-lg font-medium text-charcoal mb-2">
                    Become an Author
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Share your knowledge and earn from your articles. Apply to
                    become an author today.
                  </p>
                  <button
                    onClick={() => setAuthorApplicationModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors"
                  >
                    <FaPen className="mr-2" />
                    Apply for Author Role
                  </button>
                </div>
              ) : authorStatus === "pending" ? (
                <div className="p-6 text-center">
                  <div className="text-yellow-400 text-4xl mb-4">⏳</div>
                  <h3 className="text-lg font-medium text-charcoal mb-2">
                    Application Under Review
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Your author application is being reviewed. You'll receive a
                    notification once it's processed.
                  </p>
                  {authorApplication && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                      <h4 className="font-medium text-yellow-800 mb-2">
                        Application Details
                      </h4>
                      <p className="text-sm text-yellow-700">
                        Submitted on:{" "}
                        {authorApplication.submittedAt
                          ?.toDate?.()
                          ?.toLocaleDateString() || "Unknown date"}
                      </p>
                    </div>
                  )}
                </div>
              ) : authorStatus === "rejected" ? (
                <div className="p-6 text-center">
                  <div className="text-red-400 text-4xl mb-4">❌</div>
                  <h3 className="text-lg font-medium text-charcoal mb-2">
                    Application Not Approved
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Your author application was not approved. You can apply
                    again with improved credentials.
                  </p>
                  {authorApplication?.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left mb-4">
                      <h4 className="font-medium text-red-800 mb-2">
                        Reason for Rejection
                      </h4>
                      <p className="text-sm text-red-700">
                        {authorApplication.rejectionReason}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => setAuthorApplicationModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors"
                  >
                    <FaPen className="mr-2" />
                    Apply Again
                  </button>
                </div>
              ) : authorStatus === "approved" ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-full mr-3">
                        <FaCheckCircle className="text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-charcoal">
                          Author Status: Approved
                        </h3>
                        <p className="text-sm text-gray-600">
                          You can now publish articles and earn royalties
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setArticleCreationModalOpen(true)}
                      className="inline-flex items-center px-4 py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors"
                    >
                      <FaPlus className="mr-2" />
                      Publish Article
                    </button>
                  </div>

                  {userArticles.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-4">📝</div>
                      <h3 className="text-lg font-medium text-charcoal mb-2">
                        No Articles Published Yet
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Start sharing your knowledge by publishing your first
                        article.
                      </p>
                      <button
                        onClick={() => setArticleCreationModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors"
                      >
                        <FaPlus className="mr-2" />
                        Publish Your First Article
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-medium text-charcoal mb-4">
                        Your Published Articles
                      </h4>
                      <div className="space-y-4">
                        {userArticles.slice(0, 3).map((article) => (
                          <div
                            key={article.id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-mint transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-charcoal mb-1">
                                  {article.title}
                                </h5>
                                <p className="text-sm text-gray-600 mb-2">
                                  Published:{" "}
                                  {article.publishedAt
                                    ?.toDate?.()
                                    ?.toLocaleDateString() || "Unknown date"}
                                </p>
                                <div className="flex items-center text-sm text-gray-500">
                                  <FaEye className="mr-1" />
                                  <span>{article.viewCount} views</span>
                                  {article.isMonetized && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <span>
                                        {article.purchaseCount} purchases
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <Link
                                to={`/articles/${article.id}`}
                                className="ml-4 text-mint hover:text-purple transition-colors"
                              >
                                <FaEye />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                      {userArticles.length > 3 && (
                        <div className="mt-4 text-center">
                          <Link
                            to="/articles"
                            className="text-sm text-mint hover:text-purple transition-colors"
                          >
                            View all {userArticles.length} articles →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Conferences You've Created Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-charcoal">
                Conferences You've Created
              </h2>
            </div>

            {organizerLoading ? (
              <div className="p-6 text-center">
                <div className="inline-block w-8 h-8 border-4 border-t-mint border-gray-200 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">
                  Loading your created conferences...
                </p>
              </div>
            ) : organizerError ? (
              <div className="p-6 text-center">
                <div className="text-red-500 text-3xl mb-2">⚠️</div>
                <p className="text-gray-600 mb-2">{organizerError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-mint hover:underline"
                >
                  Try Again
                </button>
              </div>
            ) : organizedConferences.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-gray-400 text-3xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-charcoal mb-2">
                  No Conferences Created Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  You haven't created any conferences yet. Create one to share
                  your knowledge!
                </p>
                <Link
                  to="/conferences/create"
                  className="inline-flex items-center bg-mint text-white px-4 py-2 rounded-full hover:bg-purple transition-colors"
                >
                  <MdAddCircle className="mr-1" size={18} /> Create New
                  Conference
                </Link>
              </div>
            ) : (
              <div>
                {/* Live Conferences - Organizer */}
                {liveOrganized.length > 0 && (
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-medium text-charcoal mb-4 flex items-center">
                      <FaClock className="text-red-500 mr-2" />
                      Live Now
                    </h3>
                    <div className="space-y-4">
                      {liveOrganized.map((conference) => (
                        <div
                          key={conference.id}
                          className="border border-red-200 rounded-lg p-4 bg-red-50"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="mb-3 md:mb-0">
                              <div className="flex items-center">
                                <h4 className="font-medium text-charcoal">
                                  {conference.title}
                                </h4>
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  <span className="animate-pulse mr-1 h-2 w-2 bg-red-600 rounded-full"></span>
                                  LIVE
                                </span>
                              </div>
                              {conference.startTime && (
                                <p className="text-sm text-gray-600">
                                  Started:{" "}
                                  {new Date(
                                    conference.startTime.seconds * 1000
                                  ).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Link
                                to={`/conferences/${conference.id}`}
                                className="inline-flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
                              >
                                View Details
                              </Link>
                              <Link
                                to={`/conferences/${conference.id}/registrants`}
                                className="inline-flex items-center px-3 py-1.5 bg-mint text-white rounded-md text-sm hover:bg-purple transition-colors"
                              >
                                <span className="mr-1">👥</span> Manage
                                Registrants
                              </Link>
                              <button
                                onClick={() =>
                                  showEndConfirmation(conference.id)
                                }
                                disabled={actionInProgress === conference.id}
                                className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                <FaStop className="mr-1" />
                                {actionInProgress === conference.id
                                  ? "Ending..."
                                  : "End Now"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Conferences - Organizer */}
                {upcomingOrganized.length > 0 && (
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-medium text-charcoal mb-4 flex items-center">
                      <FaCalendarAlt className="text-mint mr-2" />
                      Upcoming Conferences
                    </h3>
                    <div className="space-y-4">
                      {upcomingOrganized.map((conference) => (
                        <div
                          key={conference.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-mint transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="mb-3 md:mb-0">
                              <h4 className="font-medium text-charcoal">
                                {conference.title}
                              </h4>
                              {conference.startTime && (
                                <p className="text-sm text-gray-600">
                                  Scheduled:{" "}
                                  {new Date(
                                    conference.startTime.seconds * 1000
                                  ).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Link
                                to={`/conferences/${conference.id}`}
                                className="inline-flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
                              >
                                View Details
                              </Link>
                              <Link
                                to={`/conferences/${conference.id}/registrants`}
                                className="inline-flex items-center px-3 py-1.5 bg-mint text-white rounded-md text-sm hover:bg-purple transition-colors"
                              >
                                <span className="mr-1">👥</span> Manage
                                Registrants
                              </Link>
                              <button
                                onClick={() =>
                                  showStartConfirmation(conference.id)
                                }
                                disabled={actionInProgress === conference.id}
                                className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                <FaPlay className="mr-1" />
                                {actionInProgress === conference.id
                                  ? "Starting..."
                                  : "Start Now"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Conferences - Organizer */}
                {pastOrganized.length > 0 && (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-charcoal mb-4 flex items-center">
                      <FaHistory className="text-gray-500 mr-2" />
                      Past Conferences
                    </h3>
                    <div className="space-y-4">
                      {pastOrganized.map((conference) => (
                        <div
                          key={conference.id}
                          className="border border-gray-200 rounded-lg p-4 opacity-75 hover:opacity-100 transition-opacity"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="mb-3 md:mb-0">
                              <h4 className="font-medium text-charcoal">
                                {conference.title}
                              </h4>
                              {conference.startTime && (
                                <p className="text-sm text-gray-600">
                                  Held on:{" "}
                                  {new Date(
                                    conference.startTime.seconds * 1000
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Link
                                to={`/conferences/${conference.id}`}
                                className="inline-flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
                              >
                                View Recording
                              </Link>
                              <Link
                                to={`/conferences/${conference.id}/registrants`}
                                className="inline-flex items-center px-3 py-1.5 bg-mint text-white rounded-md text-sm hover:bg-purple transition-colors"
                              >
                                <span className="mr-1">👥</span> Manage
                                Registrants
                              </Link>
                              <button
                                onClick={() => {
                                  // First check how many certificates are already issued
                                  // getConferenceCertificates(conference.id) // This function does not exist
                                  //   .then((certificates) => {
                                  //     // If some certificates already exist, show info
                                  //     if (certificates.length > 0) {
                                  //       showNotification(
                                  //         "info",
                                  //         `${certificates.length} certificates have already been issued. You can manage them on the registrants page.`
                                  //       );
                                  //     }

                                  //     // Navigate to the registrants page to manage certificates
                                  //     navigate(
                                  //       `/conferences/${conference.id}/registrants`
                                  //     );
                                  //   })
                                  //   .catch((error) => {
                                  //     console.error(
                                  //       "Error checking certificates:",
                                  //       error
                                  //     );
                                  //     // Still navigate to registrants page even if there's an error
                                  //     navigate(
                                  //       `/conferences/${conference.id}/registrants`
                                  //     );
                                  //   });
                                  // This part of the logic was removed as getConferenceCertificates is not defined
                                  navigate(
                                    `/conferences/${conference.id}/registrants`
                                  );
                                }}
                                className="inline-flex items-center px-3 py-1.5 bg-purple text-white rounded-md text-sm hover:bg-purple/80 transition-colors"
                              >
                                <FaCheckCircle className="mr-1" size={14} />{" "}
                                Issue Certificates
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Your Registrations Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-charcoal">
                Your Conference Registrations
              </h2>
            </div>

            {loading ? (
              <div className="p-6 text-center">
                <div className="inline-block w-8 h-8 border-4 border-t-mint border-gray-200 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">Loading your registrations...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <div className="text-red-500 text-3xl mb-2">⚠️</div>
                <p className="text-gray-600 mb-2">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-mint hover:underline"
                >
                  Try Again
                </button>
              </div>
            ) : registrations.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-gray-400 text-3xl mb-4">📅</div>
                <h3 className="text-lg font-medium text-charcoal mb-2">
                  No Registrations Found
                </h3>
                <p className="text-gray-600 mb-4">
                  You haven't registered for any conferences yet.
                </p>
                <Link
                  to="/conferences"
                  className="inline-block bg-mint text-white px-4 py-2 rounded-full hover:bg-purple transition-colors"
                >
                  Browse Available Conferences
                </Link>
              </div>
            ) : (
              <div>
                {/* Upcoming Conferences */}
                {upcomingRegistrations.length > 0 && (
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-medium text-charcoal mb-4 flex items-center">
                      <FaCalendarAlt className="text-mint mr-2" />
                      Upcoming Conferences
                    </h3>
                    <div className="space-y-4">
                      {upcomingRegistrations.map((registration) => (
                        <div
                          key={registration.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-mint transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="mb-3 md:mb-0">
                              <h4 className="font-medium text-charcoal">
                                {registration.conference?.title || "Conference"}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {registration.conference?.startTime && (
                                  <>
                                    {new Date(
                                      registration.conference.startTime
                                        .seconds * 1000
                                    ).toLocaleDateString(undefined, {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </>
                                )}
                              </p>
                              {registration.conference?.venue && (
                                <p className="text-sm text-gray-500 flex items-center">
                                  <FaMapMarkerAlt className="mr-1" size={12} />
                                  {registration.conference.venue}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <FaCheckCircle className="mr-1" /> Registered
                              </span>
                              <Link
                                to={`/conferences/${registration.conferenceId}`}
                                className="inline-flex items-center px-3 py-1 bg-mint text-white rounded-md text-sm hover:bg-purple transition-colors"
                              >
                                View Details
                              </Link>
                              <button
                                onClick={() => showQRCode(registration)}
                                className="inline-flex items-center px-3 py-1 bg-purple text-white rounded-md text-sm hover:bg-purple/80 transition-colors"
                              >
                                <FaQrcode className="mr-1" size={14} /> QR Code
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Conferences */}
                {liveRegistrations.length > 0 && (
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-medium text-charcoal mb-4 flex items-center">
                      <FaClock className="text-red-500 mr-2" />
                      Live Now
                    </h3>
                    <div className="space-y-4">
                      {liveRegistrations.map((registration) => (
                        <div
                          key={registration.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-mint transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="mb-3 md:mb-0">
                              <h4 className="font-medium text-charcoal">
                                {registration.conference?.title || "Conference"}
                              </h4>
                              <div className="flex items-center text-sm text-red-500 mt-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                                Live Now
                              </div>
                              {registration.conference?.venue && (
                                <p className="text-sm text-gray-500 flex items-center">
                                  <FaMapMarkerAlt className="mr-1" size={12} />
                                  {registration.conference.venue}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                to={`/conferences/${registration.conferenceId}`}
                                className="inline-flex items-center px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                              >
                                Join Now
                              </Link>
                              <button
                                onClick={() => showQRCode(registration)}
                                className="inline-flex items-center px-3 py-1 bg-purple text-white rounded-md text-sm hover:bg-purple/80 transition-colors"
                              >
                                <FaQrcode className="mr-1" size={14} /> QR Code
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Conferences */}
                {pastRegistrations.length > 0 && (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-charcoal mb-4 flex items-center">
                      <FaHistory className="text-gray-500 mr-2" />
                      Past Conferences
                    </h3>
                    <div className="space-y-4">
                      {pastRegistrations.map((registration) => (
                        <div
                          key={registration.id}
                          className="border border-gray-200 rounded-lg p-4 opacity-75 hover:opacity-100 transition-opacity"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="mb-3 md:mb-0">
                              <h4 className="font-medium text-charcoal">
                                {registration.conference?.title || "Conference"}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {registration.conference?.startTime && (
                                  <>
                                    {new Date(
                                      registration.conference.startTime
                                        .seconds * 1000
                                    ).toLocaleDateString(undefined, {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Completed
                              </span>
                              <Link
                                to={`/conferences/${registration.conferenceId}`}
                                className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
                              >
                                View Recording
                              </Link>
                            </div>
                          </div>
                          {registration.attendanceConfirmed && (
                            <div className="mt-2 text-xs text-green-600 flex items-center">
                              <FaCheckCircle className="mr-1" />
                              Attendance confirmed
                            </div>
                          )}
                          {registration.certificateIssued &&
                            registration.certificateId && (
                              <Link
                                to={`/certificates/view/${registration.certificateId}`}
                                className="mt-2 text-sm text-purple-600 flex items-center font-medium hover:text-purple-800"
                              >
                                <FaGraduationCap className="mr-1" size={16} />
                                View Certificate
                              </Link>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Find More Conferences */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 text-center">
            <h3 className="text-lg font-medium text-charcoal mb-2">
              Discover More Conferences
            </h3>
            <p className="text-gray-600 mb-4">
              Explore upcoming microbiology conferences and secure your spot
            </p>
            <Link
              to="/conferences"
              className="inline-block bg-mint text-white px-4 py-2 rounded-full hover:bg-purple transition-colors"
            >
              Browse Conferences
            </Link>
          </div>

          {/* My Certificates Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mt-8">
            <div className="p-6 border-b border-gray-200 flex items-center">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <FaGraduationCap size={24} className="text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-charcoal">
                My Certificates
              </h2>
            </div>

            {certificatesLoading ? (
              <div className="p-6 text-center">
                <div className="inline-block w-8 h-8 border-4 border-t-purple border-gray-200 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">Loading your certificates...</p>
              </div>
            ) : certificatesError ? (
              <div className="p-6 text-center">
                <div className="text-red-500 text-3xl mb-2">⚠️</div>
                <p className="text-gray-600 mb-2">{certificatesError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-mint hover:underline"
                >
                  Try Again
                </button>
              </div>
            ) : certificates.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-gray-400 text-3xl mb-4">🎓</div>
                <h3 className="text-lg font-medium text-charcoal mb-2">
                  No Certificates Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Attend conferences and get your participation recognized with
                  certificates.
                </p>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certificates.map((certificate) => (
                    <div
                      key={certificate.id}
                      className="border border-gray-200 hover:border-purple rounded-lg p-4 transition-colors"
                    >
                      <div className="flex items-start">
                        <div className="bg-purple-100 p-3 rounded-lg mr-3 flex-shrink-0">
                          <FaGraduationCap
                            size={24}
                            className="text-purple-600"
                          />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium text-charcoal mb-1">
                            {certificate.conferenceName}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            Issued:{" "}
                            {certificate.issueDate?.seconds
                              ? new Date(
                                  certificate.issueDate.seconds * 1000
                                ).toLocaleDateString()
                              : "Unknown date"}
                          </p>
                          <Link
                            to={`/certificates/view/${certificate.id}`}
                            className="inline-flex items-center text-purple-600 hover:text-purple-800"
                          >
                            View Certificate
                            <svg
                              className="w-3 h-3 ml-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Credit balance section */}
          {currentUser && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-charcoal flex items-center">
                  <FiDollarSign className="mr-2 text-mint" /> Credits Balance
                </h2>
                <Link
                  to="/credits"
                  className="text-sm text-mint hover:text-purple transition-colors"
                >
                  Buy Credits
                </Link>
              </div>

              <div className="mt-4">
                {creditsLoading ? (
                  <div className="animate-pulse h-8 bg-gray-200 rounded w-24"></div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="bg-mint/10 rounded-lg px-4 py-3">
                      <div className="text-sm text-gray-600">
                        Current Balance
                      </div>
                      <div className="text-2xl font-bold text-mint">
                        {credits} credits
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        to="/credits"
                        className="px-4 py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors text-sm"
                      >
                        Purchase Credits
                      </Link>
                      <Link
                        to="/credits?tab=history"
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        View History
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-charcoal mb-3">
                  Recent Transactions
                </h3>
                <CreditHistoryTable limit={5} showAllLink={true} />
              </div>
            </div>
          )}

          {/* Modals */}
          <AuthorApplicationModal
            isOpen={authorApplicationModalOpen}
            onClose={() => setAuthorApplicationModalOpen(false)}
            onSuccess={() => {
              showNotification(
                "success",
                "Author application submitted successfully!"
              );
              setAuthorApplicationModalOpen(false);
              // Refresh articles data without page reload
              fetchArticlesData();
            }}
          />

          <ArticleCreationModal
            isOpen={articleCreationModalOpen}
            onClose={() => setArticleCreationModalOpen(false)}
            onSuccess={() => {
              showNotification("success", "Article published successfully!");
              setArticleCreationModalOpen(false);
              // Refresh articles data without page reload
              fetchArticlesData();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
