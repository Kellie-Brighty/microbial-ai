import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  auth,
  createUserProfile,
  getUserProfile,
  updateUserProfile as firebaseUpdateUserProfile,
  sendEmailVerification,
} from "../utils/firebase";
import { DEFAULT_NEW_USER_CREDITS } from "../utils/creditsSystem";

interface UserProfile {
  displayName?: string;
  email?: string;
  photoURL?: string;
  interests?: string[];
  preferredTopics?: string[];
  lastLogin?: Date;
  [key: string]: any;
}

interface AuthContextProps {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  emailVerified: boolean;
  checkEmailVerification: () => Promise<boolean>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Record<string, any>) => Promise<boolean>;
  isEmailVerified: () => boolean;
  sendVerificationEmail: (redirectUrl?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          // Check if email is verified
          setEmailVerified(user.emailVerified);

          // Get user profile from Firestore
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
        setEmailVerified(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Function to check if email is verified (refreshes user)
  const checkEmailVerification = async (): Promise<boolean> => {
    if (currentUser) {
      try {
        // Force refresh user to get latest emailVerified status
        await currentUser.reload();
        const updatedUser = auth.currentUser;

        if (updatedUser?.emailVerified) {
          setEmailVerified(true);
          return true;
        }
      } catch (error) {
        console.error("Error checking email verification:", error);
      }
    }
    return false;
  };

  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName });

    // Create user profile in Firestore
    await createUserProfile(user, {
      displayName,
      lastLogin: new Date(),
      credits: DEFAULT_NEW_USER_CREDITS,
    });

    // Send verification email
    await sendEmailVerification();

    return user;
  };

  // Sign in function
  const signIn = async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update last login in Firestore
    await firebaseUpdateUserProfile(user.uid, {
      lastLogin: new Date(),
    });

    return user;
  };

  // Sign out function
  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
  };

  // Check if email is verified
  const isEmailVerified = (): boolean => {
    return currentUser?.emailVerified || false;
  };

  // Send verification email
  const sendVerificationEmail = async (
    redirectUrl?: string
  ): Promise<boolean> => {
    return await sendEmailVerification(redirectUrl);
  };

  // Update user profile
  const updateUserProfile = async (
    data: Record<string, any>
  ): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      await firebaseUpdateUserProfile(currentUser.uid, data);
      // Update local state
      const updatedProfile = await getUserProfile(currentUser.uid);
      setUserProfile(updatedProfile);
      return true;
    } catch (error) {
      console.error("Error updating user profile:", error);
      return false;
    }
  };

  const value: AuthContextProps = {
    currentUser,
    userProfile,
    loading,
    emailVerified,
    checkEmailVerification,
    signUp,
    signIn,
    signOut,
    updateUserProfile,
    isEmailVerified,
    sendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
