import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getConference,
  Conference,
  ConferenceRegistration,
  getConferenceRegistrations,
  updateRegistrationAttendance,
} from "../../utils/firebase";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaUserCheck,
  FaTimes,
} from "react-icons/fa";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";
import Notification from "../../components/ui/Notification";

const RegistrationVerificationPage: React.FC = () => {
  const { conferenceId, registrationId } = useParams<{
    conferenceId: string;
    registrationId: string;
  }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [conference, setConference] = useState<Conference | null>(null);
  const [registration, setRegistration] =
    useState<ConferenceRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);

  // Notification state
  const [notification, setNotification] = useState({
    type: "success" as "success" | "error" | "info",
    message: "",
    isVisible: false,
  });

  useEffect(() => {
    const loadData = async () => {
      if (!conferenceId || !registrationId) {
        setError("Missing conference or registration ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get conference details
        const conferenceData = await getConference(conferenceId);
        if (!conferenceData) {
          setError("Conference not found");
          setLoading(false);
          return;
        }
        setConference(conferenceData);

        // Check if current user is the organizer
        if (currentUser && conferenceData.organizerId === currentUser.uid) {
          setIsOrganizer(true);
        }

        // Get registration details - this works for both public verification and organizer view
        const registrations = await getConferenceRegistrations(conferenceId);
        const foundRegistration = registrations.find(
          (reg) => reg.id === registrationId
        );

        if (!foundRegistration) {
          setError("Registration not found");
          setLoading(false);
          return;
        }

        setRegistration(foundRegistration);
        setLoading(false);
      } catch (err) {
        console.error("Error loading verification data:", err);
        setError("Failed to load verification data");
        setLoading(false);
      }
    };

    loadData();
  }, [conferenceId, registrationId, currentUser]);

  // Show notification helper
  const showNotification = (
    type: "success" | "error" | "info",
    message: string
  ) => {
    setNotification({
      type,
      message,
      isVisible: true,
    });

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification((prev) => ({
        ...prev,
        isVisible: false,
      }));
    }, 3000);
  };

  // Mark attendance (for organizers only)
  const handleMarkAttendance = async () => {
    if (!isOrganizer || !registration) return;

    try {
      const newStatus = !registration.attendanceConfirmed;
      const success = await updateRegistrationAttendance(
        registration.id,
        newStatus
      );

      if (success) {
        showNotification(
          "success",
          `Attendance ${newStatus ? "confirmed" : "unconfirmed"} successfully`
        );
        setRegistration({
          ...registration,
          attendanceConfirmed: newStatus,
        });
      } else {
        showNotification("error", "Failed to update attendance status");
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
      showNotification("error", "An error occurred while updating attendance");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onAuthModalOpen={() => {}} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mint"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onAuthModalOpen={() => {}} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-red-500 text-xl mb-4">{error}</div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-mint hover:text-purple"
            >
              <FaArrowLeft className="mr-2" /> Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAuthModalOpen={() => {}} />
      {notification.isVisible && (
        <Notification
          isVisible={notification.isVisible}
          type={notification.type}
          message={notification.message}
          onClose={() =>
            setNotification((prev) => ({ ...prev, isVisible: false }))
          }
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-mint hover:text-purple"
          >
            <FaArrowLeft className="mr-2" /> Go Back
          </button>
        </div>

        {registration && conference && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-mint text-white p-6">
              <h1 className="text-2xl font-bold mb-2">
                Registration Verification
              </h1>
              <h2 className="text-xl">{conference.title}</h2>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-charcoal mb-4">
                    Attendee Information
                  </h3>
                </div>

                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center">
                  <FaCheckCircle className="mr-2" />
                  <span>Verified Registration</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">
                      Full Name
                    </h4>
                    <p className="text-lg font-medium">
                      {registration.fullName}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                    <p>{registration.email}</p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">
                      Institution
                    </h4>
                    <p>{registration.institution}</p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">
                      Phone Number
                    </h4>
                    <p>{registration.phoneNumber}</p>
                  </div>
                </div>

                <div>
                  {registration.matricNumber && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500">
                        Matric Number
                      </h4>
                      <p>{registration.matricNumber}</p>
                    </div>
                  )}

                  {registration.level && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500">
                        Level
                      </h4>
                      <p>{registration.level}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">
                      State of Origin
                    </h4>
                    <p>{registration.stateOfOrigin}</p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">
                      Employment Status
                    </h4>
                    <p>{registration.employmentStatus}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500">Skills</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {registration.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center mt-6">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${
                      registration.attendanceConfirmed
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  ></div>
                  <span
                    className={
                      registration.attendanceConfirmed
                        ? "text-green-600 font-medium"
                        : "text-gray-500"
                    }
                  >
                    {registration.attendanceConfirmed
                      ? "Attendance Confirmed"
                      : "Attendance Not Confirmed"}
                  </span>
                </div>

                {isOrganizer && (
                  <div className="mt-6">
                    <button
                      onClick={handleMarkAttendance}
                      className={`px-4 py-2 rounded-lg flex items-center ${
                        registration.attendanceConfirmed
                          ? "bg-red-100 text-red-600 hover:bg-red-200"
                          : "bg-mint text-white hover:bg-purple"
                      }`}
                    >
                      {registration.attendanceConfirmed ? (
                        <>
                          <FaTimes className="mr-2" /> Unmark Attendance
                        </>
                      ) : (
                        <>
                          <FaUserCheck className="mr-2" /> Mark as Attended
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationVerificationPage;
