import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase"; // Make sure db is imported
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); // Additional user data from Firestore
  const [loading, setLoading] = useState(true);

  // Track Firebase authentication state and fetch user data from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Fetch additional user data from Firestore
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserData({
              uid: currentUser.uid,
              email: currentUser.email,
              ...userDoc.data()
            });
          } else {
            console.warn("No user data found in Firestore for:", currentUser.uid);
            // Set basic user data if no Firestore document exists
            setUserData({
              uid: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName || currentUser.email.split('@')[0],
              role: "student", // default role
              grade: "" // default empty grade
            });
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          // Fallback to basic user data
          setUserData({
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || currentUser.email.split('@')[0],
            role: "student",
            grade: ""
          });
        }
      } else {
        // User is signed out
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email/password login
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  // Email/password signup
  const signup = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  // Google login
  const googleLogin = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null); // Clear user data on logout
  };

  // Update user data (useful when user profile is updated)
  const updateUserData = async (userId) => {
    if (!userId) return;
    
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        setUserData({
          uid: userId,
          email: user?.email || "",
          ...userDoc.data()
        });
      }
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  const value = {
    // Authentication
    user,
    login,
    signup,
    googleLogin,
    logout,
    
    // User data from Firestore
    userData,
    updateUserData,
    
    // Loading state
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};