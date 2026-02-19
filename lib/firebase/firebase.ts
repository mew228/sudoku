import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://sudoku-fb1a9-default-rtdb.firebaseio.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
let app: FirebaseApp | undefined;
let db: Database | undefined;
let auth: Auth | undefined;

try {
    if (firebaseConfig.apiKey) {
        console.log("Initializing Firebase with config:", {
            ...firebaseConfig,
            apiKey: "HIDDEN" // Hide sensitive key in logs
        });
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        db = getDatabase(app);
        auth = getAuth(app);
        console.log("Firebase initialized successfully. DB URL:", db.app.options.databaseURL);
    } else {
        // During build or if not configured, these might be accessed.
        // If accessed, they will throw or be undefined.
        console.warn("Firebase config missing. Firebase features will not work.");
    }
} catch (e) {
    console.warn("Firebase initialization failed:", e);
}

export { app, db, auth };
