import React, { useState, useRef } from "react";
import { useCommunity } from "../../context/CommunityContext";
import { FiImage, FiX } from "react-icons/fi";
import { useCommunityTheme } from "../../context/CommunityThemeContext";

const CreatePostForm: React.FC = () => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createNewPost } = useCommunity();
  const { isDarkMode } = useCommunityTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    try {
      setIsSubmitting(true);
      await createNewPost(content, image || undefined);
      setContent("");
      setImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should not exceed 5MB");
        return;
      }

      setImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className={`rounded-lg shadow-md overflow-hidden ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      }`}
    >
      <form onSubmit={handleSubmit} className="p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share something with the community..."
          className={`w-full p-3 rounded-lg mb-3 resize-none min-h-[100px] focus:outline-none focus:ring-2 ${
            isDarkMode
              ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
              : "bg-gray-50 border border-gray-200 text-gray-900 focus:ring-blue-400"
          }`}
          disabled={isSubmitting}
        />

        {imagePreview && (
          <div className="relative mb-3">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-60 rounded-lg object-contain mx-auto"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className={`absolute top-2 right-2 p-1 rounded-full ${
                isDarkMode
                  ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FiX size={20} />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
            className="hidden"
            disabled={isSubmitting}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center ${
              isDarkMode
                ? "text-gray-300 hover:text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
            disabled={isSubmitting}
          >
            <FiImage className="mr-1" size={18} />
            <span>Add Image</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !image)}
            className={`px-4 py-2 rounded-lg ${
              isSubmitting || (!content.trim() && !image)
                ? isDarkMode
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                : isDarkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostForm;
