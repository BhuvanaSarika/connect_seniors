'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { AppUser, RollNumberRange } from '@/types';
import { validateRollNumber, DEFAULT_ROLL_NUMBER_RANGES } from '@/lib/rollNumberValidator';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  register: (rollNumber: string, displayName: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
  register: async () => {},
  login: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setAppUser(userDoc.data() as AppUser);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const fetchRanges = async (): Promise<RollNumberRange[]> => {
    const snapshot = await getDocs(collection(db, 'rollNumberRanges'));
    if (snapshot.empty) {
      return DEFAULT_ROLL_NUMBER_RANGES.map((r, i) => ({ ...r, id: `default_${i}` }));
    }
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RollNumberRange));
  };

  const register = async (rollNumber: string, displayName: string, email: string, password: string) => {
    const ranges = await fetchRanges();
    const validation = validateRollNumber(rollNumber, ranges);

    if (!validation) {
      throw new Error('Invalid roll number. You are not authorized to register.');
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const newUser: AppUser = {
      uid: cred.user.uid,
      rollNumber: rollNumber.toUpperCase().trim(),
      displayName,
      email,
      role: validation.role,
      createdAt: Timestamp.now(),
    };

    await setDoc(doc(db, 'users', cred.user.uid), newUser);
    setAppUser(newUser);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setAppUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
