import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { initializeFirestore, doc, getDocFromServer, collection, setDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import firebaseConfig from "../../firebase-applet-config.json";

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, (firebaseConfig as any).firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export let isCloudConnected = false;
let onCloudStatusChange: (status: boolean) => void = () => {};

export const subscribeToCloudStatus = (callback: (status: boolean) => void) => {
  onCloudStatusChange = callback;
  callback(isCloudConnected);
};

/**
 * Validates connection to Firestore on initialization
 */
async function testConnection() {
  try {
    // Only attempt if we have a config
    if (firebaseConfig && firebaseConfig.projectId) {
      await getDocFromServer(doc(db, '_vanti_health', 'check'));
      isCloudConnected = true;
      onCloudStatusChange(true);
      console.log("Firebase connection verified");
    }
  } catch (error) {
    if (error instanceof Error) {
      const isUnavailable = error.message.includes('unavailable') || error.message.includes('the client is offline');
      isCloudConnected = !isUnavailable;
      onCloudStatusChange(isCloudConnected);
      
      if (isUnavailable) {
        console.error("Firebase connection failed: Backend is unreachable. Please check project status or network.");
      } else {
        // Permission denied is expected for this specific test path, just ensures connectivity
        isCloudConnected = true;
        onCloudStatusChange(true);
        console.log("Firebase connectivity check reached backend (status expected)");
      }
    }
  }
}

testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Firebase login failed", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Firebase logout failed", error);
        throw error;
    }
};

// Messaging Setup
let messaging: Messaging | null = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (err) {
  console.warn("Firebase Messaging initialization suppressed:", err);
}

export { messaging, getToken, onMessage };
