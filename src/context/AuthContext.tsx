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
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  auth,
  createUserProfile,
  getUserProfile,
  updateUserProfile as firebaseUpdateUserProfile,
} from "../utils/firebase";

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
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<User | null>;
  logOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<boolean>;
}

// Create a default context value to prevent the "must be used within a Provider" error
const defaultContextValue: AuthContextProps = {
  currentUser: null,
  userProfile: null,
  loading: true,
  signUp: async () => null,
  signIn: async () => null,
  logOut: async () => {},
  updateUserProfile: async () => false,
};

const AuthContext = createContext<AuthContextProps>(defaultContextValue);

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<User | null> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update the user's display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });

        // Create user profile in Firestore
        await createUserProfile(userCredential.user, {
          displayName,
          interests: [],
          preferredTopics: [],
          createdAt: new Date(),
        });

        return userCredential.user;
      }
      return null;
    } catch (error) {
      console.error("Error signing up:", error);
      return null;
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      console.error("Error signing in:", error);
      return null;
    }
  };

  const logOut = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const updateUserProfileData = async (
    data: Partial<UserProfile>
  ): Promise<boolean> => {
    try {
      if (currentUser) {
        await firebaseUpdateUserProfile(currentUser.uid, {
          ...data,
          updatedAt: new Date(),
        });

        // Update local state
        setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating user profile:", error);
      return false;
    }
  };

  useEffect(() => {
    console.log("Setting up auth state listener");

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? `User ${user.uid}` : "No user");
      setCurrentUser(user);

      try {
        if (user) {
          // Fetch user profile from Firestore
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile as UserProfile);

          // Update last login time
          await firebaseUpdateUserProfile(user.uid, { lastLogin: new Date() });
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Error in auth state change handler:", error);
      } finally {
        setLoading(false);
        setAuthInitialized(true);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    signUp,
    signIn,
    logOut,
    updateUserProfile: updateUserProfileData,
  };

  // Use a loading indicator or return null while authentication is initializing
  if (!authInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-mint border-solid"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
