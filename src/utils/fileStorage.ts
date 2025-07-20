import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import { v4 as uuidv4 } from "uuid";

/**
 * Upload a file to Firebase Storage
 * @param file The file to upload
 * @param folder The folder to upload to (e.g., 'vendor-documents', 'expert-documents')
 * @param userId The user ID to create a user-specific folder
 * @returns Promise that resolves to the download URL of the uploaded file
 */
export const uploadFileToStorage = async (
  file: File,
  folder: string,
  userId: string
): Promise<string> => {
  try {
    // Create a unique file name to prevent overwriting
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    // Create a reference to the file location with user ID in the path
    const storageRef = ref(storage, `${folder}/${userId}/${fileName}`);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    console.log("File uploaded successfully:", snapshot);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("File download URL:", downloadURL);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading file to Firebase Storage:", error);
    throw new Error("Failed to upload file. Please try again.");
  }
};
