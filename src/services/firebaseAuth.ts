import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  persistentLocalCache,
  persistentSingleTabManager,
  memoryLocalCache,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Matikan log internal verbose SDK jika koneksi cloud backend sedang offline/unreachable
try {
  setLogLevel('silent');
} catch {
  // abaikan
}

export const CUSTOM_FIREBASE_CONFIG_KEY = 'sipartan_custom_firebase_config_v1';

export interface FirebaseClientConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

export function getActiveFirebaseConfig(): FirebaseClientConfig {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CUSTOM_FIREBASE_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.projectId && parsed?.apiKey) {
          // Jika proyek di storage berbeda dengan konfigurasi aktif bawaan (bahan-ajar-guru), bersihkan residu lama
          if (parsed.projectId === (firebaseConfig as any).projectId) {
            return parsed;
          } else {
            localStorage.removeItem(CUSTOM_FIREBASE_CONFIG_KEY);
          }
        }
      }
    } catch {}
  }
  return firebaseConfig as FirebaseClientConfig;
}

export function saveCustomFirebaseConfig(config: FirebaseClientConfig): void {
  try {
    localStorage.setItem(CUSTOM_FIREBASE_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Gagal menyimpan konfigurasi kustom Firebase:', e);
  }
}

export function clearCustomFirebaseConfig(): void {
  try {
    localStorage.removeItem(CUSTOM_FIREBASE_CONFIG_KEY);
  } catch {}
}

const activeConfig = getActiveFirebaseConfig();

export const app = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

/**
 * Memastikan sesi autentikasi Firebase siap (Anonymous Auth / Google Auth).
 * Sangat penting agar seluruh pembacaan dan penulisan Firestore multi-perangkat berjalan 100% tanpa terblokir Rules.
 */
export async function ensureFirebaseAuth(): Promise<User | null> {
  try {
    if (auth.currentUser) return auth.currentUser;
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    return auth.currentUser || null;
  }
}

// Jalankan autentikasi otomatis di latar belakang saat aplikasi dimuat
if (typeof window !== 'undefined') {
  ensureFirebaseAuth().catch(() => {});
}

// Bersihkan residu firestore_mutations_ dari localStorage yang ditinggalkan oleh multi-tab manager lama
// agar tidak melebihi kuota 5MB browser
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('firestore_mutations_') || k.startsWith('firestore_clients_') || k.startsWith('firestore_'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

// Inisialisasi Cloud Firestore standar & andal untuk multi-tab, multi-device, dan multi-user
let firestoreInstance;
try {
  firestoreInstance = getFirestore(app);
} catch {
  try {
    firestoreInstance = initializeFirestore(app, {});
  } catch {
    firestoreInstance = getFirestore(app);
  }
}
export const db = firestoreInstance;

const provider = new GoogleAuthProvider();
// Workspace scopes for Google Forms and Drive
provider.addScope('https://www.googleapis.com/auth/forms.body');
provider.addScope('https://www.googleapis.com/auth/forms.responses.readonly');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token will be acquired upon signInWithPopup
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal memperoleh access token dari Google OAuth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
