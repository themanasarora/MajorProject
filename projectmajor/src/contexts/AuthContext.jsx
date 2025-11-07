// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  onAuthStateChanged,
  onIdTokenChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  getIdTokenResult,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // firebase user object
  const [userData, setUserData] = useState(null); // merged profile + claims
  const [loading, setLoading] = useState(true);

  // Helper: load Firestore profile & token claims and merge them
  const loadUserData = async (firebaseUser) => {
    if (!firebaseUser) {
      setUserData(null);
      return;
    }

    try {
      // Fetch Firestore user doc (if exists)
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      const profileData = userDocSnap.exists() ? userDocSnap.data() : null;

      // Get token claims (role, etc.)
      let claims = {};
      try {
        const idTokenResult = await getIdTokenResult(firebaseUser, /* forceRefresh */ false);
        claims = idTokenResult?.claims || {};
      } catch (err) {
        console.warn("Failed to get token claims:", err);
      }

      // Build merged userData
      const merged = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || null,
        name: firebaseUser.displayName || (profileData?.name ?? firebaseUser.email?.split("@")[0]) || "",
        // prefer Firestore role, else token claim role, else undefined (do NOT set default role on client)
        role: (profileData && profileData.role) || claims.role || undefined,
        grade: (profileData && profileData.grade) || undefined,
        // attach raw profile for use later
        profile: profileData || null,
        claims
      };

      setUserData(merged);
    } catch (error) {
      console.error("Error loading user data:", error);
      // fallback to basic userData but without sensitive defaults
      setUserData({
        uid: firebaseUser.uid,
        email: firebaseUser.email || null,
        name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "",
        role: undefined,
        grade: undefined,
        profile: null,
        claims: {}
      });
    }
  };

  // Force refresh ID token (useful after Admin updates custom claims)
  const refreshToken = async () => {
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.getIdToken(true); // force refresh
      await loadUserData(auth.currentUser);
    } catch (err) {
      console.error("Failed to refresh token:", err);
    }
  };

  useEffect(() => {
    // Listen to auth state changes
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserData(currentUser);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    // Also listen to idToken changes: this will fire when custom claims are changed
    const unsubIdToken = onIdTokenChanged(auth, async (currentUser) => {
      if (currentUser) {
        await loadUserData(currentUser);
      }
    });

    return () => {
      unsubAuth();
      unsubIdToken();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Email/password login
  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  // Email/password signup
  const signup = (email, password) => createUserWithEmailAndPassword(auth, email, password);

  // Google login
  const googleLogin = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
  };

  // Update userData from Firestore (useful after profile change)
  const updateUserData = async (userId) => {
    if (!userId) return;
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        // Refresh local merged data (merge existing claims if any)
        const profileData = userDoc.data();
        setUserData((prev) => ({
          ...(prev || {}),
          uid: userId,
          email: prev?.email || null,
          name: profileData.name || prev?.name || "",
          role: profileData.role || prev?.role,
          grade: profileData.grade || prev?.grade,
          profile: profileData
        }));
      }
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  const value = {
    user, // firebase user
    userData, // merged profile + claims
    login,
    signup,
    googleLogin,
    logout,
    updateUserData,
    refreshToken,
    loading
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
