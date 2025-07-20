import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { createVendorProfile } from "../../utils/firebase";
import { FaStore, FaUpload } from "react-icons/fa";
import { uploadFileToStorage } from "../../utils/fileStorage";

interface VendorApplicationFormProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const VendorApplicationForm: React.FC<VendorApplicationFormProps> = ({
  onSuccess,
  onError,
}) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState(currentUser?.email || "");
  const [address, setAddress] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [verificationDocuments, setVerificationDocuments] = useState<File[]>(
    []
  );
  const [_documentUrls, setDocumentUrls] = useState<string[]>([]);

  // Predefined product categories
  const productCategoryOptions = [
    "Lab Equipment",
    "Consumables",
    "Chemicals",
    "Glassware",
    "Safety Equipment",
    "Microscopes",
    "Centrifuges",
    "Incubators",
    "Other",
  ];

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !categories.includes(value)) {
      setCategories([...categories, value]);
      setNewCategory("");
    }
  };

  const removeCategory = (category: string) => {
    setCategories(categories.filter((c) => c !== category));
  };

  const handleAddCustomCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory("");
    }
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
      onError("You must be logged in to apply as a vendor");
      return;
    }

    if (
      !businessName ||
      !businessDescription ||
      !contactPhone ||
      !contactEmail ||
      !address ||
      categories.length === 0
    ) {
      onError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    console.log("Starting vendor application submission process");

    try {
      // Upload verification documents to Firebase Storage if any
      const uploadedUrls: string[] = [];
      
      if (verificationDocuments.length > 0) {
        console.log(`Uploading ${verificationDocuments.length} documents to Firebase Storage`);
        for (const file of verificationDocuments) {
          try {
            console.log(`Uploading document: ${file.name}`);
            // Use Firebase Storage instead of ImgBB, passing the user ID
            const url = await uploadFileToStorage(file, 'vendor-documents', currentUser.uid);
            console.log(`Document uploaded successfully: ${url}`);
            uploadedUrls.push(url);
          } catch (error) {
            console.error("Error uploading document:", error);
            onError("Error uploading verification documents. Please try again.");
            setIsSubmitting(false);
            return;
          }
        }
        console.log("All documents uploaded successfully");
      }

      // Create vendor profile
      console.log("Creating vendor profile with data:", {
        businessName,
        businessDescription,
        contactPhone,
        contactEmail,
        address,
        categories,
        documentsCount: uploadedUrls.length
      });
      
      await createVendorProfile(currentUser.uid, {
        businessName,
        businessDescription,
        contactPhone,
        contactEmail,
        address,
        categories,
        verificationDocuments: uploadedUrls,
      });

      console.log("Vendor profile created successfully");
      onSuccess("Vendor application submitted successfully! We'll review your application and get back to you soon.");
      setDocumentUrls(uploadedUrls);
      
      // Reset form (optional)
      setBusinessName("");
      setBusinessDescription("");
      setContactPhone("");
      setAddress("");
      setCategories([]);
      setVerificationDocuments([]);
      
    } catch (error) {
      console.error("Error submitting vendor application:", error);
      onError("An error occurred while submitting your application. Please try again.");
    } finally {
      setIsSubmitting(false);
      console.log("Vendor application submission process completed");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-mint rounded-full p-3">
          <FaStore className="text-white text-2xl" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-center text-charcoal mb-6">
        Vendor Application
      </h2>

      <p className="text-gray-600 mb-6 text-center">
        Complete this form to apply as a vendor on our marketplace. We'll review
        your application and get back to you within 2-3 business days.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="businessName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Business Name *
          </label>
          <input
            type="text"
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-mint focus:border-mint"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="businessDescription"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Business Description *
          </label>
          <textarea
            id="businessDescription"
            value={businessDescription}
            onChange={(e) => setBusinessDescription(e.target.value)}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-mint focus:border-mint"
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
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-mint focus:border-mint"
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
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-mint focus:border-mint"
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Business Address *
          </label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-mint focus:border-mint"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Categories *
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {categories.map((category) => (
              <div
                key={category}
                className="bg-mint/10 text-mint px-3 py-1 rounded-full flex items-center"
              >
                <span>{category}</span>
                <button
                  type="button"
                  onClick={() => removeCategory(category)}
                  className="ml-2 text-mint hover:text-red-500"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <select
              value=""
              onChange={handleCategoryChange}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-mint focus:border-mint"
            >
              <option value="">Select a category</option>
              {productCategoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Or add custom category"
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-mint focus:border-mint"
              />
              <button
                type="button"
                onClick={handleAddCustomCategory}
                className="bg-mint text-white px-3 py-1 rounded-md hover:bg-purple transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Verification Documents (Business Registration, ID, etc.)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-mint transition-colors">
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
                : "bg-mint text-white hover:bg-purple transition-colors"
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

export default VendorApplicationForm;
