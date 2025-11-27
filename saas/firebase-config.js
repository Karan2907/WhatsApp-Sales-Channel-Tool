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
    const path = require('path');
    
    // Initialize Firebase Admin SDK with service account key
    if (!admin.apps.length) {
      let credential;
      
      // Check if running on Vercel (environment variable exists)
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        console.log('[Firebase] Loading credentials from environment variable');
        try {
          const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
          credential = admin.credential.cert(serviceAccount);
        } catch (error) {
          console.error('[Firebase] Error parsing credentials:', error);
          throw new Error('Invalid Firebase credentials in environment variable');
        }
      } else {
        // Running locally - load from file
        console.log('[Firebase] Loading credentials from file');
        const serviceAccountPath = path.join(__dirname, '..', 'whatsapp-sales-channel-firebase-adminsdk-fbsvc-3e1b66c787.json');
        credential = admin.credential.cert(require(serviceAccountPath));
      }
      
      firebaseApp = admin.initializeApp({
        credential: credential,
        projectId: "whatsapp-sales-channel",
        storageBucket: "whatsapp-sales-channel.firebasestorage.app"
      });
      
      console.log('[Firebase] Admin SDK initialized successfully');
    } else {
      firebaseApp = admin.app();
    }
    
    // Initialize Firestore
    firestore = admin.firestore();
    
    // Initialize Auth
    auth = admin.auth();
  }
} catch (error) {
  console.error('[Firebase] Initialization error:', error);
  console.warn('Firebase Admin SDK not available:', error.message);
}

// Export Firebase services
module.exports = {
  firebaseApp,
  firestore,
  auth
};