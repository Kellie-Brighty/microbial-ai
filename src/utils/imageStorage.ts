// Utility for storing and retrieving image data using localForage
import localForage from "localforage";

// Initialize a specific store for image data
const imageStore = localForage.createInstance({
  name: "microbial-ai",
  storeName: "image-data",
});

// Store image data for a specific message
export const storeImageData = async (
  messageId: string,
  imageData: string
): Promise<void> => {
  try {
    await imageStore.setItem(messageId, imageData);
    console.log(`Image data stored for message ${messageId}`);
  } catch (error) {
    console.error("Error storing image data:", error);
  }
};

// Retrieve image data for a specific message
export const getImageData = async (
  messageId: string
): Promise<string | null> => {
  try {
    const imageData = await imageStore.getItem<string>(messageId);
    return imageData;
  } catch (error) {
    console.error("Error retrieving image data:", error);
    return null;
  }
};

// Store thread's image messages mapping
export const storeThreadImageMessages = async (
  threadId: string,
  messageIds: string[]
): Promise<void> => {
  try {
    await imageStore.setItem(`thread-${threadId}`, messageIds);
  } catch (error) {
    console.error("Error storing thread image messages:", error);
  }
};

// Get all image messages for a thread
export const getThreadImageMessages = async (
  threadId: string
): Promise<string[]> => {
  try {
    const messageIds = await imageStore.getItem<string[]>(`thread-${threadId}`);
    return messageIds || [];
  } catch (error) {
    console.error("Error retrieving thread image messages:", error);
    return [];
  }
};

// Add a message ID to the thread's image messages list
export const addMessageToThreadImages = async (
  threadId: string,
  messageId: string
): Promise<void> => {
  try {
    const existingMessages = await getThreadImageMessages(threadId);
    if (!existingMessages.includes(messageId)) {
      existingMessages.push(messageId);
      await storeThreadImageMessages(threadId, existingMessages);
    }
  } catch (error) {
    console.error("Error adding message to thread images:", error);
  }
};
