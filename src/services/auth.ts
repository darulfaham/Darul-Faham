import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc } from './dataService';
import { INITIAL_USERS } from '../firebase/mockData';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'STUDENT';

export interface UserProfile {
  uid: string;
  role: UserRole;
  email: string;
  displayName: string;
  studentId?: string;
  permissions?: string[];
  avatarUrl?: string;
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  // Fallback to initial users
  const found = INITIAL_USERS.find((u) => u.uid === uid);
  return found || null;
};

// Security Check: Middleware-style helper
export const authorizeRole = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.includes(userRole);
};

// Active role / user session management
const ACTIVE_USER_KEY = 'darulfaham_active_user_v1';

export const getStoredActiveUser = (): UserProfile => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(ACTIVE_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
  }
  return INITIAL_USERS[0]; // Default to Super Admin
};

export const setStoredActiveUser = (user: UserProfile) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
  }
};
