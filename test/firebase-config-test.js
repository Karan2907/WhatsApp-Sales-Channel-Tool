// Test the Firebase configuration
console.log('Testing Firebase configuration...');

try {
  // Test importing the updated firebase-config
  const firebaseConfig = require('../saas/firebase-config');
  console.log('Firebase config module loaded successfully');
  console.log('Firebase app:', !!firebaseConfig.firebaseApp);
  console.log('Firestore:', !!firebaseConfig.firestore);
  console.log('Auth:', !!firebaseConfig.auth);
  
  if (firebaseConfig.firebaseApp) {
    console.log('Firebase Admin SDK initialized successfully');
  } else {
    console.log('Firebase Admin SDK not initialized (might be running in browser environment)');
  }
} catch (error) {
  console.error('Error loading Firebase configuration:', error.message);
  console.error('Stack trace:', error.stack);
}