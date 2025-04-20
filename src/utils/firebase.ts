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
} from "firebase/firestore";
import {
  getAuth,
  type Auth,
  type User,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword as firebaseCreateUser,
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  type FirebaseStorage,
} from "firebase/storage";
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

// Create a user profile in Firestore
export const createUserProfile = async (
  user: User,
  data: Record<string, any>
): Promise<void> => {
  if (!user) {
    debug("Firebase", "Cannot create profile: No user provided");
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      ...data,
    });
    debug("Firebase", "User profile created successfully");
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  data: Record<string, any>
): Promise<void> => {
  if (!userId) {
    debug("Firebase", "Cannot update profile: No user ID provided");
    return;
  }

  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, data);
    debug("Firebase", "User profile updated successfully");
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
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

// Helper function to convert date objects to Firestore timestamps

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

// Update conference
export const updateConference = async (
  conferenceId: string,
  data: Partial<Conference>
): Promise<void> => {
  try {
    const conferenceRef = doc(db, "conferences", conferenceId);
    await updateDoc(conferenceRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    debug("Firebase", "Conference updated successfully");
  } catch (error) {
    console.error("Error updating conference:", error);
    throw error;
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

// Add file upload function
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Add file upload function using Base64 encoding
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
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
  isFoodGiven: boolean
): Promise<boolean> => {
  try {
    const registrationRef = doc(db, "conferenceRegistrations", registrationId);
    await updateDoc(registrationRef, {
      foodDistributed: isFoodGiven,
      updatedAt: serverTimestamp(),
    });
    console.log(
      `Updated food status for registration ${registrationId} to ${isFoodGiven}`
    );
    return true;
  } catch (error) {
    console.error("Error updating registration food status:", error);
    return false;
  }
};

// Get all conferences organized by a specific user
export const getUserOrganizedConferences = async (
  userId: string
): Promise<Conference[]> => {
  try {
    console.log(`Fetching conferences organized by user: ${userId}`);
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

    // Sort by start time (newest first)
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

// Get all certificates issued to a user
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
