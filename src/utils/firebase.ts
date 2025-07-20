// Import the Firebase SDK
import { FirebaseError, initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  type Firestore,
  type DocumentData,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
  addDoc,
  limit,
  orderBy,
  increment,
} from "firebase/firestore";
import {
  getAuth,
  type Auth,
  type User,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword as firebaseCreateUser,
  sendEmailVerification as firebaseSendEmailVerification,
  applyActionCode as firebaseApplyActionCode,
  ActionCodeSettings,
} from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { debug } from "./debugging";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  // Replace with your Firebase config from the Firebase console
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  debug("Firebase", "Firebase initialized successfully");
} catch (error) {
  if (error instanceof FirebaseError) {
    console.error("Firebase initialization error:", error.code, error.message);
  } else {
    console.error("Error initializing Firebase:", error);
  }

  console.warn("Firebase authentication will not work. Using fallback mode.");

  // Create a dummy implementation that won't crash the app
  // but will log warnings if anyone tries to use it
  const createDummyAuth = (): Auth => {
    const dummyAuth = {} as Auth;
    // Add warning log for any property access
    return new Proxy(dummyAuth, {
      get: (_target, prop) => {
        console.warn(
          `Firebase Auth not initialized. Attempted to access ${String(prop)}`
        );
        return () => Promise.resolve(null);
      },
    });
  };

  const createDummyFirestore = (): Firestore => {
    const dummyFirestore = {} as Firestore;
    // Add warning log for any property access
    return new Proxy(dummyFirestore, {
      get: (_target, prop) => {
        console.warn(
          `Firestore not initialized. Attempted to access ${String(prop)}`
        );
        return () => Promise.resolve(null);
      },
    });
  };

  app = {} as any;
  auth = createDummyAuth();
  db = createDummyFirestore();
  storage = {} as any;
}

// Export for use in other parts of the app
export { auth, db, storage };

// Auth facade to simplify imports
export const createUserWithEmailAndPassword = firebaseCreateUser;
export const signInWithEmailAndPassword = firebaseSignIn;
export const signOut = firebaseSignOut;
export const onAuthStateChanged = firebaseOnAuthStateChanged;

