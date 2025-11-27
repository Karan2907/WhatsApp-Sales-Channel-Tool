/**
 * Firebase Configuration for SaaS version
 * Handles Firebase initialization and service configuration
 */

// Initialize Firebase
let firebaseApp = null;
let firestore = null;
let auth = null;

try {
  // Only initialize if we're in a server environment
  if (typeof window === 'undefined') {
    const admin = require('firebase-admin');
    
    // Initialize Firebase Admin SDK with service account key
    if (!admin.apps.length) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert("D:\\WhatsApp Sales Channel\\whatsapp-sales-channel-firebase-adminsdk-fbsvc-3e1b66c787.json"),
        projectId: "whatsapp-sales-channel",
        storageBucket: "whatsapp-sales-channel.firebasestorage.app"
      });
    } else {
      firebaseApp = admin.app();
    }
    
    // Initialize Firestore
    firestore = admin.firestore();
    
    // Initialize Auth
    auth = admin.auth();
  }
} catch (error) {
  console.warn('Firebase Admin SDK not available:', error.message);
}

// Export Firebase services
module.exports = {
  firebaseApp,
  firestore,
  auth
};