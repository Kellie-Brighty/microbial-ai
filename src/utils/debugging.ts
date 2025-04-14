/**
 * Debugging utilities for Microbial AI
 */

// Enable or disable verbose debugging
const DEBUG_ENABLED = true;

/**
 * Log debug messages to console with a prefix
 */
export const debug = (context: string, message: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[${context}] ${message}`, data !== undefined ? data : "");
  }
};

/**
 * Check Firebase configuration
 */
export const checkFirebaseConfig = () => {
  if (DEBUG_ENABLED) {
    const requiredKeys = [
      "VITE_FIREBASE_API_KEY",
      "VITE_FIREBASE_AUTH_DOMAIN",
      "VITE_FIREBASE_PROJECT_ID",
      "VITE_FIREBASE_STORAGE_BUCKET",
      "VITE_FIREBASE_MESSAGING_SENDER_ID",
      "VITE_FIREBASE_APP_ID",
    ];

    const missingKeys: string[] = [];
    requiredKeys.forEach((key) => {
      if (!import.meta.env[key]) {
        missingKeys.push(key);
      }
    });

    if (missingKeys.length > 0) {
      console.error("❌ Missing Firebase environment variables:", missingKeys);
    } else {
      console.log("✅ Firebase environment variables found");
    }

    // Check for obviously invalid values
    if (
      import.meta.env.VITE_FIREBASE_API_KEY === "your_firebase_api_key_here"
    ) {
      console.error("❌ Firebase API key has placeholder value");
    }
  }
};

/**
 * Initialize debugging
 */
export const initDebugging = () => {
  if (DEBUG_ENABLED) {
    console.log("🐛 Microbial AI Debug Mode Enabled");
    checkFirebaseConfig();
  }
};
