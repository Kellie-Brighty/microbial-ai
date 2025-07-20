import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { createExpertProfile } from "../../utils/firebase";
import { FaUserMd, FaUpload } from "react-icons/fa";
import { uploadFileToStorage } from "../../utils/fileStorage";

interface ExpertApplicationFormProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const ExpertApplicationForm: React.FC<ExpertApplicationFormProps> = ({
  onSuccess,
  onError,
}) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newSpecialization, setNewSpecialization] = useState("");
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [newQualification, setNewQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState(currentUser?.email || "");
  const [verificationDocuments, setVerificationDocuments] = useState<File[]>(
    []
  );

  // Predefined specialization options
  const specializationOptions = [
    "Microbiology",
    "Molecular Biology",
    "Virology",
    "Bacteriology",
    "Mycology",
    "Parasitology",
    "Immunology",
    "Environmental Microbiology",
    "Food Microbiology",
    "Medical Microbiology",
    "Industrial Microbiology",
    "Other",
  ];

  const handleSpecializationChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    if (value && !specializations.includes(value)) {
      setSpecializations([...specializations, value]);
    }
  };

  const removeSpecialization = (specialization: string) => {
    setSpecializations(specializations.filter((s) => s !== specialization));
  };

  const handleAddCustomSpecialization = () => {
    if (newSpecialization && !specializations.includes(newSpecialization)) {
      setSpecializations([...specializations, newSpecialization]);
      setNewSpecialization("");
    }
  };

  const handleAddQualification = () => {
    if (newQualification && !qualifications.includes(newQualification)) {
      setQualifications([...qualifications, newQualification]);
      setNewQualification("");
    }
  };

  const removeQualification = (qualification: string) => {
    setQualifications(qualifications.filter((q) => q !== qualification));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setVerificationDocuments([...verificationDocuments, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...verificationDocuments];
    updatedFiles.splice(index, 1);
    setVerificationDocuments(updatedFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      onError("You must be logged in to apply as an expert");
      return;
    }

    if (
      specializations.length === 0 ||
      qualifications.length === 0 ||
      !experience ||
      !bio ||
      !contactPhone ||
      !contactEmail
    ) {
      onError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    console.log("Starting expert application submission process");

    try {
      // Upload verification documents to Firebase Storage if any
      const uploadedUrls: string[] = [];

      if (verificationDocuments.length > 0) {
        console.log(
          `Uploading ${verificationDocuments.length} documents to Firebase Storage`
        );
        for (const file of verificationDocuments) {
          try {
            console.log(`Uploading document: ${file.name}`);
            // Use Firebase Storage instead of ImgBB, passing the user ID
            const url = await uploadFileToStorage(
              file,
              "expert-documents",
              currentUser.uid
            );
            console.log(`Document uploaded successfully: ${url}`);
            uploadedUrls.push(url);
          } catch (error) {
            console.error("Error uploading document:", error);
            onError(
              "Error uploading verification documents. Please try again."
            );
            setIsSubmitting(false);
            return;
          }
        }
        console.log("All documents uploaded successfully");
      }

      // Create expert profile
      console.log("Creating expert profile with data:", {
        specializations,
        qualifications,
        experience,
        bio,
        contactPhone,
        contactEmail,
        documentsCount: uploadedUrls.length,
      });

      await createExpertProfile(currentUser.uid, {
        specializations,
        qualifications,
        experience,
        bio,
        contactPhone,
        contactEmail,
        verificationDocuments: uploadedUrls,
      });

      console.log("Expert profile created successfully");
      onSuccess(
        "Expert application submitted successfully! We'll review your application and get back to you soon."
      );

      // Reset form (optional)
      setSpecializations([]);
      setQualifications([]);
      setExperience("");
      setBio("");
      setContactPhone("");
      setVerificationDocuments([]);
    } catch (error) {
      console.error("Error submitting expert application:", error);
      onError(
        "An error occurred while submitting your application. Please try again."
      );
    } finally {
      setIsSubmitting(false);
      console.log("Expert application submission process completed");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-purple rounded-full p-3">
          <FaUserMd className="text-white text-2xl" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-center text-charcoal mb-6">
        Expert Application
      </h2>

      <p className="text-gray-600 mb-6 text-center">
        Complete this form to apply as a microbiology expert on our platform.
        We'll review your credentials and get back to you within 2-3 business
        days.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Areas of Specialization *
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {specializations.map((specialization) => (
              <div
                key={specialization}
                className="bg-purple/10 text-purple px-3 py-1 rounded-full flex items-center"
              >
                <span>{specialization}</span>
                <button
                  type="button"
                  onClick={() => removeSpecialization(specialization)}
                  className="ml-2 text-purple hover:text-red-500"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <select
              value=""
              onChange={handleSpecializationChange}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-purple focus:border-purple"
            >
              <option value="">Select a specialization</option>
              {specializationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newSpecialization}
                onChange={(e) => setNewSpecialization(e.target.value)}
                placeholder="Or add custom specialization"
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-purple focus:border-purple"
              />
              <button
                type="button"
                onClick={handleAddCustomSpecialization}
                className="bg-purple text-white px-3 py-1 rounded-md hover:bg-mint transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Qualifications *
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {qualifications.map((qualification) => (
              <div
                key={qualification}
                className="bg-purple/10 text-purple px-3 py-1 rounded-full flex items-center"
              >
                <span>{qualification}</span>
                <button
                  type="button"
                  onClick={() => removeQualification(qualification)}
                  className="ml-2 text-purple hover:text-red-500"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newQualification}
              onChange={(e) => setNewQualification(e.target.value)}
              placeholder="Add qualification (e.g., Ph.D. in Microbiology)"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-purple focus:border-purple"
            />
            <button
              type="button"
              onClick={handleAddQualification}
              className="bg-purple text-white px-3 py-1 rounded-md hover:bg-mint transition-colors"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Add your degrees, certifications, and relevant qualifications
          </p>
        </div>

        <div className="mb-4">
          <label
            htmlFor="experience"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Years of Experience *
          </label>
          <input
            type="text"
            id="experience"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple focus:border-purple"
            placeholder="e.g., 5 years in academic research, 3 years in industry"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Professional Bio *
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple focus:border-purple"
            placeholder="Briefly describe your professional background, expertise, and achievements"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor="contactPhone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Contact Phone *
            </label>
            <input
              type="tel"
              id="contactPhone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple focus:border-purple"
              required
            />
          </div>

          <div>
            <label
              htmlFor="contactEmail"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Contact Email *
            </label>
            <input
              type="email"
              id="contactEmail"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple focus:border-purple"
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Verification Documents (Certificates, Degrees, CV)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-purple transition-colors">
            <input
              type="file"
              id="documents"
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept="image/*,.pdf"
            />
            <label
              htmlFor="documents"
              className="cursor-pointer flex flex-col items-center"
            >
              <FaUpload className="text-gray-400 text-2xl mb-2" />
              <span className="text-gray-600">Click to upload documents</span>
              <span className="text-gray-400 text-sm mt-1">
                (Images or PDF files)
              </span>
            </label>
          </div>

          {verificationDocuments.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Selected files:
              </p>
              <ul className="space-y-1">
                {verificationDocuments.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                  >
                    <span className="text-sm truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-md font-medium ${
              isSubmitting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-purple text-white hover:bg-mint transition-colors"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                <span>Submitting...</span>
              </div>
            ) : (
              "Submit Application"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpertApplicationForm;
