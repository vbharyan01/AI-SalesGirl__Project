import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAc6f7ARxwCISUZV-ds_rDLfYdz2Jcyo8o",
  authDomain: "ai-sales-agents-mvp.firebaseapp.com",
  projectId: "ai-sales-agents-mvp",
  storageBucket: "ai-sales-agents-mvp.firebasestorage.app",
  messagingSenderId: "733461320303",
  appId: "1:733461320303:web:c391e0e75bbafde67e339a",
  measurementId: "G-T3QPMRRM9G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
