import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  type User as FirebaseUser 
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export const signInWithGoogle = async (): Promise<AuthUser> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Convert Firebase user to our app's user format
    const authUser: AuthUser = {
      id: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };

    // Send user data to our backend to create/update user
    await createOrUpdateUser(authUser);
    
    return authUser;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    // Clear local storage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("firebase_user");
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Helper function to create or update user in our backend
const createOrUpdateUser = async (user: AuthUser): Promise<void> => {
  try {
    const response = await fetch("/api/auth/firebase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid: user.id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create/update user in backend");
    }

    const data = await response.json();
    
    // Store the authentication token
    if (data.token) {
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("firebase_user", JSON.stringify(user));
    }
  } catch (error) {
    console.error("Backend user creation error:", error);
    throw error;
  }
};

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    localStorage.setItem("firebase_user", JSON.stringify({
      id: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    }));
  } else {
    // User is signed out
    localStorage.removeItem("firebase_user");
  }
});
