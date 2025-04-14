import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createConference, Conference } from "../../utils/firebase";
import { uploadImageToImgbb } from "../../utils/imageUpload";
import { FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import AuthModal from "../../components/auth/AuthModal";
import Notification from "../../components/ui/Notification";
import Header from "../../components/Header";

const ConferenceCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notification, setNotification] = useState({
    type: "success" as "success" | "error" | "info",
    message: "",
    isVisible: false,
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  }, []);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // Add state for image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Helper functions for date validation
  const getTodayFormatted = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Check if a selected datetime is in the past
  const isDateTimeInPast = (date: string, time: string) => {
    if (!date || !time) return false;

    const selectedDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    return selectedDateTime < now;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    if (
      !title ||
      !description ||
      !youtubeUrl ||
      !startDate ||
      !startTime ||
      !endDate ||
      !endTime
    ) {
      setError("Please fill in all required fields");
      setNotification({
        message: "Please fill in all required fields",
        type: "error",
        isVisible: true,
      });
      return;
    }

    // Validate dates and times
    if (isDateTimeInPast(startDate, startTime)) {
      setError("Start date and time cannot be in the past");
      setNotification({
        message: "Start date and time cannot be in the past",
        type: "error",
        isVisible: true,
      });
      return;
    }

    // Create Date objects for comparison
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    const now = new Date();

    if (endDateTime < startDateTime) {
      setError("End date and time must be after start date and time");
      setNotification({
        message: "End date and time must be after start date and time",
        type: "error",
        isVisible: true,
      });
      return;
    }

    setLoading(true);
    setError("");

    try {
      let finalThumbnailUrl = thumbnailUrl;

      // Handle file upload using external image hosting
      if (thumbnailFile) {
        try {
          // Upload to external image hosting service
          finalThumbnailUrl = await uploadImageToImgbb(thumbnailFile);
          console.log("Image uploaded to external host:", finalThumbnailUrl);
        } catch (error) {
          console.error("Error uploading image:", error);
          setNotification({
            message:
              "Failed to upload image. Please try again or use an image URL instead.",
            type: "error",
            isVisible: true,
          });
          setLoading(false);
          return;
        }
      }

      // If neither a URL nor a file was provided, use a default placeholder
      if (!finalThumbnailUrl && !thumbnailFile) {
        finalThumbnailUrl =
          "https://via.placeholder.com/1200x675?text=Microbial+AI+Conference";
      }

      // Determine appropriate status based on current time relative to start/end times
      let status: "upcoming" | "live" | "ended" = "upcoming";

      if (now >= startDateTime && now <= endDateTime) {
        status = "live";
      } else if (now > endDateTime) {
        status = "ended";
      }

      const conferenceData: Omit<Conference, "id" | "createdAt" | "updatedAt"> =
        {
          title,
          description,
          youtubeUrl,
          startTime: startDateTime,
          endTime: endDateTime,
          venue,
          status,
          thumbnailUrl: finalThumbnailUrl,
          organizer: currentUser.displayName || "Anonymous",
          organizerId: currentUser.uid,
          tags,
          isPublic,
        };

      // Create conference in database
      const conferenceId = await createConference(conferenceData);

      setNotification({
        message: "Conference created successfully!",
        type: "success",
        isVisible: true,
      });

      // Navigate to the new conference
      navigate(`/conferences/${conferenceId}`);
    } catch (err) {
      console.error("Error creating conference:", err);
      setError("Failed to create conference. Please try again.");
      setNotification({
        message: "Failed to create conference. Please try again.",
        type: "error",
        isVisible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size - limit to 2MB
      const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSizeInBytes) {
        setError(
          "File size is too large. Please select an image smaller than 2MB."
        );
        setNotification({
          message:
            "File size is too large. Please select an image smaller than 2MB.",
          type: "error",
          isVisible: true,
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file.");
        setNotification({
          message: "Please select a valid image file.",
          type: "error",
          isVisible: true,
        });
        return;
      }

      // Generate preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setThumbnailFile(file);
      setThumbnailUrl(""); // Clear URL input when file is selected
      setError(""); // Clear any errors
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setThumbnailUrl(url);
    setThumbnailFile(null); // Clear file input when URL is entered

    // Update preview when URL changes
    if (url) {
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() === "") return;
    if (!tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
    }
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header onAuthModalOpen={() => setAuthModalOpen(true)} />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(message) =>
          setNotification({
            message,
            type: "success",
            isVisible: true,
          })
        }
      />

      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />

      <div className="container mx-auto px-4 py-6">
        <Link
          to="/conferences"
          className="inline-flex items-center text-teal-600 hover:text-teal-700 mb-6"
        >
          <FaArrowLeft className="mr-2" /> Back to Conferences
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          Create a New Conference
        </h1>

        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-3 rounded-md">
            {error}
          </div>
        )}

        {!currentUser ? (
          <div className="text-center py-8">
            <p className="mb-4 opacity-80">
              You need to be logged in to create a conference.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center bg-mint text-white px-4 py-2 rounded-full font-medium hover:bg-purple transition-colors"
            >
              Sign In to Continue
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block font-medium mb-2">
                  Conference Title*
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mint transition-colors"
                  placeholder="Enter a title for your conference"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium mb-2">Description*</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mint h-32 transition-colors"
                  placeholder="Describe what your conference is about"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium mb-2">
                  YouTube Stream URL*
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mint transition-colors"
                  placeholder="e.g., https://youtube.com/watch?v=xxxx"
                  required
                />
                <p className="mt-1 text-sm opacity-70">
                  Enter the URL of your YouTube live stream or scheduled stream
                </p>
              </div>

              <div>
                <label className="block font-medium mb-2">Start Date*</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={getTodayFormatted()}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mint transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Start Time*</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mint transition-colors"
                  required
                />
                {startDate === getTodayFormatted() && (
                  <p className="mt-1 text-xs text-amber-600">
                    For today's date, please select a time in the future.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-medium mb-2">End Date*</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || getTodayFormatted()}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mint transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-2">End Time*</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mint transition-colors"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium mb-2">Venue*</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mint transition-colors"
                  placeholder="Enter the physical location where the conference will be held"
                  required
                />
                <p className="mt-1 text-sm opacity-70">
                  Provide the address or name of the venue where attendees
                  should gather
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <div
                      key={index}
                      className="bg-hover px-2 py-1 rounded-full flex items-center text-sm"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 opacity-70 hover:text-red-500 transition-colors"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="flex-grow px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-mint transition-colors"
                    placeholder="e.g., microbiology, research, bacteria"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="bg-mint text-white px-4 py-2 rounded-r-md hover:bg-purple transition-colors"
                  >
                    Add
                  </button>
                </div>
                <p className="mt-1 text-sm opacity-70">
                  Press Enter or click Add to add a tag
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-5 w-5 text-mint rounded focus:ring-mint transition-colors"
                  />
                  <span className="ml-2">
                    Make this conference public (visible to all users)
                  </span>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium mb-2">
                  Thumbnail Image
                </label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Upload File
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-mint/10 file:text-mint
                        hover:file:bg-mint/20 transition-colors"
                    />
                    <p className="mt-1 text-xs opacity-70">
                      Max file size: 2MB. Supported formats: JPG, PNG, GIF.
                    </p>
                  </div>
                  <div className="relative">
                    <div
                      className="absolute inset-0 flex items-center"
                      aria-hidden="true"
                    >
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-card opacity-80">Or</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={thumbnailUrl}
                      onChange={handleUrlChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mint transition-colors"
                    />
                  </div>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Image Preview</p>
                      <div className="border border-border rounded-md overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Thumbnail Preview"
                          className="w-full h-48 object-cover"
                          onError={() => {
                            setImagePreview(null);
                            setError(
                              "Invalid image URL. Please provide a valid direct link to an image."
                            );
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Link
                to="/conferences"
                className="px-4 py-2 border border-border rounded-md mr-3 hover:bg-hover transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-mint text-white rounded-md hover:bg-purple transition-colors disabled:opacity-70"
              >
                {loading ? "Creating..." : "Create Conference"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ConferenceCreatePage;
