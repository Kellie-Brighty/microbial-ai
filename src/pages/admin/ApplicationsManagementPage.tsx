import React, { useState, useEffect } from "react";
import {
  updateVendorVerificationStatus,
  updateExpertVerificationStatus,
  VendorProfile,
  ExpertProfile,
  getVendorProfilesByStatus,
  getExpertProfilesByStatus,
  getAuthorApplicationsByStatus,
  updateAuthorApplicationStatus,
  AuthorApplication,
} from "../../utils/firebase";
import { Timestamp } from "firebase/firestore";
import {
  FaStore,
  FaUserMd,
  FaEye,
  FaPen,
} from "react-icons/fa";
import { format } from "date-fns";

type ApplicationType = "vendor" | "expert" | "author";

interface Application {
  id: string;
  type: ApplicationType;
  name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  data: VendorProfile | ExpertProfile | AuthorApplication;
}

const ApplicationsManagementPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected"
  >("pending");
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    loadApplications();
  }, [activeTab]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const applications: Application[] = [];

      // Load vendor applications using the new function
      const vendors = await getVendorProfilesByStatus(activeTab);
      vendors.forEach((vendor) => {
        applications.push({
          id: vendor.userId,
          type: "vendor",
          name: vendor.businessName || "Unknown Business",
          email: vendor.contactEmail || "No email provided",
          status: vendor.verificationStatus,
          createdAt:
            vendor.createdAt instanceof Timestamp
              ? vendor.createdAt.toDate()
              : new Date(),
          data: vendor,
        });
      });

      // Load expert applications using the new function
      const experts = await getExpertProfilesByStatus(activeTab);
      experts.forEach((expert) => {
        applications.push({
          id: expert.userId,
          type: "expert",
          name: expert.contactEmail.split("@")[0] || "Unknown Expert", // Use part of email as name
          email: expert.contactEmail || "No email provided",
          status: expert.verificationStatus,
          createdAt:
            expert.createdAt instanceof Timestamp
              ? expert.createdAt.toDate()
              : new Date(),
          data: expert,
        });
      });

      // Load author applications using the new function
      const authors = await getAuthorApplicationsByStatus(activeTab);
      authors.forEach((author) => {
        applications.push({
          id: author.userId,
          type: "author",
          name: author.name || "Unknown Author",
          email: author.email || "No email provided",
          status: author.verificationStatus,
          createdAt:
            author.createdAt instanceof Timestamp
              ? author.createdAt.toDate()
              : new Date(),
          data: author,
        });
      });

      // Sort by creation date, newest first
      applications.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      setApplications(applications);
    } catch (error) {
      console.error("Error loading applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const handleApproveApplication = async (application: Application) => {
    setProcessingAction(true);
    try {
      if (application.type === "vendor") {
        await updateVendorVerificationStatus(application.id, "approved");
      } else if (application.type === "expert") {
        await updateExpertVerificationStatus(application.id, "approved");
      } else if (application.type === "author") {
        await updateAuthorApplicationStatus(application.id, "approved");
      }

      // Refresh the list
      await loadApplications();

      // Close modal if open
      setShowDetailsModal(false);
    } catch (error) {
      console.error("Error approving application:", error);
      alert("Failed to approve application. Please try again.");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectClick = (application: Application) => {
    setSelectedApplication(application);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  const handleRejectApplication = async () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    setProcessingAction(true);
    try {
      if (selectedApplication.type === "vendor") {
        await updateVendorVerificationStatus(
          selectedApplication.id,
          "rejected",
          rejectionReason
        );
      } else if (selectedApplication.type === "expert") {
        await updateExpertVerificationStatus(
          selectedApplication.id,
          "rejected",
          rejectionReason
        );
      } else if (selectedApplication.type === "author") {
        await updateAuthorApplicationStatus(
          selectedApplication.id,
          "rejected",
          rejectionReason
        );
      }

      // Refresh the list
      await loadApplications();

      // Close modals
      setShowRejectionModal(false);
      setShowDetailsModal(false);
    } catch (error) {
      console.error("Error rejecting application:", error);
      alert("Failed to reject application. Please try again.");
    } finally {
      setProcessingAction(false);
    }
  };

  const renderVendorDetails = (vendor: VendorProfile) => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-700">
          Business Information
        </h3>
        <div className="mt-2 grid grid-cols-1 gap-2">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Business Name</p>
            <p className="text-gray-800">{vendor.businessName}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Description</p>
            <p className="text-gray-800">{vendor.businessDescription}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Address</p>
            <p className="text-gray-800">{vendor.address}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700">
          Contact Information
        </h3>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-gray-800">{vendor.contactEmail}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Phone</p>
            <p className="text-gray-800">{vendor.contactPhone}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700">
          Product Categories
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {vendor.categories &&
            vendor.categories.map((category, index) => (
              <span
                key={index}
                className="bg-mint/10 text-mint px-3 py-1 rounded-full text-sm"
              >
                {category}
              </span>
            ))}
        </div>
      </div>

      {vendor.verificationDocuments &&
        vendor.verificationDocuments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700">
              Verification Documents
            </h3>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              {vendor.verificationDocuments.map((doc, index) => (
                <a
                  key={index}
                  href={doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-50 p-3 rounded-lg flex items-center hover:bg-gray-100 transition-colors"
                >
                  <div className="bg-mint/10 rounded-full p-2 mr-3">
                    <FaEye className="text-mint" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Document {index + 1}
                    </p>
                    <p className="text-xs text-gray-500">Click to view</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      {vendor.adminNotes && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">Previous Admin Notes: </span>
                {vendor.adminNotes}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderExpertDetails = (expert: ExpertProfile) => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-700">
          Professional Information
        </h3>
        <div className="mt-2 grid grid-cols-1 gap-2">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Bio</p>
            <p className="text-gray-800">{expert.bio}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Experience</p>
            <p className="text-gray-800">{expert.experience}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700">
          Contact Information
        </h3>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-gray-800">{expert.contactEmail}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Phone</p>
            <p className="text-gray-800">{expert.contactPhone}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700">Specializations</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {expert.specializations &&
            expert.specializations.map((specialization, index) => (
              <span
                key={index}
                className="bg-purple/10 text-purple px-3 py-1 rounded-full text-sm"
              >
                {specialization}
              </span>
            ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700">Qualifications</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {expert.qualifications &&
            expert.qualifications.map((qualification, index) => (
              <span
                key={index}
                className="bg-purple/10 text-purple px-3 py-1 rounded-full text-sm"
              >
                {qualification}
              </span>
            ))}
        </div>
      </div>

      {expert.verificationDocuments &&
        expert.verificationDocuments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700">
              Verification Documents
            </h3>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              {expert.verificationDocuments.map((doc, index) => (
                <a
                  key={index}
                  href={doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-50 p-3 rounded-lg flex items-center hover:bg-gray-100 transition-colors"
                >
                  <div className="bg-purple/10 rounded-full p-2 mr-3">
                    <FaEye className="text-purple" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Document {index + 1}
                    </p>
                    <p className="text-xs text-gray-500">Click to view</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      {expert.adminNotes && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">Previous Admin Notes: </span>
                {expert.adminNotes}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAuthorDetails = (author: AuthorApplication) => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-700">
          Author Information
        </h3>
        <div className="mt-2 grid grid-cols-1 gap-2">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Name</p>
            <p className="text-gray-800">{author.name}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-gray-800">{author.email}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">
              Credentials & Experience
            </p>
            <p className="text-gray-800">{author.credentials}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">
              Areas of Expertise
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {author.expertiseAreas &&
                author.expertiseAreas.map((area, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                  >
                    {area}
                  </span>
                ))}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Sample Writing</p>
            <p className="text-gray-800 whitespace-pre-wrap">
              {author.sampleWriting}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Motivation</p>
            <p className="text-gray-800 whitespace-pre-wrap">
              {author.motivation}
            </p>
          </div>
        </div>
      </div>

      {author.verificationDocuments &&
        author.verificationDocuments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700">
              Verification Documents
            </h3>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              {author.verificationDocuments.map((doc, index) => (
                <a
                  key={index}
                  href={doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-50 p-3 rounded-lg flex items-center hover:bg-gray-100 transition-colors"
                >
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <FaEye className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Document {index + 1}
                    </p>
                    <p className="text-xs text-gray-500">Click to view</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      {author.adminNotes && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">Previous Admin Notes: </span>
                {author.adminNotes}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Applications Management
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-3 px-6 ${
            activeTab === "pending"
              ? "border-b-2 border-purple text-purple font-medium"
              : "text-gray-500 hover:text-purple"
          }`}
          onClick={() => setActiveTab("pending")}
        >
          Pending
        </button>
        <button
          className={`py-3 px-6 ${
            activeTab === "approved"
              ? "border-b-2 border-mint text-mint font-medium"
              : "text-gray-500 hover:text-mint"
          }`}
          onClick={() => setActiveTab("approved")}
        >
          Approved
        </button>
        <button
          className={`py-3 px-6 ${
            activeTab === "rejected"
              ? "border-b-2 border-red-500 text-red-500 font-medium"
              : "text-gray-500 hover:text-red-500"
          }`}
          onClick={() => setActiveTab("rejected")}
        >
          Rejected
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No {activeTab} applications found</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Applied
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application) => (
                <tr
                  key={`${application.type}-${application.id}`}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`rounded-full p-2 ${
                          application.type === "vendor"
                            ? "bg-mint/10"
                            : application.type === "expert"
                            ? "bg-purple/10"
                            : "bg-blue/10"
                        }`}
                      >
                        {application.type === "vendor" ? (
                          <FaStore className="text-mint" />
                        ) : application.type === "expert" ? (
                          <FaUserMd className="text-purple" />
                        ) : (
                          <FaPen className="text-blue" />
                        )}
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                        {application.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {application.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(application.createdAt, "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(application)}
                      className="text-purple hover:text-purple-700 mr-4"
                    >
                      View Details
                    </button>

                    {activeTab === "pending" && (
                      <>
                        <button
                          onClick={() => handleApproveApplication(application)}
                          className="text-mint hover:text-green-700 mr-4"
                          disabled={processingAction}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectClick(application)}
                          className="text-red-500 hover:text-red-700"
                          disabled={processingAction}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                {selectedApplication.type === "vendor" ? (
                  <>
                    <FaStore className="text-mint mr-2" />
                    Vendor Application
                  </>
                ) : selectedApplication.type === "expert" ? (
                  <>
                    <FaUserMd className="text-purple mr-2" />
                    Expert Application
                  </>
                ) : (
                  <>
                    <FaPen className="text-blue mr-2" />
                    Author Application
                  </>
                )}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 130px)" }}
            >
              {selectedApplication.type === "vendor"
                ? renderVendorDetails(selectedApplication.data as VendorProfile)
                : selectedApplication.type === "expert"
                ? renderExpertDetails(selectedApplication.data as ExpertProfile)
                : renderAuthorDetails(
                    selectedApplication.data as AuthorApplication
                  )}
            </div>

            {activeTab === "pending" && (
              <div className="border-t px-6 py-4 flex justify-end gap-3 bg-gray-50">
                <button
                  onClick={() => handleRejectClick(selectedApplication)}
                  className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition-colors"
                  disabled={processingAction}
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApproveApplication(selectedApplication)}
                  className="px-4 py-2 bg-mint text-white rounded-md hover:bg-green-600 transition-colors"
                  disabled={processingAction}
                >
                  {processingAction ? "Processing..." : "Approve"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-xl font-bold text-gray-800">
                Reject Application
              </h3>
              <button
                onClick={() => setShowRejectionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Please provide a reason for rejecting this application. This
                will be shown to the applicant.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-purple focus:border-purple"
                rows={4}
                placeholder="Enter rejection reason..."
              ></textarea>
            </div>

            <div className="border-t px-6 py-4 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectApplication}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                disabled={processingAction || !rejectionReason.trim()}
              >
                {processingAction ? "Processing..." : "Reject Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsManagementPage;
