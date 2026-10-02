/**
 * Type declarations for Firebase modular SDK packages.
 * Provides complete typing for firebase/app, firebase/firestore, and firebase/auth.
 */

declare module 'firebase/app' {
  export interface FirebaseApp {
    name: string;
    options: Record<string, any>;
  }
  export function initializeApp(options: Record<string, any>, name?: string): FirebaseApp;
  export function getApps(): FirebaseApp[];
  export function getApp(name?: string): FirebaseApp;
}

declare module 'firebase/firestore' {
  export interface Firestore {
    type: string;
    app: any;
  }
  export interface DocumentData {
    [field: string]: any;
  }
  export interface Timestamp {
    seconds: number;
    nanoseconds: number;
    toDate(): Date;
    toMillis(): number;
  }
  export interface FieldValue {
    isEqual(other: FieldValue): boolean;
  }
  export interface DocumentReference<T = DocumentData> {
    id: string;
    path: string;
  }
  export interface QueryConstraint {
    type: string;
  }
  export function getFirestore(app?: any): Firestore;
  export function collection(firestore: Firestore, path: string, ...pathSegments: string[]): any;
  export function doc(firestore: Firestore, path: string, ...pathSegments: string[]): any;
  export function addDoc(reference: any, data: any): Promise<DocumentReference>;
  export function getDoc(reference: any): Promise<any>;
  export function getDocs(query: any): Promise<any>;
  export function updateDoc(reference: any, data: any): Promise<void>;
  export function deleteDoc(reference: any): Promise<void>;
  export function query(query: any, ...queryConstraints: QueryConstraint[]): any;
  export function where(fieldPath: string, opStr: any, value: any): QueryConstraint;
  export function limit(limit: number): QueryConstraint;
  export function serverTimestamp(): FieldValue;
}

declare module 'firebase/auth' {
  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
  }
  export interface UserCredential {
    user: User;
  }
  export interface Auth {
    app: any;
    currentUser: User | null;
  }
  export function getAuth(app?: any): Auth;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function signOut(auth: Auth): Promise<void>;
  export function onAuthStateChanged(
    auth: Auth,
    nextOrObserver: (user: User | null) => void,
    error?: (error: any) => void,
    completed?: () => void
  ): () => void;
}
