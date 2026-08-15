import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  FirebaseUser,
} from '../lib/firebase';
import { UserProfile, Friendship, FriendAccountabilityStats } from '../types';
import {
  getUserProfile,
  saveUserProfile,
  getFriendshipsForUser,
  getFriendAccountabilityStats,
  seedInitialUserDataIfNew,
  sendFriendRequest,
  respondToFriendRequest,
} from '../services/db';

// Predefined Demo Profiles for instant 2-friend testing
export const DEMO_FRIEND_1: UserProfile = {
  id: 'demo_user_alex',
  name: 'Alex Rivera',
  username: 'alex_dev',
  email: 'alex.rivera@example.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  timezone: 'America/New_York',
  inviteCode: 'ALEX99',
  bio: 'Full-stack builder • Crushing DSA & LeetCode • Consistency over intensity ⚡',
  githubUsername: 'alexrivera-dev',
  githubConnected: true,
  createdAt: Date.now() - 30 * 86400000,
  updatedAt: Date.now(),
};

export const DEMO_FRIEND_2: UserProfile = {
  id: 'demo_user_sam',
  name: 'Sam Chen',
  username: 'sam_code',
  email: 'sam.chen@example.com',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  timezone: 'America/Los_Angeles',
  inviteCode: 'SAM88',
  bio: 'Systems & Backend enthusiast • 100 Days of Code • Daily GitHub streak 🔥',
  githubUsername: 'samchen-systems',
  githubConnected: true,
  createdAt: Date.now() - 30 * 86400000,
  updatedAt: Date.now(),
};

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  user: UserProfile | null;
  loading: boolean;
  activeFriendship: Friendship | null;
  friendStats: FriendAccountabilityStats | null;
  allFriendships: Friendship[];
  isDemoMode: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  refreshFriendData: () => Promise<void>;
  switchDemoUser: (target: 'friend1' | 'friend2') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFriendship, setActiveFriendship] = useState<Friendship | null>(null);
  const [friendStats, setFriendStats] = useState<FriendAccountabilityStats | null>(null);
  const [allFriendships, setAllFriendships] = useState<Friendship[]>([]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const generateInviteCode = (name: string): string => {
    const prefix = name.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase();
    const rand = Math.floor(100 + Math.random() * 900);
    return `${prefix || 'DUO'}${rand}`;
  };

  const loadFriendData = useCallback(async (currentUserId: string) => {
    try {
      const friendships = await getFriendshipsForUser(currentUserId);
      setAllFriendships(friendships);

      // Find accepted friendship
      const accepted = friendships.find((f) => f.status === 'accepted');
      if (accepted) {
        setActiveFriendship(accepted);
        const friendId = accepted.requesterId === currentUserId ? accepted.receiverId : accepted.requesterId;
        const stats = await getFriendAccountabilityStats(friendId, currentUserId, accepted);
        setFriendStats(stats);
      } else {
        setActiveFriendship(null);
        setFriendStats(null);
      }
    } catch (err) {
      console.error('Error loading friend data:', err);
    }
  }, []);

  const syncProfile = useCallback(async (user: FirebaseUser | null, overrideProfile?: UserProfile) => {
    if (overrideProfile) {
      setProfile(overrideProfile);
      await saveUserProfile(overrideProfile);
      await seedInitialUserDataIfNew(overrideProfile);
      await loadFriendData(overrideProfile.id);
      setLoading(false);
      return;
    }

    if (!user) {
      setProfile(null);
      setActiveFriendship(null);
      setFriendStats(null);
      setLoading(false);
      return;
    }

    try {
      let existing = await getUserProfile(user.uid);
      if (!existing) {
        // Create initial profile
        const newProfile: UserProfile = {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Friend',
          username: (user.email?.split('@')[0] || 'friend').toLowerCase().replace(/[^a-z0-9_]/g, ''),
          email: user.email || '',
          avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          inviteCode: generateInviteCode(user.displayName || user.email || 'USER'),
          bio: 'Building consistent daily habits & sharing progress with my accountability partner.',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await saveUserProfile(newProfile);
        existing = newProfile;
      }

      setProfile(existing);
      await seedInitialUserDataIfNew(existing);
      await loadFriendData(existing.id);
    } catch (err) {
      console.error('Error syncing profile:', err);
    } finally {
      setLoading(false);
    }
  }, [loadFriendData]);

  useEffect(() => {
    // Check if demo user was active
    const savedDemo = localStorage.getItem('duotrack_demo_user');
    if (savedDemo === 'friend1' || savedDemo === 'friend2') {
      setIsDemoMode(true);
      const demoProf = savedDemo === 'friend1' ? DEMO_FRIEND_1 : DEMO_FRIEND_2;
      syncProfile(null, demoProf);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsDemoMode(false);
        localStorage.removeItem('duotrack_demo_user');
        await syncProfile(user);
      } else {
        // If not logged in and no demo, fallback to default demo Friend 1 for immediate preview delight
        const defaultProfile = DEMO_FRIEND_1;
        setIsDemoMode(true);
        localStorage.setItem('duotrack_demo_user', 'friend1');
        await syncProfile(null, defaultProfile);
      }
    });

    return () => unsubscribe();
  }, [syncProfile]);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('duotrack_demo_user');
      setIsDemoMode(false);
      const res = await signInWithPopup(auth, googleProvider);
      await syncProfile(res.user);
    } catch (err) {
      console.error('Google login error:', err);
      setLoading(false);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setLoading(true);
      localStorage.removeItem('duotrack_demo_user');
      setIsDemoMode(false);
      const res = await signInWithEmailAndPassword(auth, email, pass);
      await syncProfile(res.user);
    } catch (err) {
      console.error('Email login error:', err);
      setLoading(false);
      throw err;
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string, username: string) => {
    try {
      setLoading(true);
      localStorage.removeItem('duotrack_demo_user');
      setIsDemoMode(false);
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const newProfile: UserProfile = {
        id: res.user.uid,
        name,
        username: username.toLowerCase().trim(),
        email,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${res.user.uid}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        inviteCode: generateInviteCode(name),
        bio: 'Productivity partner ready to stay consistent.',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveUserProfile(newProfile);
      setProfile(newProfile);
      await seedInitialUserDataIfNew(newProfile);
      await loadFriendData(newProfile.id);
      setLoading(false);
    } catch (err) {
      console.error('Email signup error:', err);
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    localStorage.removeItem('duotrack_demo_user');
    setIsDemoMode(false);
    if (firebaseUser) {
      await firebaseSignOut(auth);
    }
    setProfile(null);
    setActiveFriendship(null);
    setFriendStats(null);
    setLoading(false);
  };

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates, updatedAt: Date.now() };
    setProfile(updated);
    await saveUserProfile(updated);
  };

  const refreshFriendData = async () => {
    if (profile) {
      await loadFriendData(profile.id);
    }
  };

  const switchDemoUser = async (target: 'friend1' | 'friend2') => {
    setLoading(true);
    setIsDemoMode(true);
    localStorage.setItem('duotrack_demo_user', target);
    
    // Ensure both demo profiles exist in Firestore
    await saveUserProfile(DEMO_FRIEND_1);
    await saveUserProfile(DEMO_FRIEND_2);
    await seedInitialUserDataIfNew(DEMO_FRIEND_1);
    await seedInitialUserDataIfNew(DEMO_FRIEND_2);

    // Ensure reciprocal friendship exists
    const friendshipId = `friend_demo_user_alex_demo_user_sam`;
    const friendshipDoc: Friendship = {
      id: friendshipId,
      requesterId: DEMO_FRIEND_1.id,
      receiverId: DEMO_FRIEND_2.id,
      requesterUsername: DEMO_FRIEND_1.username,
      receiverUsername: DEMO_FRIEND_2.username,
      requesterName: DEMO_FRIEND_1.name,
      receiverName: DEMO_FRIEND_2.name,
      requesterAvatar: DEMO_FRIEND_1.avatarUrl,
      receiverAvatar: DEMO_FRIEND_2.avatarUrl,
      status: 'accepted',
      createdAt: Date.now() - 14 * 86400000,
      updatedAt: Date.now(),
    };
    
    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'friendships', friendshipId), friendshipDoc, { merge: true });

    const activeDemo = target === 'friend1' ? DEMO_FRIEND_1 : DEMO_FRIEND_2;
    setFirebaseUser(null);
    await syncProfile(null, activeDemo);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        user: profile,
        loading,
        activeFriendship,
        friendStats,
        allFriendships,
        isDemoMode,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        updateProfileData,
        refreshFriendData,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
