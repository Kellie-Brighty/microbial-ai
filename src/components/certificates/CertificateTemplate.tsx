import React from "react";
import { Certificate } from "../../utils/firebase";

interface CertificateTemplateProps {
  certificate: Certificate;
}

const CertificateTemplate: React.FC<CertificateTemplateProps> = ({
  certificate,
}) => {
  // Format the issue date
  const formattedIssueDate = certificate.issueDate?.seconds
    ? new Date(certificate.issueDate.seconds * 1000).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <div className="relative bg-white border-8 border-yellow-100 p-4 sm:p-8 w-full max-w-3xl mx-auto shadow-lg print:shadow-none">
      {/* Certificate Border */}
      <div className="absolute inset-0 border-4 border-yellow-700 m-2 sm:m-4"></div>

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 flex items-center justify-center">
        <div className="text-yellow-700 text-[200px] sm:text-[400px] font-serif">
          C
        </div>
      </div>

      {/* Certificate Content */}
      <div className="relative z-10 text-center p-2 sm:p-8">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-serif text-yellow-800 mb-2">
            Certificate of Completion
          </h1>
          <div className="h-px w-32 sm:w-48 bg-yellow-700 mx-auto"></div>
        </div>

        {/* Body */}
        <div className="mb-4 sm:mb-8">
          <p className="text-base sm:text-lg text-gray-600 mb-3 sm:mb-6">
            This is to certify that
          </p>
          <h2 className="text-xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-6 border-b border-gray-300 pb-2 max-w-md mx-auto">
            {certificate.recipientName}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-3 sm:mb-6">
            has successfully participated in
          </p>
          <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2">
            {certificate.conferenceName}
          </h3>
          <p className="text-base sm:text-lg text-gray-600">
            held on {certificate.conferenceDate}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 sm:mt-16 flex justify-between flex-col sm:flex-row space-y-4 sm:space-y-0">
          <div className="text-left">
            <div className="h-px w-32 sm:w-48 bg-gray-400 mb-2"></div>
            <p className="text-xs sm:text-sm text-gray-600">
              Date Issued: {formattedIssueDate}
            </p>
          </div>

          <div className="text-right">
            <div className="h-px w-32 sm:w-48 bg-gray-400 mb-2"></div>
            <p className="text-xs sm:text-sm text-gray-600">
              Issuer: {certificate.issuedBy}
            </p>
          </div>
        </div>

        {/* Certificate ID */}
        <div className="mt-6 sm:mt-12 text-xs text-gray-400">
          Certificate ID: {certificate.id}
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplate;
