// Image upload service using ImgBB API
// This provides an external image hosting solution

/**
 * Uploads an image to ImgBB and returns the URL
 * @param file The file to upload
 * @returns URL to the hosted image
 */
export const uploadImageToImgbb = async (file: File): Promise<string> => {
  try {
    // Convert file to base64
    const base64Image = await fileToBase64(file);

    // ImgBB API key - get a free key from https://api.imgbb.com/
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY; // Demo key, replace with your own

    // Create form data
    const formData = new FormData();
    formData.append("key", apiKey);
    formData.append("image", base64Image.split(",")[1]); // Remove the data:image/xxx;base64, prefix

    // Send the request to ImgBB
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to upload image");
    }

    // Return the image URL
    return data.data.url;
  } catch (error) {
    console.error("Error uploading image to ImgBB:", error);
    throw new Error("Failed to upload image to external host");
  }
};

/**
 * Converts a file to a base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
