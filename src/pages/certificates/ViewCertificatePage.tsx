import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, Certificate } from "../../utils/firebase";
import CertificateTemplate from "../../components/certificates/CertificateTemplate";
import Header from "../../components/Header";
import { FaPrint, FaDownload, FaArrowLeft } from "react-icons/fa";

const ViewCertificatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!id) {
        setError("Certificate ID is missing");
        setLoading(false);
        return;
      }

      try {
        const certificateRef = doc(db, "certificates", id);
        const certificateSnap = await getDoc(certificateRef);

        if (certificateSnap.exists()) {
          setCertificate({
            id: certificateSnap.id,
            ...certificateSnap.data(),
          } as Certificate);
        } else {
          setError("Certificate not found");
        }
      } catch (err) {
        console.error("Error fetching certificate:", err);
        setError("Failed to load certificate data");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print(); // For now, we'll use print functionality as a way to "download" (save as PDF)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onAuthModalOpen={() => {}} />
        <div className="container mx-auto px-4 pt-8">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onAuthModalOpen={() => {}} />
        <div className="container mx-auto px-4 pt-8">
          <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-charcoal mb-4">
                {error || "Certificate not found"}
              </h1>
              <p className="text-gray-600 mb-6">
                The certificate you are looking for could not be found or may
                have expired.
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

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-teal-500 hover:text-blue-600 transition-colors"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8 print:shadow-none print:p-0 print:border-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 print:hidden gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-charcoal">Your Certificate</h1>
            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                className="flex items-center bg-mint text-white px-3 py-2 rounded-lg hover:bg-purple transition-colors"
              >
                <FaPrint className="mr-2" /> Print
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <FaDownload className="mr-2" /> Save as PDF
              </button>
            </div>
          </div>
          
          <div className="certificate-container overflow-hidden print:overflow-visible">
            <CertificateTemplate certificate={certificate} />
          </div>
          
          <div className="mt-6 print:hidden text-sm text-gray-600">
            <p className="mb-2">
              This certificate was issued for participating in {certificate.conferenceName}. 
              You can print this certificate or save it as a PDF for your records.
            </p>
            <p className="text-xs text-gray-500">
              <span className="font-medium">Tip:</span> For best results when printing, use landscape orientation and disable headers/footers.
            </p>
          </div>
        </div>

        {/* Print optimization styles */}
        <style type="text/css" media="print">
          {`
            @page {
              size: landscape;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .certificate-container {
              width: 100%;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default ViewCertificatePage;
