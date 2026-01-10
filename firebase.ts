import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Define globals that might be injected by the runtime
declare global {
  var __firebase_config: any;
  var __app_id: string | undefined;
}

const getFirebaseConfig = () => {
  let rawConfig;

  // 1. Try window object (browser runtime injection)
  if (typeof window !== 'undefined' && (window as any).__firebase_config) {
    rawConfig = (window as any).__firebase_config;
  }
  // 2. Try global variable (legacy injection)
  else if (typeof __firebase_config !== 'undefined') {
    rawConfig = __firebase_config;
  }
  // 3. Try process.env (modern bundlers)
  else if (typeof process !== 'undefined' && process.env && process.env.FIREBASE_CONFIG) {
    rawConfig = process.env.FIREBASE_CONFIG;
  }

  if (rawConfig) {
    try {
      return typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig;
    } catch (e) {
      console.warn("Failed to parse firebase config", e);
    }
  }

  // 4. Fallback (Will likely fail Auth but prevents immediate crash on load)
  console.warn("Using placeholder Firebase config. Auth will likely fail.");
  return {
    apiKey: "AIzaSyD-placeholder",
    authDomain: "mattress-hero.firebaseapp.com",
    projectId: "mattress-hero",
    storageBucket: "mattress-hero.appspot.com",
    messagingSenderId: "000000000",
    appId: "1:00000000:web:00000000"
  };
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Use a specific collection path or default
const getAppId = () => {
    if (typeof window !== 'undefined' && (window as any).__app_id) return (window as any).__app_id;
    if (typeof __app_id !== 'undefined') return __app_id;
    if (typeof process !== 'undefined' && process.env && process.env.APP_ID) return process.env.APP_ID;
    return 'mattress-hero';
}

export const APP_COLLECTION_ID = getAppId();