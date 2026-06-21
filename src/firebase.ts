import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase once
const app = initializeApp(firebaseConfig);

// Initialize App Check with reCAPTCHA Enterprise
// The site key can be configured via environment variables or falls back to 'YOUR_RECAPTCHA_ENTERPRISE_SITE_KEY'
const recaptchaSiteKey = (import.meta as any).env?.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY || 'YOUR_RECAPTCHA_ENTERPRISE_SITE_KEY';

let appCheckInstance: any = null;

if (recaptchaSiteKey && recaptchaSiteKey !== 'YOUR_RECAPTCHA_ENTERPRISE_SITE_KEY') {
  try {
    // Enable debug provider in local and AI Studio preview containers
    if (typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('ais-dev') ||
      window.location.hostname.includes('ais-pre') ||
      window.location.hostname.includes('run.app')
    )) {
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true, // Keeps tokens fresh automatically
    });
    console.log('Firebase App Check successfully initialized.');
  } catch (error) {
    console.warn('Firebase App Check failed to initialize:', error);
  }
} else {
  console.info('Firebase App Check skipped: using default or missing site key.');
}

export const appCheck = appCheckInstance;

// Initialize Firestore with custom Database ID from AI Studio
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable Offline Persistence for PWA Network Resilience
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore offline persistence failed-precondition (multiple tabs open)');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore offline persistence unimplemented (unsupported browser)');
    } else {
      console.warn('Firestore offline persistence error:', err);
    }
  });
}

// Initialize Firebase Auth with proper persistence to handle iframes smoothly
const isIframeTarget = typeof window !== 'undefined' ? (window.self !== window.top) : false;
export const auth = initializeAuth(app, {
  persistence: isIframeTarget ? inMemoryPersistence : [browserLocalPersistence, inMemoryPersistence]
});

// Standardized operation type for security diagnostics
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Error metadata payload for red-team analysis and runtime diagnostics
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

// Standardized handler to throw structured diagnostics if permissions fail
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
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
