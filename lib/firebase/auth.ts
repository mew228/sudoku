import { auth } from "./firebase";
import {
    signInAnonymously,
    onAuthStateChanged,
    User,
    updateProfile
} from "firebase/auth";

/**
 * Sign in anonymously and set a display name.
 */
export const signInUser = async (displayName: string) => {
    if (!auth) throw new Error("Firebase Auth not initialized");

    try {
        const userCredential = await signInAnonymously(auth);
        const user = userCredential.user;

        // Update profile with name if provided
        if (displayName && user) {
            await updateProfile(user, { displayName });
        }

        return user;
    } catch (error) {
        console.error("Auth error:", error);
        throw error;
    }
};

/**
 * Listen for auth state changes.
 */
export const listenToAuth = (callback: (user: User | null) => void) => {
    if (!auth) return () => { };
    return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = () => {
    if (!auth) return null;
    return auth.currentUser;
};
