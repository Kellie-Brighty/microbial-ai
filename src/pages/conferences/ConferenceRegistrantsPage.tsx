import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getConference,
  getConferenceRegistrations,
  updateRegistrationAttendance,
  updateRegistrationFoodStatus,
  batchIssueCertificates,
  Conference,
  ConferenceRegistration,
} from "../../utils/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  FaArrowLeft,
  FaSearch,
  FaUserCheck,
  FaUtensils,
  FaCheckCircle,
  FaGraduationCap,
  FaTimes,
  FaQrcode,
} from "react-icons/fa";
import Header from "../../components/Header";
import { CommunityThemeProvider } from "../../context/CommunityThemeContext";
import Notification from "../../components/ui/Notification";
import { QRCodeSVG } from "qrcode.react";

// Add QR Code modal component
interface RegistrantQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: ConferenceRegistration | null;
  conference: Conference | null;
}

const RegistrantQRModal = ({
  isOpen,
  onClose,
  registration,
  conference,
}: RegistrantQRModalProps) => {
  if (!isOpen || !registration || !conference) return null;

  // Generate a registration verification URL
  const baseUrl = window.location.origin;
  const verificationUrl = `${baseUrl}/verify-registration/${conference.id}/${registration.id}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-charcoal mb-2">
          Registration QR Code
        </h3>
        <p className="text-gray-600 mb-4">
          Scan this QR code to verify registration for "{registration.fullName}
          ".
        </p>

        <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col items-center">
          <div className="p-2 bg-white rounded-lg shadow-md mb-4">
            <QRCodeSVG
              value={verificationUrl}
              size={200}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          <div className="text-center">
            <h4 className="font-bold text-charcoal">{conference.title}</h4>
            <p className="text-sm text-gray-600">{registration.fullName}</p>
            <p className="text-xs text-gray-500 mt-1">{registration.email}</p>
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

// Main component content
const ConferenceRegistrantsPageContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [conference, setConference] = useState<Conference | null>(null);
  const [registrations, setRegistrations] = useState<ConferenceRegistration[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [notification, setNotification] = useState({
    type: "success" as "success" | "error" | "info",
    message: "",
    isVisible: false,
  });

  // State for manual certificate selection
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [selectedRegistrants, setSelectedRegistrants] = useState<string[]>([]);
  const [issuingCertificates, setIssuingCertificates] = useState(false);

  // Add these new states
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedRegistrant, setSelectedRegistrant] =
    useState<ConferenceRegistration | null>(null);

  // Load conference data and check authorization
  useEffect(() => {
    const loadConferenceData = async () => {
      if (!id || !currentUser) {
        setError("Missing conference ID or user not logged in");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const conferenceData = await getConference(id);

        if (!conferenceData) {
          setError("Conference not found");
          setLoading(false);
          return;
        }

        setConference(conferenceData);

        // Check if current user is the creator
        if (conferenceData.organizerId !== currentUser.uid) {
          setError("You are not authorized to view this page");
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        setIsAuthorized(true);

        // Load registrations
        const registrationsData = await getConferenceRegistrations(id);
        setRegistrations(registrationsData);
        setLoading(false);
      } catch (err) {
        console.error("Error loading conference data:", err);
        setError("Failed to load conference data");
        setLoading(false);
      }
    };

    loadConferenceData();
  }, [id, currentUser]);

  // Filter registrations based on search term
  const filteredRegistrations = registrations.filter((reg) => {
    const searchString = searchTerm.toLowerCase();
    return (
      reg.fullName.toLowerCase().includes(searchString) ||
      reg.email.toLowerCase().includes(searchString) ||
      reg.institution.toLowerCase().includes(searchString) ||
      reg.phoneNumber.includes(searchString)
    );
  });

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

  // Toggle registrant selection for certificates
  const toggleRegistrantSelection = (registrationId: string) => {
    setSelectedRegistrants((prev) => {
      if (prev.includes(registrationId)) {
        return prev.filter((id) => id !== registrationId);
      } else {
        return [...prev, registrationId];
      }
    });
  };

  // Issue certificates to selected registrants
  const issueSelectedCertificates = async () => {
    if (selectedRegistrants.length === 0) {
      showNotification("error", "Please select at least one attendee");
      return;
    }

    try {
      setIssuingCertificates(true);
      showNotification(
        "info",
        `Issuing certificates for ${selectedRegistrants.length} attendees...`
      );

      // Issue certificates
      const result = await batchIssueCertificates(
        id as string,
        selectedRegistrants,
        {
          issuedBy: currentUser?.displayName || "Conference Organizer",
          issuedById: currentUser?.uid || "",
        }
      );

      if (result.success > 0) {
        showNotification(
          "success",
          `Successfully issued ${result.success} certificates!`
        );

        // Update local state
        setRegistrations((prev) =>
          prev.map((reg) => {
            if (selectedRegistrants.includes(reg.id)) {
              return {
                ...reg,
                certificateIssued: true,
                certificateId: result.certificates.find(
                  (cert) => cert.registrationId === reg.id
                )?.id,
              };
            }
            return reg;
          })
        );

        // Close modal and reset selection
        setIsSelectionModalOpen(false);
        setSelectedRegistrants([]);
      } else {
        showNotification(
          "error",
          "Failed to issue certificates. Please try again."
        );
      }
    } catch (error) {
      console.error("Error issuing certificates:", error);
      showNotification(
        "error",
        "An error occurred while issuing certificates."
      );
    } finally {
      setIssuingCertificates(false);
    }
  };

  // Toggle attendance confirmation status
  const toggleAttendanceStatus = async (registrationId: string) => {
    try {
      // Find the current status
      const registration = registrations.find((r) => r.id === registrationId);
      if (!registration) return;

      const newStatus = !registration.attendanceConfirmed;

      // Update in the database
      const success = await updateRegistrationAttendance(
        registrationId,
        newStatus
      );

      if (success) {
        // Update local state if database update was successful
        const updatedRegistrations = registrations.map((reg) => {
          if (reg.id === registrationId) {
            return {
              ...reg,
              attendanceConfirmed: newStatus,
            };
          }
          return reg;
        });

        setRegistrations(updatedRegistrations);

        // Show success message
        console.log(
          `Updated attendance for ${registration.fullName} to ${
            newStatus ? "Checked In" : "Not Checked In"
          }`
        );

        showNotification(
          "success",
          `Updated attendance for ${registration.fullName} to ${
            newStatus ? "Checked In" : "Not Checked In"
          }`
        );
      }
    } catch (error) {
      console.error("Error toggling attendance status:", error);
      showNotification("error", "Failed to update attendance status");
    }
  };

  // Toggle food distribution status
  const toggleFoodStatus = async (registrationId: string) => {
    try {
      // Find the current status
      const registration = registrations.find((r) => r.id === registrationId);
      if (!registration) return;

      const newStatus = !registration.foodDistributed;

      // Update in the database
      const success = await updateRegistrationFoodStatus(
        registrationId,
        newStatus
      );

      if (success) {
        // Update local state if database update was successful
        const updatedRegistrations = registrations.map((reg) => {
          if (reg.id === registrationId) {
            return {
              ...reg,
              foodDistributed: newStatus,
            };
          }
          return reg;
        });

        setRegistrations(updatedRegistrations);

        // Show success message
        console.log(
          `Updated food status for ${registration.fullName} to ${
            newStatus ? "Food Given" : "No Food Yet"
          }`
        );

        showNotification(
          "success",
          `Updated food status for ${registration.fullName} to ${
            newStatus ? "Food Given" : "No Food Yet"
          }`
        );
      }
    } catch (error) {
      console.error("Error toggling food status:", error);
      showNotification("error", "Failed to update food distribution status");
    }
  };

  // Check if conference has ended
  const isConferenceEnded =
    conference &&
    (conference.status === "ended" ||
      (conference.endTime && conference.endTime.seconds * 1000 < Date.now()));

  // Add this function to open the QR code modal
  const handleShowQRCode = (registration: ConferenceRegistration) => {
    setSelectedRegistrant(registration);
    setIsQRModalOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onAuthModalOpen={() => {}} />
        <div className="container mx-auto px-4 mt-8">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mint"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !conference) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onAuthModalOpen={() => {}} />
        <div className="container mx-auto px-4 mt-8">
          <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-charcoal mb-4">
                {error || "Conference not found"}
              </h1>
              <p className="text-gray-600 mb-6">
                {isAuthorized
                  ? "There was an error loading the registrants data."
                  : "You don't have permission to view this page. Only the conference creator can view and manage registrants."}
              </p>
              <button
                onClick={() => navigate(-1)}
                className="bg-mint text-white px-4 py-2 rounded-full hover:bg-purple transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAuthModalOpen={() => {}} />

      {/* Notification */}
      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />

      {/* Add the QR modal component */}
      <RegistrantQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        registration={selectedRegistrant}
        conference={conference}
      />

      {/* Manual Certificate Selection Modal */}
      {isSelectionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full mx-auto p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-charcoal">
                Select Attendees for Certificates
              </h3>
              <button
                onClick={() => setIsSelectionModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Select attendees who should receive a certificate. Typically,
              these should be attendees who were checked in at the conference.
            </p>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search attendees..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="border rounded-lg divide-y divide-gray-200 mb-6 max-h-[50vh] overflow-y-auto">
              {filteredRegistrations.map((registration) => (
                <div
                  key={registration.id}
                  className={`flex items-center justify-between p-3 hover:bg-gray-50 ${
                    registration.certificateIssued ? "bg-purple-50" : ""
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`select-${registration.id}`}
                      checked={selectedRegistrants.includes(registration.id)}
                      onChange={() =>
                        toggleRegistrantSelection(registration.id)
                      }
                      disabled={registration.certificateIssued}
                      className="h-5 w-5 text-purple accent-purple rounded border-gray-300 focus:ring-purple"
                    />
                    <label
                      htmlFor={`select-${registration.id}`}
                      className="ml-3 block"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {registration.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {registration.email} • {registration.institution}
                      </div>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        registration.attendanceConfirmed
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {registration.attendanceConfirmed
                        ? "Checked In"
                        : "Not Checked In"}
                    </span>
                    {registration.certificateIssued && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Certificate Issued
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {filteredRegistrations.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No registrants found matching your search.
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <div className="text-sm text-gray-600 self-center">
                {selectedRegistrants.length} attendees selected
              </div>
              <button
                onClick={() => setIsSelectionModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={issueSelectedCertificates}
                disabled={
                  selectedRegistrants.length === 0 || issuingCertificates
                }
                className={`px-4 py-2 bg-purple text-white rounded-lg hover:bg-purple/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
              >
                {issuingCertificates ? (
                  <>
                    <span className="mr-2 h-4 w-4 border-2 border-t-white border-white/30 rounded-full animate-spin"></span>
                    Issuing...
                  </>
                ) : (
                  <>
                    <FaGraduationCap className="mr-2" />
                    Issue Certificates
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 mt-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(`/conferences/${id}`)}
            className="flex items-center text-teal-500 hover:text-blue-600 transition-colors"
          >
            <FaArrowLeft className="mr-2" /> Back to Conference
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold text-charcoal mb-2">
            {conference.title} - Registrants
          </h1>
          <div className="text-gray-600 mb-4">
            Manage the list of people registered for your conference
          </div>

          {/* Search and stats */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div className="mb-4 md:mb-0">
              <div className="text-sm text-gray-600 mb-1">
                Total Registrants: {registrations.length}
              </div>
              <div className="flex space-x-4">
                <div className="text-sm text-green-600">
                  <FaUserCheck className="inline mr-1" />
                  Confirmed:{" "}
                  {
                    registrations.filter((r) => r.attendanceConfirmed === true)
                      .length
                  }
                </div>
                <div className="text-sm text-orange-500">
                  <FaUtensils className="inline mr-1" />
                  Fed:{" "}
                  {
                    registrations.filter((r) => r.foodDistributed === true)
                      .length
                  }
                </div>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search registrants..."
                className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-mint"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          {/* Registrants table */}
          <div className="overflow-x-auto">
            {registrations.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-4xl mb-3">🤷‍♂️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No registrants yet
                </h3>
                <p className="text-gray-600">
                  No one has registered for this conference yet. Check back
                  later.
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Contact
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Institution
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Location
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRegistrations.map((registration) => (
                    <tr key={registration.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {registration.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {registration.age} years old
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {registration.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {registration.phoneNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {registration.institution}
                        </div>
                        <div className="text-sm text-gray-500">
                          {registration.employmentStatus}
                          {registration.level ? ` • ${registration.level}` : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {registration.stateOfOrigin}
                        </div>
                        <div className="text-sm text-gray-500">
                          {registration.lgaOfOrigin}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              registration.attendanceConfirmed
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {registration.attendanceConfirmed
                              ? "Checked In"
                              : "Not Checked In"}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              registration.foodDistributed
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {registration.foodDistributed
                              ? "Food Given"
                              : "No Food Yet"}
                          </span>
                          {isConferenceEnded && (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                registration.certificateIssued
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {registration.certificateIssued
                                ? "Certificate Issued"
                                : "No Certificate"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="mt-2 flex items-center space-x-2">
                          <button
                            onClick={() =>
                              toggleAttendanceStatus(registration.id)
                            }
                            className={`px-2 py-1 rounded text-xs flex items-center ${
                              registration.attendanceConfirmed
                                ? "bg-red-100 text-red-600 hover:bg-red-200"
                                : "bg-mint text-white hover:bg-purple"
                            }`}
                          >
                            {registration.attendanceConfirmed ? (
                              <>
                                <FaTimes className="mr-1" /> Unmark
                              </>
                            ) : (
                              <>
                                <FaUserCheck className="mr-1" /> Attended
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => toggleFoodStatus(registration.id)}
                            className={`px-2 py-1 rounded text-xs flex items-center ${
                              registration.foodDistributed
                                ? "bg-red-100 text-red-600 hover:bg-red-200"
                                : "bg-orange-100 text-orange-600 hover:bg-orange-200"
                            }`}
                          >
                            {registration.foodDistributed ? (
                              <>
                                <FaTimes className="mr-1" /> Unmark
                              </>
                            ) : (
                              <>
                                <FaUtensils className="mr-1" /> Food
                              </>
                            )}
                          </button>
                          {isConferenceEnded &&
                            registration.certificateIssued &&
                            registration.certificateId && (
                              <a
                                href={`/certificates/view/${registration.certificateId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center"
                                title="View Certificate"
                              >
                                <FaGraduationCap size={16} className="mr-1" />{" "}
                                Certificate
                              </a>
                            )}
                          <button
                            onClick={() => handleShowQRCode(registration)}
                            className="px-2 py-1 rounded text-xs flex items-center bg-blue-100 text-blue-600 hover:bg-blue-200"
                          >
                            <FaQrcode className="mr-1" /> QR Code
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Additional Management Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-charcoal mb-4">
            Export Options
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                // In a real app, this would generate and download a CSV
                alert("This feature would export a CSV in a real application");
              }}
              className="bg-mint text-white px-4 py-2 rounded-lg hover:bg-purple transition-colors"
            >
              Export to CSV
            </button>
            <button
              onClick={() => {
                // In a real app, this would generate and download a PDF
                alert("This feature would export a PDF in a real application");
              }}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Export to PDF
            </button>
            <button
              onClick={() => {
                window.print();
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Print List
            </button>
          </div>

          {/* Certificate Issuance - Only for ended conferences */}
          {isConferenceEnded && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-charcoal mb-3 flex items-center">
                <FaCheckCircle className="text-purple mr-2" />
                Certificate Management
              </h3>
              <p className="text-gray-600 mb-4">
                The conference has ended. You can now issue certificates to
                attendees who participated.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => {
                    // This would issue certificates to all checked-in attendees
                    const checkedInCount = registrations.filter(
                      (r) => r.attendanceConfirmed
                    ).length;
                    if (checkedInCount === 0) {
                      showNotification(
                        "error",
                        "No checked-in attendees found. Mark attendees as checked in first."
                      );
                    } else {
                      // Get the IDs of all checked-in registrations
                      const checkedInIds = registrations
                        .filter(
                          (r) => r.attendanceConfirmed && !r.certificateIssued
                        )
                        .map((r) => r.id);

                      if (checkedInIds.length === 0) {
                        showNotification(
                          "info",
                          "All checked-in attendees already have certificates issued."
                        );
                        return;
                      }

                      // Show loading notification
                      showNotification(
                        "info",
                        `Issuing certificates for ${checkedInIds.length} attendees...`
                      );

                      // Issue certificates
                      batchIssueCertificates(id as string, checkedInIds, {
                        issuedBy:
                          currentUser?.displayName || "Conference Organizer",
                        issuedById: currentUser?.uid || "",
                      })
                        .then((result) => {
                          if (result.success > 0) {
                            showNotification(
                              "success",
                              `Successfully issued ${result.success} certificates!`
                            );

                            // Update local state to reflect certificates being issued
                            setRegistrations((prev) =>
                              prev.map((reg) => {
                                const certificateIssued = checkedInIds.includes(
                                  reg.id
                                );
                                return certificateIssued
                                  ? { ...reg, certificateIssued: true }
                                  : reg;
                              })
                            );
                          } else {
                            showNotification(
                              "error",
                              "Failed to issue any certificates. Please try again."
                            );
                          }
                        })
                        .catch((error) => {
                          console.error("Error issuing certificates:", error);
                          showNotification(
                            "error",
                            "An error occurred while issuing certificates."
                          );
                        });
                    }
                  }}
                  className="bg-purple text-white px-4 py-2 rounded-lg hover:bg-purple/80 transition-colors"
                >
                  Issue Certificates to All Attendees
                </button>
                <button
                  onClick={() => {
                    setIsSelectionModalOpen(true);
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Select Attendees Manually
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Wrap with CommunityThemeProvider
const ConferenceRegistrantsPage: React.FC = () => {
  return (
    <CommunityThemeProvider>
      <ConferenceRegistrantsPageContent />
    </CommunityThemeProvider>
  );
};

export default ConferenceRegistrantsPage;