// Send email verification with custom redirect URL
export const sendEmailVerification = async (
  redirectUrl?: string
): Promise<boolean> => {
  if (!auth.currentUser) return false;

  try {
    const actionCodeSettings: ActionCodeSettings = {
      // URL you want to redirect back to after email verification
      url: redirectUrl || `${window.location.origin}/auth/verify-email`,
      handleCodeInApp: true,
    };

    await firebaseSendEmailVerification(auth.currentUser, actionCodeSettings);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

// Apply action code (for email verification)
export const applyActionCode = (auth: Auth, code: string) =>
  firebaseApplyActionCode(auth, code);

// Create a new user profile in Firestore
export const createUserProfile = async (
  user: User,
  additionalData: Record<string, any> = {}
): Promise<void> => {
  if (!user) return;

  try {
    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      const { displayName, email, photoURL } = user;
      const createdAt = new Date();

      // Add default roles to the user profile
      const roles = {
        isVendor: false,
        isExpert: false,
        isAdmin: false,
      };

      await setDoc(userRef, {
        displayName,
        email,
        photoURL,
        createdAt,
        roles,
        ...additionalData,
      });

      debug("Firebase", `User profile created for ${user.uid}`);
    }
  } catch (error) {
    console.error("Error creating user profile:", error);
  }
};

// Update a user profile in Firestore
export const updateUserProfile = async (
  userId: string,
  data: Record<string, any>
): Promise<void> => {
  if (!userId) return;

  try {
    const userRef = doc(db, "users", userId);

    // Special handling for role updates to ensure they're properly structured
    if (data.roles) {
      const currentDoc = await getDoc(userRef);
      const currentData = currentDoc.data();

      // Merge with existing roles to prevent overwriting
      if (currentData && currentData.roles) {
        data.roles = {
          ...currentData.roles,
          ...data.roles,
        };
      }
    }

    await updateDoc(userRef, data);
    debug("Firebase", `User profile updated for ${userId}`);
  } catch (error) {
    console.error("Error updating user profile:", error);
  }
};

// Get user profile
export const getUserProfile = async (
  userId: string
): Promise<DocumentData | null> => {
  if (!userId) {
    debug("Firebase", "Cannot get profile: No user ID provided");
    return null;
  }

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      console.log("No user profile found");
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

// Conference interfaces
export interface Conference {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  startTime: any; // Using any to handle both Timestamp and JavaScript Date
  endTime: any; // Using any to handle both Timestamp and JavaScript Date
  status: "upcoming" | "live" | "ended";
  venue: string;
  thumbnailUrl: string;
  organizer: string;
  organizerId: string;
  tags: string[];
  isPublic: boolean;
  createdAt: any;
  updatedAt: any;
}

// Conference registration interface
export interface ConferenceRegistration {
  id: string;
  conferenceId: string;
  userId: string;
  fullName: string;
  age: number;
  institution: string;
  stateOfOrigin: string;
  lgaOfOrigin: string;
  employmentStatus: string;
  matricNumber?: string;
  level?: string;
  nin: string;
  maritalStatus: string;
  skills: string[];
  phoneNumber: string;
  email: string;
  twitterHandle?: string;
  registeredAt: any;
  roomAssignment?: string;
  attendanceConfirmed: boolean;
  foodDistributed: boolean;
  certificateIssued?: boolean;
  certificateId?: string;
}

// Get all live conferences
export const getLiveConferences = async (): Promise<Conference[]> => {
  try {
    const now = Timestamp.now();
    console.log("Fetching live conferences. Current time:", now.toDate());

    const conferencesRef = collection(db, "conferences");

    // For debugging - get all conferences without filtering
    const simpleQuery = query(conferencesRef);
    const simpleSnapshot = await getDocs(simpleQuery);
    console.log(
      `Found ${simpleSnapshot.size} total conferences to include as live`
    );

    // Create a map to track unique conferences
    const conferenceMap = new Map<string, Conference>();

    // Process all conferences, but only add each one once to prevent duplication
    simpleSnapshot.forEach((doc) => {
      const data = doc.data();

      // Check if conference is marked as live
      const hasLiveStatus = data.status === "live";

      // Check if conference time is valid (should have started but not ended)
      let isActuallyLive = true;
      if (data.startTime?.seconds && data.endTime?.seconds) {
        const startTimeDate = new Date(data.startTime.seconds * 1000);
        const endTimeDate = new Date(data.endTime.seconds * 1000);
        const currentTime = now.toDate();
        isActuallyLive =
          startTimeDate <= currentTime && endTimeDate >= currentTime;
      }

      // Only include if it's a live conference
      if (hasLiveStatus || isActuallyLive) {
        // If we haven't added this conference yet, add it
        if (!conferenceMap.has(doc.id)) {
          const conference = {
            id: doc.id,
            ...data,
          } as Conference;
          conferenceMap.set(doc.id, conference);
          console.log(
            `Including live conference: ${doc.id}, title: ${
              data.title || "No title"
            }`
          );
        }
      }
    });

    // Return the unique list of conferences
    return Array.from(conferenceMap.values());
  } catch (error) {
    console.error("Error getting live conferences:", error);
    return [];
  }
};

// Get all upcoming conferences
export const getUpcomingConferences = async (): Promise<Conference[]> => {
  try {
    const now = Timestamp.now();
    console.log("Fetching upcoming conferences. Current time:", now.toDate());
    const conferencesRef = collection(db, "conferences");

    // First, try to get all conferences without filtering to debug
    const allConferencesQuery = query(conferencesRef);
    const allConferencesSnapshot = await getDocs(allConferencesQuery);

    console.log(
      `Found ${allConferencesSnapshot.size} total conferences in database`
    );

    // Create a map to track unique conferences
    const conferenceMap = new Map<string, Conference>();

    // Process all conferences, but only add each one once to prevent duplication
    allConferencesSnapshot.forEach((doc) => {
      const data = doc.data();

      // Check if conference is marked as upcoming or has a future start time
      const hasUpcomingStatus = data.status === "upcoming";
      let isUpcoming = true;

      if (data.startTime?.seconds) {
        const startTimeDate = new Date(data.startTime.seconds * 1000);
        isUpcoming = startTimeDate > now.toDate();
      }

      // Only include if it's an upcoming conference (by status or future date)
      if (hasUpcomingStatus || isUpcoming) {
        // If we haven't added this conference yet, add it
        if (!conferenceMap.has(doc.id)) {
          const conference = {
            id: doc.id,
            ...data,
          } as Conference;
          conferenceMap.set(doc.id, conference);
          console.log(
            `Including upcoming conference: ${doc.id}, title: ${
              data.title || "No title"
            }`
          );
        }
      }
    });

    // Return the unique list of conferences
    return Array.from(conferenceMap.values());
  } catch (error) {
    console.error("Error getting upcoming conferences:", error);
    return [];
  }
};

// Get past conferences (for archives)
export const getPastConferences = async (
  limitCount = 10
): Promise<Conference[]> => {
  try {
    console.log(`Fetching past conferences, limit: ${limitCount}`);
    const conferencesRef = collection(db, "conferences");
    const now = Timestamp.now();

    // For debugging - get all conferences without filtering
    const simpleQuery = query(conferencesRef);
    const simpleSnapshot = await getDocs(simpleQuery);
    console.log(
      `Found ${simpleSnapshot.size} total conferences for past display`
    );

    // Create a map to track unique conferences
    const conferenceMap = new Map<string, Conference>();

    // Process all conferences, but only add each one once to prevent duplication
    simpleSnapshot.forEach((doc) => {
      const data = doc.data();

      // Check if conference is marked as ended
      const isEnded = data.status === "ended";

      // Check if conference's end time is in the past
      let isPastDate = false;
      if (data.endTime?.seconds) {
        const endTimeDate = new Date(data.endTime.seconds * 1000);
        isPastDate = endTimeDate < now.toDate();
      } else if (data.startTime?.seconds) {
        // If no end time, check if start time + 1 hour is in the past
        const startTimeDate = new Date(data.startTime.seconds * 1000);
        const estimatedEndTime = new Date(
          startTimeDate.getTime() + 60 * 60 * 1000
        );
        isPastDate = estimatedEndTime < now.toDate();
      }

      // Only include if it's a past conference
      if (isEnded || isPastDate) {
        // If we haven't added this conference yet, add it
        if (!conferenceMap.has(doc.id)) {
          const conference = {
            id: doc.id,
            ...data,
          } as Conference;
          conferenceMap.set(doc.id, conference);
          console.log(
            `Including past conference: ${doc.id}, title: ${
              data.title || "No title"
            }`
          );
        }
      }
    });

    // Get all values from the map as an array
    const conferences = Array.from(conferenceMap.values());

    // Sort by start time (newest to oldest)
    conferences.sort((a, b) => {
      const aTime = a.startTime?.seconds || 0;
      const bTime = b.startTime?.seconds || 0;
      return bTime - aTime; // Descending for past conferences
    });

    // Return the limited number of conferences
    return conferences.slice(0, limitCount);
  } catch (error) {
    console.error("Error getting past conferences:", error);
    return [];
  }
};

// Get a single conference by ID
export const getConference = async (
  conferenceId: string
): Promise<Conference | null> => {
  try {
    const conferenceRef = doc(db, "conferences", conferenceId);
    const conferenceSnap = await getDoc(conferenceRef);

    if (conferenceSnap.exists()) {
      const data = conferenceSnap.data();
      return {
        id: conferenceSnap.id,
        ...data,
      } as Conference;
    } else {
      console.log("No conference found");
      return null;
    }
  } catch (error) {
    console.error("Error getting conference:", error);
    return null;
  }
};

// Get all registrations for a conference
export const getConferenceRegistrations = async (
  conferenceId: string
): Promise<ConferenceRegistration[]> => {
  try {
    const registrationsRef = collection(db, "conferenceRegistrations");
    const q = query(
      registrationsRef,
      where("conferenceId", "==", conferenceId)
    );
    const querySnapshot = await getDocs(q);

    const registrations: ConferenceRegistration[] = [];
    querySnapshot.forEach((doc) => {
      registrations.push({
        id: doc.id,
        ...doc.data(),
      } as ConferenceRegistration);
    });

    return registrations;
  } catch (error) {
    console.error("Error getting conference registrations:", error);
    return [];
  }
};

// Certificate interfaces
export interface Certificate {
  id: string;
  conferenceId: string;
  registrationId: string;
  userId: string;
  recipientName: string;
  conferenceName: string;
  conferenceDate: string;
  issueDate: any; // Timestamp
  certificateUrl?: string;
  issuedBy: string;
  issuedById: string;
}

// Get all certificates for a conference
export const getConferenceCertificates = async (
  conferenceId: string
): Promise<Certificate[]> => {
  try {
    const certificatesRef = collection(db, "certificates");
    const q = query(certificatesRef, where("conferenceId", "==", conferenceId));

    const querySnapshot = await getDocs(q);

    const certificates: Certificate[] = [];
    querySnapshot.forEach((doc) => {
      certificates.push({
        id: doc.id,
        ...doc.data(),
      } as Certificate);
    });

    return certificates;
  } catch (error) {
    console.error("Error getting conference certificates:", error);
    return [];
  }
};

// Issue a certificate for a conference registration
export const issueCertificate = async (
  conferenceId: string,
  registrationId: string,
  userData: { userId: string; recipientName: string },
  issuerData: { issuedBy: string; issuedById: string }
): Promise<Certificate | null> => {
  try {
    // Get conference details
    const conference = await getConference(conferenceId);
    if (!conference) {
      throw new Error("Conference not found");
    }

    // Check if certificate already exists
    const existingCertificate = await getCertificateByRegistration(
      registrationId
    );
    if (existingCertificate) {
      return existingCertificate; // Return existing certificate instead of creating a new one
    }

    // Create certificate data
    const conferenceDate = conference.startTime
      ? new Date(conference.startTime.seconds * 1000).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        )
      : "Unknown Date";

    const certificateData: Omit<Certificate, "id"> = {
      conferenceId,
      registrationId,
      userId: userData.userId,
      recipientName: userData.recipientName,
      conferenceName: conference.title,
      conferenceDate,
      issueDate: serverTimestamp(),
      issuedBy: issuerData.issuedBy,
      issuedById: issuerData.issuedById,
    };

    // Add to certificates collection
    const certificatesRef = collection(db, "certificates");
    const docRef = await addDoc(certificatesRef, certificateData);

    // Update registration to mark certificate as issued
    const registrationRef = doc(db, "conferenceRegistrations", registrationId);
    await updateDoc(registrationRef, {
      certificateIssued: true,
      certificateId: docRef.id,
      updatedAt: serverTimestamp(),
    });

    // Return the certificate with its ID
    return {
      id: docRef.id,
      ...certificateData,
      issueDate: Timestamp.now(), // Use current timestamp for immediate UI display
    };
  } catch (error) {
    console.error("Error issuing certificate:", error);
    return null;
  }
};

// Get a certificate by registration ID
export const getCertificateByRegistration = async (
  registrationId: string
): Promise<Certificate | null> => {
  try {
    const certificatesRef = collection(db, "certificates");
    const q = query(
      certificatesRef,
      where("registrationId", "==", registrationId),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Certificate;
  } catch (error) {
    console.error("Error getting certificate:", error);
    return null;
  }
};

// Get all certificates for a specific user
export const getUserCertificates = async (
  userId: string
): Promise<Certificate[]> => {
  try {
    const certificatesRef = collection(db, "certificates");
    const q = query(certificatesRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const certificates: Certificate[] = [];
    querySnapshot.forEach((doc) => {
      certificates.push({
        id: doc.id,
        ...doc.data(),
      } as Certificate);
    });

    return certificates;
  } catch (error) {
    console.error("Error getting user certificates:", error);
    return [];
  }
};

// Batch issue certificates to multiple registrations
export const batchIssueCertificates = async (
  conferenceId: string,
  registrationIds: string[],
  issuerData: { issuedBy: string; issuedById: string }
): Promise<{
  success: number;
  failed: number;
  certificates: Certificate[];
}> => {
  const results = {
    success: 0,
    failed: 0,
    certificates: [] as Certificate[],
  };

  // Process registrations in smaller batches to avoid hitting Firestore limits
  const batchSize = 20;
  for (let i = 0; i < registrationIds.length; i += batchSize) {
    const batch = registrationIds.slice(i, i + batchSize);

    // Get registration details for this batch
    const registrationsData = await Promise.all(
      batch.map(async (regId) => {
        try {
          const regRef = doc(db, "conferenceRegistrations", regId);
          const regSnap = await getDoc(regRef);
          if (regSnap.exists() && regSnap.data().attendanceConfirmed) {
            const regData = regSnap.data() as ConferenceRegistration;
            // Omit any existing id property from regData to avoid conflict
            const { id: _, ...regDataWithoutId } = regData;
            return {
              id: regSnap.id,
              ...regDataWithoutId,
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching registration ${regId}:`, error);
          return null;
        }
      })
    );

    // Issue certificates for valid registrations
    const certificatePromises = registrationsData
      .filter(
        (reg): reg is ConferenceRegistration & { id: string } =>
          reg !== null && !reg.certificateIssued
      )
      .map(async (reg) => {
        try {
          const cert = await issueCertificate(
            conferenceId,
            reg.id,
            {
              userId: reg.userId,
              recipientName: reg.fullName,
            },
            issuerData
          );

          if (cert) {
            results.success++;
            results.certificates.push(cert);
          } else {
            results.failed++;
          }
          return cert;
        } catch (error) {
          console.error(`Error issuing certificate for ${reg.id}:`, error);
          results.failed++;
          return null;
        }
      });

    await Promise.all(certificatePromises);
  }

  return results;
};

// Quiz interfaces
export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
}

export interface Quiz {
  id: string;
  conferenceId: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  questions: QuizQuestion[];
  durationMinutes: number;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  userId: string;
  userName: string;
  conferenceId: string;
  answers: number[];
  score: number;
  maxPossibleScore: number;
  completedAt: any;
}

// Get all quizzes for a conference
export const getConferenceQuizzes = async (
  conferenceId: string
): Promise<Quiz[]> => {
  try {
    const quizzesRef = collection(db, "quizzes");
    const q = query(quizzesRef, where("conferenceId", "==", conferenceId));
    const querySnapshot = await getDocs(q);

    const quizzes: Quiz[] = [];
    querySnapshot.forEach((doc) => {
      quizzes.push({
        id: doc.id,
        ...doc.data(),
      } as Quiz);
    });

    return quizzes;
  } catch (error) {
    console.error("Error getting conference quizzes:", error);
    return [];
  }
};

// Check if a user is registered for a conference
export const isUserRegisteredForConference = async (
  userId: string,
  conferenceId: string
): Promise<boolean> => {
  try {
    const registrationsRef = collection(db, "conferenceRegistrations");
    const q = query(
      registrationsRef,
      where("userId", "==", userId),
      where("conferenceId", "==", conferenceId)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking user registration:", error);
    return false;
  }
};

// Get registration details if a user is registered for a conference
export const getUserRegistrationForConference = async (
  userId: string,
  conferenceId: string
): Promise<ConferenceRegistration | null> => {
  try {
    const registrationsRef = collection(db, "conferenceRegistrations");
    const q = query(
      registrationsRef,
      where("userId", "==", userId),
      where("conferenceId", "==", conferenceId)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as ConferenceRegistration;
  } catch (error) {
    console.error("Error getting user registration details:", error);
    return null;
  }
};

// Get all registrations for a user
export const getUserConferenceRegistrations = async (
  userId: string
): Promise<ConferenceRegistration[]> => {
  try {
    const registrationsRef = collection(db, "conferenceRegistrations");
    const q = query(registrationsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const registrations: ConferenceRegistration[] = [];
    querySnapshot.forEach((doc) => {
      registrations.push({
        id: doc.id,
        ...doc.data(),
      } as ConferenceRegistration);
    });

    return registrations;
  } catch (error) {
    console.error("Error getting user registrations:", error);
    return [];
  }
};

// Update attendance confirmation status
export const updateRegistrationAttendance = async (
  registrationId: string,
  isConfirmed: boolean
): Promise<boolean> => {
  try {
    const registrationRef = doc(db, "conferenceRegistrations", registrationId);
    await updateDoc(registrationRef, {
      attendanceConfirmed: isConfirmed,
      updatedAt: serverTimestamp(),
    });
    console.log(
      `Updated attendance for registration ${registrationId} to ${isConfirmed}`
    );
    return true;
  } catch (error) {
    console.error("Error updating registration attendance:", error);
    return false;
  }
};

// Update food distribution status
export const updateRegistrationFoodStatus = async (
  registrationId: string,
  isFoodDistributed: boolean
): Promise<boolean> => {
  try {
    const registrationRef = doc(db, "conferenceRegistrations", registrationId);
    await updateDoc(registrationRef, {
      foodDistributed: isFoodDistributed,
      updatedAt: serverTimestamp(),
    });
    console.log(
      `Updated food status for registration ${registrationId} to ${isFoodDistributed}`
    );
    return true;
  } catch (error) {
    console.error("Error updating registration food status:", error);
    return false;
  }
};

// Get a quiz by ID
export const getQuiz = async (quizId: string): Promise<Quiz | null> => {
  try {
    const quizRef = doc(db, "quizzes", quizId);
    const quizSnap = await getDoc(quizRef);

    if (quizSnap.exists()) {
      return {
        id: quizId,
        ...quizSnap.data(),
      } as Quiz;
    } else {
      console.log("No quiz found with ID:", quizId);
      return null;
    }
  } catch (error) {
    console.error("Error getting quiz:", error);
    return null;
  }
};

// Get all submissions for a quiz
export const getQuizSubmissions = async (
  quizId: string
): Promise<QuizSubmission[]> => {
  try {
    const submissionsRef = collection(db, "quizSubmissions");
    const q = query(submissionsRef, where("quizId", "==", quizId));
    const querySnapshot = await getDocs(q);

    const submissions: QuizSubmission[] = [];
    querySnapshot.forEach((doc) => {
      submissions.push({
        id: doc.id,
        ...doc.data(),
      } as QuizSubmission);
    });

    // Sort by score (highest first)
    submissions.sort((a, b) => b.score - a.score);

    return submissions;
  } catch (error) {
    console.error("Error getting quiz submissions:", error);
    return [];
  }
};

// Get all quiz submissions for a user
export const getUserQuizSubmissions = async (
  userId: string
): Promise<QuizSubmission[]> => {
  try {
    const submissionsRef = collection(db, "quizSubmissions");
    const q = query(submissionsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const submissions: QuizSubmission[] = [];
    querySnapshot.forEach((doc) => {
      submissions.push({
        id: doc.id,
        ...doc.data(),
      } as QuizSubmission);
    });

    return submissions;
  } catch (error) {
    console.error("Error getting user quiz submissions:", error);
    return [];
  }
};

// Get a specific quiz submission for a user
export const getUserQuizSubmission = async (
  userId: string,
  quizId: string
): Promise<QuizSubmission | null> => {
  try {
    const submissionsRef = collection(db, "quizSubmissions");
    const q = query(
      submissionsRef,
      where("userId", "==", userId),
      where("quizId", "==", quizId),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as QuizSubmission;
  } catch (error) {
    console.error("Error getting user quiz submission:", error);
    return null;
  }
};

// Submit a quiz attempt and score it
export const submitQuizAttempt = async (
  quizId: string,
  userId: string,
  userName: string,
  answers: number[]
): Promise<QuizSubmission | null> => {
  try {
    // Check if user already submitted this quiz
    const existingSubmission = await getUserQuizSubmission(userId, quizId);
    if (existingSubmission) {
      throw new Error("You have already submitted this quiz");
    }

    // Get quiz details to calculate score
    const quiz = await getQuiz(quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    // Calculate score
    let score = 0;
    let maxPossibleScore = 0;

    quiz.questions.forEach((question, index) => {
      // Add to max possible score
      maxPossibleScore += question.points;

      // Add to score if answer is correct
      if (
        index < answers.length &&
        answers[index] === question.correctOptionIndex
      ) {
        score += question.points;
      }
    });

    // Create submission data
    const submissionData: Omit<QuizSubmission, "id"> = {
      quizId,
      userId,
      userName,
      conferenceId: quiz.conferenceId,
      answers,
      score,
      maxPossibleScore,
      completedAt: serverTimestamp(),
    };

    // Add to submissions collection
    const submissionsRef = collection(db, "quizSubmissions");
    const docRef = await addDoc(submissionsRef, submissionData);

    // Return the submission with its ID
    return {
      id: docRef.id,
      ...submissionData,
      completedAt: Timestamp.now(), // Use current timestamp for immediate UI display
    } as QuizSubmission;
  } catch (error) {
    console.error("Error submitting quiz attempt:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to submit quiz");
  }
};

// Create a new quiz for a conference
export const createQuiz = async (
  conferenceId: string,
  creatorId: string,
  creatorName: string,
  quizData: {
    title: string;
    description: string;
    durationMinutes: number;
    isActive: boolean;
    questions: Omit<QuizQuestion, "id">[];
  }
): Promise<string> => {
  try {
    // Generate IDs for questions
    const questionsWithIds = quizData.questions.map((question) => ({
      ...question,
      id: crypto.randomUUID(), // Use a unique ID for each question
    }));

    const quizzesRef = collection(db, "quizzes");
    const newQuiz = {
      conferenceId,
      creatorId,
      creatorName,
      title: quizData.title,
      description: quizData.description,
      durationMinutes: quizData.durationMinutes,
      isActive: quizData.isActive,
      questions: questionsWithIds,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(quizzesRef, newQuiz);
    console.log("Quiz created successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating quiz:", error);
    throw error;
  }
};

// Update an existing quiz
export const updateQuiz = async (
  quizId: string,
  quizData: Partial<{
    title: string;
    description: string;
    durationMinutes: number;
    isActive: boolean;
    questions: QuizQuestion[];
  }>
): Promise<void> => {
  try {
    const quizRef = doc(db, "quizzes", quizId);

    // Prepare update data
    const updateData: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    // Add all provided fields to update data
    if (quizData.title !== undefined) updateData.title = quizData.title;
    if (quizData.description !== undefined)
      updateData.description = quizData.description;
    if (quizData.durationMinutes !== undefined)
      updateData.durationMinutes = quizData.durationMinutes;
    if (quizData.isActive !== undefined)
      updateData.isActive = quizData.isActive;
    if (quizData.questions) updateData.questions = quizData.questions;

    await updateDoc(quizRef, updateData);
    console.log("Quiz updated successfully:", quizId);
  } catch (error) {
    console.error("Error updating quiz:", error);
    throw error;
  }
};

// Update conference
export const updateConference = async (
  conferenceId: string,
  data: Partial<Conference>
): Promise<void> => {
  try {
    // First, get the current conference to check if it's live
    const conferenceRef = doc(db, "conferences", conferenceId);
    const conferenceSnap = await getDoc(conferenceRef);

    if (!conferenceSnap.exists()) {
      throw new Error("Conference not found");
    }

    const conference = conferenceSnap.data() as Conference;
    const isLive = conference.status === "live";

    // Create a safe update object
    const safeUpdate: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    // If the conference is live, only allow updating specific fields
    if (isLive) {
      // Only allow updating youtubeUrl when live
      if (data.youtubeUrl !== undefined) {
        safeUpdate.youtubeUrl = data.youtubeUrl;
      }

      // Explicitly prevent updating other fields
      if (
        Object.keys(data).length > 1 ||
        (Object.keys(data).length === 1 && data.youtubeUrl === undefined)
      ) {
        debug(
          "Firebase",
          "Warning: Attempting to update restricted fields for a live conference"
        );
      }
    } else {
      // If not live, allow updating all provided fields
      Object.entries(data).forEach(([key, value]) => {
        safeUpdate[key] = value;
      });
    }

    // Update the document with the safe update object
    await updateDoc(conferenceRef, safeUpdate);
    debug("Firebase", "Conference updated successfully");
  } catch (error) {
    console.error("Error updating conference:", error);
    throw error;
  }
};

// Register for a conference
export const registerForConference = async (
  conferenceId: string,
  userId: string,
  registrationData: Omit<
    ConferenceRegistration,
    | "id"
    | "conferenceId"
    | "userId"
    | "registeredAt"
    | "attendanceConfirmed"
    | "foodDistributed"
  >
): Promise<string> => {
  try {
    // Check if user is already registered
    const existingRegistration = await isUserRegisteredForConference(
      userId,
      conferenceId
    );
    if (existingRegistration) {
      throw new Error("You are already registered for this conference");
    }

    // Check if conference exists and is still upcoming
    const conference = await getConference(conferenceId);
    if (!conference) {
      throw new Error("Conference not found");
    }

    if (conference.status !== "upcoming") {
      throw new Error(
        "Registration is only available for upcoming conferences"
      );
    }

    const registrationsRef = collection(db, "conferenceRegistrations");
    const newRegistration = {
      conferenceId,
      userId,
      ...registrationData,
      registeredAt: serverTimestamp(),
      attendanceConfirmed: false,
      foodDistributed: false,
    };

    const docRef = await addDoc(registrationsRef, newRegistration);
    console.log("Successfully registered for conference:", conferenceId);
    return docRef.id;
  } catch (error) {
    console.error("Error registering for conference:", error);
    throw error;
  }
};

// Create a new conference
export const createConference = async (
  conferenceData: Omit<Conference, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    console.log("Creating new conference:", conferenceData.title);
    console.log("Start time raw data:", conferenceData.startTime);
    console.log("End time raw data:", conferenceData.endTime);

    // Ensure status is set to upcoming if not provided
    if (!conferenceData.status) {
      conferenceData.status = "upcoming";
    }

    // Convert date objects to Firestore timestamps
    let startTime = Timestamp.now();
    let endTime = null;

    try {
      if (conferenceData.startTime) {
        // If it's already a Timestamp, use it directly
        if (conferenceData.startTime instanceof Timestamp) {
          startTime = conferenceData.startTime;
        }
        // If it's a Date, convert it
        else if (conferenceData.startTime instanceof Date) {
          startTime = Timestamp.fromDate(conferenceData.startTime);
        }
        // If it has seconds and nanoseconds, create a new Timestamp
        else if (
          typeof conferenceData.startTime === "object" &&
          "seconds" in conferenceData.startTime &&
          "nanoseconds" in conferenceData.startTime
        ) {
          startTime = new Timestamp(
            conferenceData.startTime.seconds,
            conferenceData.startTime.nanoseconds
          );
        }
        // If it's a number (timestamp in ms), convert it
        else if (typeof conferenceData.startTime === "number") {
          startTime = Timestamp.fromMillis(conferenceData.startTime);
        }
        // If it's a string, parse it as a date
        else if (typeof conferenceData.startTime === "string") {
          startTime = Timestamp.fromDate(new Date(conferenceData.startTime));
        }

        console.log("Converted start time:", startTime.toDate());
      }

      if (conferenceData.endTime) {
        // If it's already a Timestamp, use it directly
        if (conferenceData.endTime instanceof Timestamp) {
          endTime = conferenceData.endTime;
        }
        // If it's a Date, convert it
        else if (conferenceData.endTime instanceof Date) {
          endTime = Timestamp.fromDate(conferenceData.endTime);
        }
        // If it has seconds and nanoseconds, create a new Timestamp
        else if (
          typeof conferenceData.endTime === "object" &&
          "seconds" in conferenceData.endTime &&
          "nanoseconds" in conferenceData.endTime
        ) {
          endTime = new Timestamp(
            conferenceData.endTime.seconds,
            conferenceData.endTime.nanoseconds
          );
        }
        // If it's a number (timestamp in ms), convert it
        else if (typeof conferenceData.endTime === "number") {
          endTime = Timestamp.fromMillis(conferenceData.endTime);
        }
        // If it's a string, parse it as a date
        else if (typeof conferenceData.endTime === "string") {
          endTime = Timestamp.fromDate(new Date(conferenceData.endTime));
        }

        if (endTime) {
          console.log("Converted end time:", endTime.toDate());
        }
      }
    } catch (error) {
      console.error("Error converting dates to timestamps:", error);
      // Fallback to current time if conversion fails
      startTime = Timestamp.now();
      endTime = Timestamp.now();
    }

    const conferencesRef = collection(db, "conferences");
    const newConference = {
      ...conferenceData,
      startTime,
      endTime,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log("New conference data:", {
      title: newConference.title,
      status: newConference.status,
      startTime: newConference.startTime
        ? newConference.startTime.toDate().toString()
        : "Not provided",
      endTime: newConference.endTime
        ? newConference.endTime.toDate().toString()
        : "Not provided",
      thumbnailUrl: newConference.thumbnailUrl ? "Provided" : "Not provided",
    });

    const docRef = await addDoc(conferencesRef, newConference);
    console.log("Conference created successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating conference:", error);
    throw error;
  }
};

// Get all conferences organized by a specific user
export const getUserOrganizedConferences = async (
  userId: string
): Promise<Conference[]> => {
  try {
    const conferencesRef = collection(db, "conferences");
    const q = query(conferencesRef, where("organizerId", "==", userId));
    const querySnapshot = await getDocs(q);

    const conferences: Conference[] = [];
    querySnapshot.forEach((doc) => {
      conferences.push({
        id: doc.id,
        ...doc.data(),
      } as Conference);
    });

    // Sort by most recent first
    conferences.sort((a, b) => {
      const aTime = a.startTime?.seconds || 0;
      const bTime = b.startTime?.seconds || 0;
      return bTime - aTime;
    });

    return conferences;
  } catch (error) {
    console.error("Error getting user organized conferences:", error);
    return [];
  }
};

// End a conference (change status to ended and set endTime)
export const endConference = async (conferenceId: string): Promise<void> => {
  try {
    // Get the conference document
    const conferenceRef = doc(db, "conferences", conferenceId);
    const conferenceSnap = await getDoc(conferenceRef);

    if (!conferenceSnap.exists()) {
      throw new Error("Conference not found");
    }

    // Create a timestamp for the current time
    const now = Timestamp.now();

    // Update the conference with status "ended" and current time as endTime
    await updateDoc(conferenceRef, {
      status: "ended",
      endTime: now,
      updatedAt: serverTimestamp(),
    });

    debug(
      "Firebase",
      `Conference ${conferenceId} ended successfully at ${now.toDate()}`
    );
  } catch (error) {
    console.error("Error ending conference:", error);
    throw error;
  }
};

// Vendor and Expert Profile Interfaces
export interface VendorProfile {
  userId: string;
  businessName: string;
  businessDescription: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  verificationStatus: "pending" | "approved" | "rejected";
  verificationDocuments?: string[]; // URLs to uploaded documents
  categories: string[]; // Types of products they sell
  adminNotes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface ExpertProfile {
  userId: string;
  specializations: string[];
  qualifications: string[];
  experience: string;
  bio: string;
  contactPhone: string;
  contactEmail: string;
  verificationStatus: "pending" | "approved" | "rejected";
  verificationDocuments?: string[]; // URLs to uploaded documents
  adminNotes?: string;
  createdAt: any;
  updatedAt: any;
}

// Create or update a vendor profile
export const createVendorProfile = async (
  userId: string,
  profileData: Partial<VendorProfile>
): Promise<string> => {
  try {
    // First update the user's roles
    await updateUserProfile(userId, {
      roles: { isVendor: true },
    });

    // Then create/update the vendor profile
    const vendorRef = doc(db, "vendorProfiles", userId);
    const now = serverTimestamp();

    await setDoc(
      vendorRef,
      {
        userId,
        verificationStatus: "pending",
        createdAt: now,
        updatedAt: now,
        ...profileData,
      },
      { merge: true }
    );

    debug("Firebase", `Vendor profile created/updated for ${userId}`);
    return userId;
  } catch (error) {
    console.error("Error creating vendor profile:", error);
    throw error;
  }
};

// Create or update an expert profile
export const createExpertProfile = async (
  userId: string,
  profileData: Partial<ExpertProfile>
): Promise<string> => {
  try {
    // First update the user's roles
    await updateUserProfile(userId, {
      roles: { isExpert: true },
    });

    // Then create/update the expert profile
    const expertRef = doc(db, "expertProfiles", userId);
    const now = serverTimestamp();

    await setDoc(
      expertRef,
      {
        userId,
        verificationStatus: "pending",
        createdAt: now,
        updatedAt: now,
        ...profileData,
      },
      { merge: true }
    );

    debug("Firebase", `Expert profile created/updated for ${userId}`);
    return userId;
  } catch (error) {
    console.error("Error creating expert profile:", error);
    throw error;
  }
};

// Get a vendor profile
export const getVendorProfile = async (
  userId: string
): Promise<VendorProfile | null> => {
  try {
    const vendorRef = doc(db, "vendorProfiles", userId);
    const vendorDoc = await getDoc(vendorRef);

    if (vendorDoc.exists()) {
      return vendorDoc.data() as VendorProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting vendor profile:", error);
    return null;
  }
};

// Get an expert profile
export const getExpertProfile = async (
  userId: string
): Promise<ExpertProfile | null> => {
  try {
    const expertRef = doc(db, "expertProfiles", userId);
    const expertDoc = await getDoc(expertRef);

    if (expertDoc.exists()) {
      return expertDoc.data() as ExpertProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting expert profile:", error);
    return null;
  }
};

// Update vendor verification status
export const updateVendorVerificationStatus = async (
  userId: string,
  status: "pending" | "approved" | "rejected",
  adminNotes?: string
): Promise<void> => {
  try {
    const vendorRef = doc(db, "vendorProfiles", userId);
    await updateDoc(vendorRef, {
      verificationStatus: status,
      adminNotes: adminNotes || "",
      updatedAt: serverTimestamp(),
    });

    debug(
      "Firebase",
      `Vendor verification status updated for ${userId}: ${status}`
    );
  } catch (error) {
    console.error("Error updating vendor verification status:", error);
    throw error;
  }
};

// Update expert verification status
export const updateExpertVerificationStatus = async (
  userId: string,
  status: "pending" | "approved" | "rejected",
  adminNotes?: string
): Promise<void> => {
  try {
    const expertRef = doc(db, "expertProfiles", userId);
    await updateDoc(expertRef, {
      verificationStatus: status,
      adminNotes: adminNotes || "",
      updatedAt: serverTimestamp(),
    });

    debug(
      "Firebase",
      `Expert verification status updated for ${userId}: ${status}`
    );
  } catch (error) {
    console.error("Error updating expert verification status:", error);
    throw error;
  }
};

// Get all vendor profiles with a specific verification status
export const getVendorProfilesByStatus = async (
  status: "pending" | "approved" | "rejected"
): Promise<VendorProfile[]> => {
  try {
    const vendorsQuery = query(
      collection(db, "vendorProfiles"),
      where("verificationStatus", "==", status)
    );

    const vendorSnapshot = await getDocs(vendorsQuery);
    const vendors: VendorProfile[] = [];

    vendorSnapshot.forEach((doc) => {
      vendors.push({ id: doc.id, ...doc.data() } as VendorProfile & {
        id: string;
      });
    });

    return vendors;
  } catch (error) {
    console.error("Error getting vendor profiles:", error);
    return [];
  }
};

// Get all expert profiles with a specific verification status
export const getExpertProfilesByStatus = async (
  status: "pending" | "approved" | "rejected"
): Promise<ExpertProfile[]> => {
  try {
    const expertsQuery = query(
      collection(db, "expertProfiles"),
      where("verificationStatus", "==", status)
    );

    const expertSnapshot = await getDocs(expertsQuery);
    const experts: ExpertProfile[] = [];

    expertSnapshot.forEach((doc) => {
      experts.push({ id: doc.id, ...doc.data() } as ExpertProfile & {
        id: string;
      });
    });

    return experts;
  } catch (error) {
    console.error("Error getting expert profiles:", error);
    return [];
  }
};

// Author role application functions
export const submitAuthorApplication = async (
  userId: string,
  applicationData: {
    credentials: string;
    expertiseAreas: string[];
    sampleWriting: string;
    motivation: string;
  }
) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();

    // Create the application document with userId as the document ID
    await setDoc(doc(db, "authorApplications", userId), {
      userId,
      name: userData.displayName || "Anonymous",
      email: userData.email,
      credentials: applicationData.credentials,
      expertiseAreas: applicationData.expertiseAreas,
      sampleWriting: applicationData.sampleWriting,
      motivation: applicationData.motivation,
      verificationStatus: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error submitting author application:", error);
    throw error;
  }
};

export const getAuthorApplication = async (userId: string) => {
  try {
    const q = query(
      collection(db, "authorApplications"),
      where("userId", "==", userId),
      orderBy("submittedAt", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error("Error getting author application:", error);
    throw error;
  }
};

export const checkAuthorStatus = async (userId: string) => {
  try {
    const applicationRef = doc(db, "authorApplications", userId);
    const applicationDoc = await getDoc(applicationRef);

    if (!applicationDoc.exists()) return null;

    const applicationData = applicationDoc.data();
    return applicationData.verificationStatus || null;
  } catch (error) {
    console.error("Error checking author status:", error);
    return null;
  }
};

// Article management functions
export const createArticle = async (
  authorId: string,
  articleData: {
    title: string;
    content: string;
    category: string;
    tags: string[];
    isMonetized: boolean;
    price?: number;
    excerpt?: string;
  }
) => {
  try {
    const userRef = doc(db, "users", authorId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();

    const articleRef = await addDoc(collection(db, "articles"), {
      authorId,
      authorName: userData.displayName || "Anonymous",
      authorEmail: userData.email,
      title: articleData.title,
      content: articleData.content,
      category: articleData.category,
      tags: articleData.tags,
      isMonetized: articleData.isMonetized,
      price: articleData.price || 0,
      excerpt: articleData.excerpt || "",
      status: "published",
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      viewCount: 0,
      purchaseCount: 0,
      rating: 0,
      reviewCount: 0,
    });

    return { success: true, articleId: articleRef.id };
  } catch (error) {
    console.error("Error creating article:", error);
    throw error;
  }
};

export const getArticlesByAuthor = async (authorId: string) => {
  try {
    const q = query(
      collection(db, "articles"),
      where("authorId", "==", authorId),
      orderBy("publishedAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting articles by author:", error);
    throw error;
  }
};

export const getAllArticles = async () => {
  try {
    const q = query(
      collection(db, "articles"),
      where("status", "==", "published"),
      orderBy("publishedAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting all articles:", error);
    throw error;
  }
};

export const getArticle = async (articleId: string) => {
  try {
    const articleRef = doc(db, "articles", articleId);
    const articleDoc = await getDoc(articleRef);

    if (!articleDoc.exists()) {
      throw new Error("Article not found");
    }

    return { id: articleDoc.id, ...articleDoc.data() };
  } catch (error) {
    console.error("Error getting article:", error);
    throw error;
  }
};

export const purchaseArticle = async (userId: string, articleId: string) => {
  try {
    // Check if user already purchased
    const purchaseRef = doc(db, "articlePurchases", `${userId}_${articleId}`);
    const purchaseDoc = await getDoc(purchaseRef);

    if (purchaseDoc.exists()) {
      return { success: true, alreadyPurchased: true };
    }

    // Get article details
    const articleRef = doc(db, "articles", articleId);
    const articleDoc = await getDoc(articleRef);

    if (!articleDoc.exists()) {
      throw new Error("Article not found");
    }

    const articleData = articleDoc.data();
    const price = articleData.price || 0;

    // Create purchase record
    await setDoc(purchaseRef, {
      userId,
      articleId,
      price,
      purchasedAt: serverTimestamp(),
    });

    // Update article purchase count
    await updateDoc(articleRef, {
      purchaseCount: increment(1),
    });

    // Update author earnings (80% of price, 20% admin commission)
    const authorEarnings = price * 0.8;
    const adminCommission = price * 0.2;

    // Update author's earnings
    const authorEarningsRef = doc(db, "authorEarnings", articleData.authorId);
    await setDoc(
      authorEarningsRef,
      {
        authorId: articleData.authorId,
        totalEarnings: increment(authorEarnings),
        totalCommission: increment(adminCommission),
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );

    // Create earnings transaction record
    await addDoc(collection(db, "earningsTransactions"), {
      authorId: articleData.authorId,
      articleId,
      articleTitle: articleData.title,
      purchasePrice: price,
      authorEarnings,
      adminCommission,
      transactionDate: serverTimestamp(),
      type: "article_purchase",
    });

    return { success: true, alreadyPurchased: false };
  } catch (error) {
    console.error("Error purchasing article:", error);
    throw error;
  }
};

export const checkArticlePurchase = async (
  userId: string,
  articleId: string
) => {
  try {
    const purchaseRef = doc(db, "articlePurchases", `${userId}_${articleId}`);
    const purchaseDoc = await getDoc(purchaseRef);
    return purchaseDoc.exists();
  } catch (error) {
    console.error("Error checking article purchase:", error);
    return false;
  }
};

// Author Application Interface
export interface AuthorApplication {
  userId: string;
  name: string;
  email: string;
  credentials: string;
  expertiseAreas: string[];
  sampleWriting: string;
  motivation: string;
  verificationStatus: "pending" | "approved" | "rejected";
  verificationDocuments?: string[];
  adminNotes?: string;
  rejectionReason?: string;
  createdAt: any;
  updatedAt: any;
}

// Get author applications by status
export const getAuthorApplicationsByStatus = async (
  status: "pending" | "approved" | "rejected"
): Promise<AuthorApplication[]> => {
  try {
    const applicationsRef = collection(db, "authorApplications");
    const q = query(applicationsRef, where("verificationStatus", "==", status));
    const querySnapshot = await getDocs(q);

    const applications: AuthorApplication[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      applications.push({
        id: doc.id,
        userId: data.userId,
        name: data.name,
        email: data.email,
        credentials: data.credentials,
        expertiseAreas: data.expertiseAreas,
        sampleWriting: data.sampleWriting,
        motivation: data.motivation,
        verificationStatus: data.verificationStatus,
        verificationDocuments: data.verificationDocuments,
        adminNotes: data.adminNotes,
        rejectionReason: data.rejectionReason,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as AuthorApplication);
    });

    // Sort by creation date, newest first
    applications.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    return applications;
  } catch (error) {
    console.error("Error getting author applications by status:", error);
    return [];
  }
};

// Update author application status
export const updateAuthorApplicationStatus = async (
  userId: string,
  status: "pending" | "approved" | "rejected",
  adminNotes?: string,
  rejectionReason?: string
): Promise<void> => {
  try {
    const applicationRef = doc(db, "authorApplications", userId);
    const now = serverTimestamp();

    const updateData: any = {
      verificationStatus: status,
      updatedAt: now,
    };

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await updateDoc(applicationRef, updateData);

    // If approved, update user profile to include author role
    if (status === "approved") {
      await updateUserProfile(userId, {
        roles: { isAuthor: true },
      });
    }

    debug(
      "Firebase",
      `Author application ${userId} status updated to ${status}`
    );
  } catch (error) {
    console.error("Error updating author application status:", error);
    throw error;
  }
};

// Article Comments and Ratings functions
export const addArticleComment = async (
  articleId: string,
  userId: string,
  comment: string
) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    const commentRef = await addDoc(collection(db, "articleComments"), {
      articleId,
      userId,
      userName: userData?.displayName || "Anonymous",
      userEmail: userData?.email,
      comment,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update article comment count
    const articleRef = doc(db, "articles", articleId);
    await updateDoc(articleRef, {
      commentCount: increment(1),
    });

    return { success: true, commentId: commentRef.id };
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

export const getArticleComments = async (articleId: string) => {
  try {
    const commentsRef = collection(db, "articleComments");
    const q = query(
      commentsRef,
      where("articleId", "==", articleId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting comments:", error);
    throw error;
  }
};

export const addArticleRating = async (
  articleId: string,
  userId: string,
  rating: number,
  review?: string
) => {
  try {
    // Check if user already rated this article
    const ratingRef = doc(db, "articleRatings", `${userId}_${articleId}`);
    const ratingDoc = await getDoc(ratingRef);

    const ratingData: any = {
      articleId,
      userId,
      rating,
      review: review || "",
      updatedAt: serverTimestamp(),
    };

    if (ratingDoc.exists()) {
      // Update existing rating
      await updateDoc(ratingRef, ratingData);
    } else {
      // Create new rating
      ratingData.createdAt = serverTimestamp();
      await setDoc(ratingRef, ratingData);
    }

    // Update article average rating
    await updateArticleAverageRating(articleId);

    return { success: true };
  } catch (error) {
    console.error("Error adding rating:", error);
    throw error;
  }
};

export const getArticleRating = async (articleId: string, userId: string) => {
  try {
    const ratingRef = doc(db, "articleRatings", `${userId}_${articleId}`);
    const ratingDoc = await getDoc(ratingRef);

    if (ratingDoc.exists()) {
      return ratingDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting rating:", error);
    return null;
  }
};

export const getArticleAverageRating = async (articleId: string) => {
  try {
    const ratingsRef = collection(db, "articleRatings");
    const q = query(ratingsRef, where("articleId", "==", articleId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { averageRating: 0, totalRatings: 0 };
    }

    const ratings = snapshot.docs.map((doc) => doc.data().rating);
    const averageRating =
      ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalRatings: ratings.length,
    };
  } catch (error) {
    console.error("Error getting average rating:", error);
    return { averageRating: 0, totalRatings: 0 };
  }
};

const updateArticleAverageRating = async (articleId: string) => {
  try {
    const { averageRating, totalRatings } = await getArticleAverageRating(
      articleId
    );

    const articleRef = doc(db, "articles", articleId);
    await updateDoc(articleRef, {
      rating: averageRating,
      reviewCount: totalRatings,
    });
  } catch (error) {
    console.error("Error updating article average rating:", error);
  }
};

// Author Profile functions
export const getAuthorProfile = async (authorId: string) => {
  try {
    const userRef = doc(db, "users", authorId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("Author not found");
    }

    const userData = userDoc.data();

    // Get author's articles
    const articlesRef = collection(db, "articles");
    const q = query(articlesRef, where("authorId", "==", authorId));
    const articlesSnapshot = await getDocs(q);
    const articles = articlesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Calculate author stats
    const totalViews = articles.reduce(
      (sum, article) => sum + (article.viewCount || 0),
      0
    );
    const totalPurchases = articles.reduce(
      (sum, article) => sum + (article.purchaseCount || 0),
      0
    );
    const totalEarnings = articles.reduce((sum, article) => {
      if (article.isMonetized && article.purchaseCount) {
        return sum + (article.price || 0) * (article.purchaseCount || 0) * 0.8;
      }
      return sum;
    }, 0);

    return {
      id: authorId,
      displayName: userData.displayName || "Anonymous",
      email: userData.email,
      bio: userData.bio || "",
      expertise: userData.expertise || [],
      institution: userData.institution || "",
      website: userData.website || "",
      socialLinks: userData.socialLinks || {},
      profileImage: userData.photoURL || "",
      articles: articles,
      stats: {
        totalArticles: articles.length,
        totalViews,
        totalPurchases,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        averageRating:
          articles.length > 0
            ? articles.reduce(
                (sum, article) => sum + (article.rating || 0),
                0
              ) / articles.length
            : 0,
      },
    };
  } catch (error) {
    console.error("Error getting author profile:", error);
    throw error;
  }
};

export const updateAuthorProfile = async (
  authorId: string,
  profileData: {
    bio?: string;
    expertise?: string[];
    institution?: string;
    website?: string;
    socialLinks?: {
      twitter?: string;
      linkedin?: string;
      researchGate?: string;
    };
  }
) => {
  try {
    const userRef = doc(db, "users", authorId);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating author profile:", error);
    throw error;
  }
};
