// This is a simplified version that bridges to the firebase utility
import { getUserProfile as getProfileFromFirebase } from "./firebase";

export const getUserProfile = async (userId: string) => {
  return await getProfileFromFirebase(userId);
};
