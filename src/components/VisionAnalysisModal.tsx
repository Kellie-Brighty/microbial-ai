import React, { useState, useRef, TouchEvent, useEffect } from "react";
import { IoClose, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { processImageWithVision } from "../utils/visionUtils";
import { fileToDataURL } from "../utils/visionUtils";
import OpenAI from "openai";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../context/AuthContext";
import { FaSignInAlt, FaEnvelope } from "react-icons/fa";
import {
  hasEnoughCredits,
  deductCredits,
  getUserCredits,
  CREDIT_COSTS,
} from "../utils/creditsSystem";
import CreditWarningModal from "./ui/CreditWarningModal";
import { recordUserActivity, ActivityType } from "../utils/activityTracking";

interface VisionAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: OpenAI;
}

const VisionAnalysisModal: React.FC<VisionAnalysisModalProps> = ({
  isOpen,
  onClose,
  client,
}) => {
  const { currentUser, emailVerified } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResultsOnMobile, setShowResultsOnMobile] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState(false);

  // Touch swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance required (in px)
  const minSwipeDistance = 50;

  // Load user credits when the component mounts or currentUser changes
  useEffect(() => {
    const loadUserCredits = async () => {
      if (currentUser) {
        try {
          const userCredits = await getUserCredits(currentUser.uid);
          setCredits(userCredits);

          // Check if user has enough credits for image analysis
          const hasSufficientCredits = await hasEnoughCredits(
            currentUser.uid,
            "IMAGE_ANALYSIS"
          );
          setInsufficientCredits(!hasSufficientCredits);

          console.log("User credits for image analysis:", userCredits);
        } catch (error) {
          console.error("Error loading user credits:", error);
        }
      } else {
        setCredits(null);
      }
    };

    if (isOpen) {
      loadUserCredits();
    }
  }, [currentUser, isOpen]);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(null);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && !showResultsOnMobile && analysisResult) {
      // Swipe left to see results
      setShowResultsOnMobile(true);
    } else if (isRightSwipe && showResultsOnMobile) {
      // Swipe right to go back to upload
      setShowResultsOnMobile(false);
    }

    // Reset values
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Check if user is authenticated
  React.useEffect(() => {
    if (isOpen) {
      if (!currentUser) {
        setShowAuthPrompt(true);
        setShowVerificationPrompt(false);
      } else if (!emailVerified) {
        setShowAuthPrompt(false);
        setShowVerificationPrompt(true);
      } else {
        setShowAuthPrompt(false);
        setShowVerificationPrompt(false);
      }
    }
  }, [isOpen, currentUser, emailVerified]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setAnalysisResult(null);

      // Create image preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    // Check if email is verified
    if (!emailVerified) {
      setShowVerificationPrompt(true);
      return;
    }

    // Check if user has enough credits
    if (currentUser) {
      const hasSufficientCredits = await hasEnoughCredits(
        currentUser.uid,
        "IMAGE_ANALYSIS"
      );
      if (!hasSufficientCredits) {
        setInsufficientCredits(true);
        return;
      }
    }

    setIsAnalyzing(true);
    try {
      const imageData = await fileToDataURL(selectedImage);
      const result = await processImageWithVision(
        client,
        imageData,
        prompt || "Analyze this image in a microbiology context."
      );
      setAnalysisResult(result);
      setShowResultsOnMobile(true);

      // Record the image analysis activity
      if (currentUser) {
        // Record the activity with IMAGE_ANALYSIS type
        recordUserActivity(
          currentUser.uid,
          currentUser.displayName || "User",
          ActivityType.IMAGE_ANALYSIS,
          {
            imageFileName: selectedImage.name,
            promptUsed: prompt || "Default analysis prompt",
            timestamp: new Date().toISOString(),
          }
        );

        // Deduct credits after successful analysis
        const deductionSuccess = await deductCredits(
          currentUser.uid,
          "IMAGE_ANALYSIS",
          `Image analysis performed on ${new Date().toLocaleDateString()}`
        );

        if (deductionSuccess) {
          // Update local credit state
          const updatedCredits = await getUserCredits(currentUser.uid);
          setCredits(updatedCredits);
        } else {
          console.error("Failed to deduct credits for image analysis");
        }
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      setAnalysisResult(
        "There was an error analyzing this image. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  // Show authentication prompt if user is not logged in
  if (showAuthPrompt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <IoClose size={24} />
            </button>
          </div>
          <div className="text-center py-4">
            <div className="mx-auto w-16 h-16 bg-mint rounded-full flex items-center justify-center text-white mb-4">
              <FaSignInAlt size={24} />
            </div>
            <h2 className="text-xl font-bold text-charcoal mb-2">
              Sign In Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please sign in to use the image analysis feature.
            </p>
            <button
              onClick={onClose}
              className="bg-mint text-white px-4 py-2 rounded-lg hover:bg-purple transition-colors"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show verification prompt if email is not verified
  if (showVerificationPrompt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <IoClose size={24} />
            </button>
          </div>
          <div className="text-center py-4">
            <div className="mx-auto w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-white mb-4">
              <FaEnvelope size={24} />
            </div>
            <h2 className="text-xl font-bold text-yellow-800 mb-2">
              Email Verification Required
            </h2>
            <p className="text-gray-600 mb-4">
              You need to verify your email address before you can use the image
              analysis feature.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              A verification link has been sent to{" "}
              <strong>{currentUser?.email}</strong>
            </p>
            <button
              onClick={onClose}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Go to Verification
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show credit warning modal if insufficient credits
  if (insufficientCredits) {
    return (
      <CreditWarningModal
        isOpen={true}
        onClose={() => {
          setInsufficientCredits(false);
          onClose();
        }}
        creditCost={CREDIT_COSTS.IMAGE_ANALYSIS}
        currentCredits={credits}
        actionType="IMAGE_ANALYSIS"
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[85vh] sm:h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-mint text-white p-3 sm:p-4 flex justify-between items-center sticky top-0 z-30">
          {showResultsOnMobile && (
            <button
              onClick={() => setShowResultsOnMobile(false)}
              className="md:hidden text-white flex items-center"
              aria-label="Back to image upload"
            >
              <IoChevronBack size={20} />
            </button>
          )}
          <div className="flex items-center space-x-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0"
            >
              <path d="M6 18h8" />
              <path d="M3 22h18" />
              <path d="M14 22a7 7 0 1 0 0-14h-1" />
              <path d="M9 14h2" />
              <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2" />
              <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
            </svg>
            <h2 className="text-lg sm:text-xl font-bold truncate">
              {showResultsOnMobile
                ? "Image Analysis Results"
                : "Microbial Image Analysis"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 flex-shrink-0"
            aria-label="Close modal"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Updated Credits Banner instead of Limited Time */}
        <div className="bg-yellow-50 border-y border-yellow-200 p-2 sm:p-3 text-yellow-800 text-xs sm:text-sm flex items-start sm:items-center sticky top-[52px] sm:top-16 z-20">
          <div className="flex-shrink-0 mr-2 mt-1 sm:mt-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium">Credit-Based System</p>
            <p className="hidden sm:block">
              Image analysis costs {CREDIT_COSTS.IMAGE_ANALYSIS} credits per
              analysis.
              {currentUser && credits !== null
                ? ` You have ${credits} credits remaining.`
                : " Sign in to check your credits."}
            </p>
          </div>
        </div>

        {/* Mobile Slide View Indicator (only on mobile) */}
        <div className="md:hidden flex flex-col space-y-1 py-1 bg-gray-50 border-y border-gray-100">
          {/* Slide indicators */}
          <div className="flex justify-center items-center space-x-3 py-1">
            <div
              className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 cursor-pointer ${
                !showResultsOnMobile
                  ? "bg-mint shadow-sm shadow-mint/30"
                  : "bg-gray-300"
              }`}
              onClick={() =>
                showResultsOnMobile && setShowResultsOnMobile(false)
              }
            ></div>
            <div
              className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 cursor-pointer ${
                showResultsOnMobile
                  ? "bg-mint shadow-sm shadow-mint/30"
                  : analysisResult
                  ? "bg-gray-300"
                  : "bg-gray-200 cursor-not-allowed"
              }`}
              onClick={() =>
                !showResultsOnMobile &&
                analysisResult &&
                setShowResultsOnMobile(true)
              }
            ></div>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between px-4 py-0.5">
            <button
              onClick={() => setShowResultsOnMobile(false)}
              className={`text-xs flex items-center transition-colors ${
                !showResultsOnMobile
                  ? "text-mint font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              disabled={!showResultsOnMobile}
            >
              <IoChevronBack size={16} className="mr-1" />
              <span className="border-b border-dotted border-gray-300">
                Upload
              </span>
            </button>

            <button
              onClick={() => setShowResultsOnMobile(true)}
              className={`text-xs flex items-center transition-colors ${
                showResultsOnMobile
                  ? "text-mint font-medium"
                  : analysisResult
                  ? "text-gray-500 hover:text-gray-700"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              disabled={!analysisResult || showResultsOnMobile}
            >
              <span className="border-b border-dotted border-gray-300">
                Results
              </span>
              <IoChevronForward size={16} className="ml-1" />
            </button>
          </div>
        </div>

        {/* Result available indicator (only when on upload slide and result is ready) */}
        {analysisResult && !showResultsOnMobile && (
          <div className="md:hidden px-3 py-1.5 bg-gray-50 border-b border-gray-100">
            <button
              onClick={() => setShowResultsOnMobile(true)}
              className="w-full py-1.5 bg-mint/10 hover:bg-mint/15 text-mint rounded-md text-sm flex items-center justify-center transition-colors"
            >
              <span className="relative mr-2">
                <span className="h-2.5 w-2.5 rounded-full bg-mint"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-mint absolute inset-0 animate-ping opacity-75"></span>
              </span>
              Analysis results ready - View now
              <IoChevronForward size={14} className="ml-1.5" />
            </button>
          </div>
        )}

        {/* Swipe hint - only visible first time on results */}
        {showResultsOnMobile && (
          <div className="md:hidden px-4 pt-0.5 pb-1.5 flex justify-between items-center text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center">
              <IoChevronBack size={14} className="mr-1" />
              <span className="italic">Swipe right to go back</span>
            </div>
            <div className="flex items-center">
              <span className="italic">Tap buttons to navigate</span>
            </div>
          </div>
        )}

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Mobile Slide Container */}
          <div
            className="md:hidden flex flex-1 transition-transform duration-300 ease-in-out"
            style={{
              transform: showResultsOnMobile
                ? "translateX(-100%)"
                : "translateX(0)",
            }}
            ref={slideContainerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex min-w-full">
              {/* Left side - Image Upload (First Slide) - Full width on mobile */}
              <div className="p-3 min-w-full flex flex-col h-full">
                <h3 className="text-base font-medium mb-2 text-charcoal bg-white z-10 pb-2 flex-shrink-0">
                  Upload Image
                </h3>
                {/* This container must have a fixed height to enable scrolling on mobile */}
                <div
                  className="flex-1 overflow-y-auto relative"
                  style={{
                    height: "calc(80vh - 200px)",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <div className="flex flex-col h-full">
                    <div
                      className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-3 ${
                        imagePreview ? "border-mint" : "border-gray-300"
                      }`}
                    >
                      {imagePreview ? (
                        <div className="relative w-full flex items-center justify-center">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-h-[160px] max-w-full object-contain"
                          />
                          <button
                            onClick={clearImage}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                            aria-label="Remove image"
                          >
                            <IoClose size={20} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={handleImageClick}
                          className="text-center cursor-pointer p-3 w-full"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 mx-auto text-gray-400 mb-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-gray-500 text-sm">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>

                    {/* Prompt input */}
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Analysis Prompt (Optional)
                      </label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe what you'd like to know about this image..."
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-mint focus:border-mint text-sm resize-none"
                        rows={2}
                      />
                    </div>

                    <button
                      onClick={analyzeImage}
                      disabled={!selectedImage || isAnalyzing}
                      className={`mt-3 py-2 px-4 rounded-full font-medium w-full ${
                        !selectedImage || isAnalyzing
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-mint text-white hover:bg-purple transition-colors"
                      }`}
                    >
                      {isAnalyzing ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Analyzing...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          Analyze Image
                          {currentUser && (
                            <span className="text-xs bg-white bg-opacity-20 rounded-full px-2 py-0.5 ml-2">
                              {CREDIT_COSTS.IMAGE_ANALYSIS} Credits
                            </span>
                          )}
                        </span>
                      )}
                    </button>

                    {/* Results Preview and Continue Button */}
                    {analysisResult && !showResultsOnMobile && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm text-charcoal">
                            Analysis Complete
                          </h4>
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        </div>
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {analysisResult.substring(0, 100)}...
                        </p>
                        <button
                          onClick={() => setShowResultsOnMobile(true)}
                          className="w-full py-1.5 px-3 bg-white border border-mint text-mint rounded-full text-sm flex items-center justify-center"
                        >
                          <span>View Full Analysis</span>
                          <IoChevronForward size={16} className="ml-1" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side - Analysis Results (Second Slide) - Full width on mobile */}
              <div className="bg-offWhite p-3 min-w-full h-full flex flex-col">
                <h3 className="text-base font-medium mb-2 text-charcoal bg-offWhite z-10 pb-2 flex-shrink-0 flex items-center">
                  <span>Analysis Results</span>
                  {isAnalyzing && (
                    <div className="ml-2 flex-shrink-0">
                      <div className="h-4 w-4 border-2 border-mint border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </h3>
                {/* This container must have a fixed height to enable scrolling on mobile */}
                <div
                  className="flex-1 overflow-y-auto relative"
                  style={{
                    height: "calc(80vh - 160px)",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <div className="bg-white rounded-lg p-3 border border-gray-200 absolute inset-0 overflow-y-auto">
                    {analysisResult ? (
                      <ReactMarkdown className="prose prose-sm max-w-full break-words">
                        {analysisResult}
                      </ReactMarkdown>
                    ) : (
                      <div className="text-center text-gray-500 flex items-center justify-center h-full">
                        <p className="text-sm">
                          {isAnalyzing
                            ? "Analyzing your image..."
                            : "Upload an image and click 'Analyze Image' to see results here"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Original side-by-side view */}
          <div className="hidden md:flex md:flex-row flex-1">
            {/* Left side - Image Upload - Fixed height on desktop */}
            <div className="p-4 md:w-1/2 flex flex-col h-full md:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
              <h3 className="text-lg font-medium mb-2 text-charcoal sticky top-0 bg-white z-10 pb-2">
                Upload Image
              </h3>
              <div
                className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-4 ${
                  imagePreview ? "border-mint" : "border-gray-300"
                }`}
              >
                {imagePreview ? (
                  <div className="relative w-full flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-[250px] md:max-h-[300px] max-w-full object-contain"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                      aria-label="Remove image"
                    >
                      <IoClose size={20} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={handleImageClick}
                    className="text-center cursor-pointer p-6 w-full"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto text-gray-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-gray-500">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>

              {/* Prompt input */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Analysis Prompt (Optional)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you'd like to know about this image..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-mint focus:border-mint text-base resize-none"
                  rows={3}
                />
              </div>

              <button
                onClick={analyzeImage}
                disabled={!selectedImage || isAnalyzing}
                className={`mt-4 py-2 px-4 rounded-full font-medium w-full ${
                  !selectedImage || isAnalyzing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-mint text-white hover:bg-purple transition-colors"
                }`}
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Analyze Image
                    {currentUser && (
                      <span className="text-xs bg-white bg-opacity-20 rounded-full px-2 py-0.5 ml-2">
                        {CREDIT_COSTS.IMAGE_ANALYSIS} Credits
                      </span>
                    )}
                  </span>
                )}
              </button>
            </div>

            {/* Right side - Analysis Results - Always scrollable */}
            <div className="bg-offWhite p-4 md:w-1/2 overflow-y-auto flex flex-col h-full">
              <h3 className="text-lg font-medium mb-2 text-charcoal sticky top-0 bg-offWhite z-10 pb-2 flex items-center">
                <span>Analysis Results</span>
                {isAnalyzing && (
                  <div className="ml-2 flex-shrink-0">
                    <div className="h-4 w-4 border-2 border-mint border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </h3>
              <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200 overflow-y-auto">
                {analysisResult ? (
                  <ReactMarkdown className="prose max-w-full break-words">
                    {analysisResult}
                  </ReactMarkdown>
                ) : (
                  <div className="text-center text-gray-500 h-full flex items-center justify-center min-h-[200px]">
                    <p className="text-base">
                      {isAnalyzing
                        ? "Analyzing your image..."
                        : "Upload an image and click 'Analyze Image' to see results here"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisionAnalysisModal;
