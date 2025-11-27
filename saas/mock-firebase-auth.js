/**
 * Mock Firebase Authentication for Testing
 * Simulates Firebase authentication flow without actual Firebase connection
 */

// Mock Firebase user object
class MockFirebaseUser {
  constructor(email, uid, displayName) {
    this.email = email;
    this.uid = uid || `uid_${Math.random().toString(36).substring(2, 10)}`;
    this.displayName = displayName || email.split('@')[0];
    this.emailVerified = true;
    this.isAnonymous = false;
    this.tenantId = null;
    this.providerData = [{
      providerId: 'mock-provider',
      uid: this.uid,
      displayName: this.displayName,
      email: this.email
    }];
  }
}

// Mock Firebase Authentication service
class MockFirebaseAuth {
  constructor() {
    this.currentUser = null;
    this.mockUsers = new Map();
  }

  // Simulate creating a new user
  async createUserWithEmailAndPassword(email, password) {
    if (this.mockUsers.has(email)) {
      throw new Error('User already exists');
    }
    
    const user = new MockFirebaseUser(email);
    this.mockUsers.set(email, { user, password });
    this.currentUser = user;
    
    return {
      user: user,
      additionalUserInfo: {
        isNewUser: true
      }
    };
  }

  // Simulate signing in with email and password
  async signInWithEmailAndPassword(email, password) {
    const userRecord = this.mockUsers.get(email);
    if (!userRecord) {
      throw new Error('User not found');
    }
    
    if (userRecord.password !== password) {
      throw new Error('Invalid password');
    }
    
    this.currentUser = userRecord.user;
    
    return {
      user: this.currentUser,
      additionalUserInfo: {
        isNewUser: false
      }
    };
  }

  // Simulate Google sign-in
  async signInWithPopup(provider) {
    // In a real implementation, this would open a popup
    // For mocking, we'll simulate a Google user
    const email = 'mockuser@gmail.com';
    const displayName = 'Mock User';
    
    let user;
    if (this.mockUsers.has(email)) {
      user = this.mockUsers.get(email).user;
    } else {
      user = new MockFirebaseUser(email, null, displayName);
      this.mockUsers.set(email, { user, password: 'google-auth' });
    }
    
    this.currentUser = user;
    
    return {
      user: this.currentUser,
      additionalUserInfo: {
        isNewUser: !this.mockUsers.has(email),
        providerId: 'google.com'
      }
    };
  }

  // Simulate signing out
  async signOut() {
    this.currentUser = null;
  }

  // Simulate onAuthStateChanged listener
  onAuthStateChanged(callback) {
    // Immediately call with current user state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {};
  }

  // Simulate getting current user ID token
  async getCurrentUserToken() {
    if (!this.currentUser) {
      throw new Error('No user signed in');
    }
    
    // Generate a mock token
    return `mock-token-${this.currentUser.uid}-${Date.now()}`;
  }
}

// Mock Google Auth Provider
class MockGoogleAuthProvider {
  constructor() {
    this.providerId = 'google.com';
  }
  
  addScope(scope) {
    // Mock method
  }
  
  setCustomParameters(params) {
    // Mock method
  }
}

// Export mock classes
module.exports = {
  MockFirebaseAuth,
  MockGoogleAuthProvider,
  MockFirebaseUser
};