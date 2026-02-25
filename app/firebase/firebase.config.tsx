"use client"
import { initializeApp, getApps, getApp } from "firebase/app";
import { createContext, useContext } from "react";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (guard against multiple initializations)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebasedb = getFirestore(app);

interface FirebaseContextType {
    testKey: string
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(
    undefined
);

export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (!context)
        throw new Error("useFirebase must be used within a FirebaseProvider");
    return context;
};

export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <FirebaseContext.Provider value={{ testKey: "testValue" }} >
            { children }
        </FirebaseContext.Provider>
    )
}