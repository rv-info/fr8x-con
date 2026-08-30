'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, PlanTier, UserRole } from '@/lib/types';

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'u-arjun',
    email: 'arjun@atlaslogistics.com',
    firstName: 'Arjun',
    lastName: 'Rao',
    displayName: 'Arjun Rao',
    designation: 'Freight Manager',
    company: 'Atlas Logistics Pvt. Ltd.',
    companyId: 'CMP-00101',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    mobile: '+91 98765 43210',
    timezone: 'Asia/Kolkata',
    preferredContactMethod: 'tradeChat',
    contactAvailability: '09:00 - 18:30 IST',
    plan: 'premium',
    hasGoldenTick: true,
    isVerified: true,
    role: 'company_admin',
    avatarUrl: '',
    bio: 'Freight procurement specialist with 9+ years managing ocean FCL and OOG breakbulk across Asia-Europe and US West Coast corridors.',
    summary: 'Expertise in carrier contract negotiations, multimodal inland haulage, customs liaison, and real-time reverse auction execution.',
    specializations: ['FCL Ocean', 'OOG Breakbulk', 'Reefer Logistics', 'Customs Clearance'],
    skills: ['Rate Procurement', 'Carrier Negotiation', 'UN/LOCODE Routing', 'ERP Logistics'],
    languages: ['English', 'Hindi', 'Marathi'],
  },
  {
    uid: 'u-sarah',
    email: 'sarah.lewis@rotterdamfreight.nl',
    firstName: 'Sarah',
    lastName: 'Lewis',
    displayName: 'Sarah Lewis',
    designation: 'Ocean Freight Lead',
    company: 'Rotterdam Freight NV',
    companyId: 'CMP-00102',
    city: 'Rotterdam',
    state: 'South Holland',
    country: 'Netherlands',
    mobile: '+31 10 123 4567',
    timezone: 'Europe/Amsterdam',
    preferredContactMethod: 'email',
    contactAvailability: '08:30 - 17:00 CET',
    plan: 'professional',
    hasGoldenTick: false,
    isVerified: true,
    role: 'user',
    avatarUrl: '',
    bio: 'North Continent port logistics specialist and container supply chain manager.',
    languages: ['English', 'Dutch', 'German'],
  },
  {
    uid: 'u-kiran',
    email: 'kiran.mehta@indoocean.com',
    firstName: 'Kiran',
    lastName: 'Mehta',
    displayName: 'Kiran Mehta',
    designation: 'Trade Lane Manager',
    company: 'Indo Ocean Lines',
    companyId: 'CMP-00103',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    mobile: '+91 98111 22334',
    timezone: 'Asia/Kolkata',
    preferredContactMethod: 'whatsapp',
    contactAvailability: '10:00 - 19:00 IST',
    plan: 'trial',
    hasGoldenTick: false,
    isVerified: true,
    role: 'user',
    avatarUrl: '',
    bio: 'Direct carrier relations manager specializing in Asia-Europe and Middle East trade lanes.',
    languages: ['English', 'Hindi', 'Gujarati'],
  },
];

interface AuthContextType {
  user: UserProfile;
  allUsers: UserProfile[];
  switchUser: (uid: string) => void;
  updateUser: (updatedFields: Partial<UserProfile>) => void;
  upgradePlan: (plan: PlanTier) => void;
  login: (email: string, pass: string) => boolean;
  register: (profile: Partial<UserProfile>) => void;
  logout: () => void;
  bidPostingFee: number; // ₹180 for Premium, ₹300 for others
  bidDiscountPercentage: number; // 40% for Premium, 0% for others
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);

  // Load persisted user if any
  useEffect(() => {
    try {
      const savedUid = localStorage.getItem('fr8x_active_user_uid');
      if (savedUid) {
        const found = allUsers.find((u) => u.uid === savedUid);
        if (found) setCurrentUser(found);
      }
    } catch {}
  }, []);

  const switchUser = (uid: string) => {
    const found = allUsers.find((u) => u.uid === uid);
    if (found) {
      setCurrentUser(found);
      try {
        localStorage.setItem('fr8x_active_user_uid', uid);
      } catch {}
    }
  };

  const updateUser = (updatedFields: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      setAllUsers((list) => list.map((u) => (u.uid === prev.uid ? updated : u)));
      return updated;
    });
  };

  const upgradePlan = (plan: PlanTier) => {
    const hasGoldenTick = plan === 'premium';
    updateUser({ plan, hasGoldenTick });
  };

  const login = (email: string) => {
    const found = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUser(found);
      try {
        localStorage.setItem('fr8x_active_user_uid', found.uid);
      } catch {}
      return true;
    }
    // Fallback creates corporate user
    const namePart = email.split('@')[0];
    const newUser: UserProfile = {
      uid: `u-${Date.now()}`,
      email,
      firstName: namePart.charAt(0).toUpperCase() + namePart.slice(1),
      lastName: 'Corporate',
      displayName: `${namePart.charAt(0).toUpperCase() + namePart.slice(1)} (Corporate)`,
      designation: 'Logistics Executive',
      company: email.split('@')[1].split('.')[0].toUpperCase() + ' Logistics',
      companyId: `CMP-${Math.floor(1000 + Math.random() * 9000)}`,
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      mobile: '+91 99000 11223',
      timezone: 'Asia/Kolkata',
      preferredContactMethod: 'email',
      contactAvailability: '09:00 - 18:00',
      plan: 'professional',
      hasGoldenTick: false,
      isVerified: true,
      role: 'user',
    };
    setAllUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    try {
      localStorage.setItem('fr8x_active_user_uid', newUser.uid);
    } catch {}
    return true;
  };

  const register = (profile: Partial<UserProfile>) => {
    const newUser: UserProfile = {
      uid: `u-${Date.now()}`,
      email: profile.email || 'user@company.com',
      firstName: profile.firstName || 'User',
      lastName: profile.lastName || '',
      displayName: `${profile.firstName || 'User'} ${profile.lastName || ''}`.trim(),
      designation: profile.designation || 'Freight Executive',
      company: profile.company || 'Global Logistics Pvt Ltd',
      companyId: `CMP-${Math.floor(1000 + Math.random() * 9000)}`,
      city: profile.city || 'Mumbai',
      state: profile.state || 'Maharashtra',
      country: profile.country || 'India',
      mobile: profile.mobile || '+91 90000 00000',
      timezone: profile.timezone || 'Asia/Kolkata',
      preferredContactMethod: profile.preferredContactMethod || 'tradeChat',
      contactAvailability: profile.contactAvailability || '09:00 - 18:00',
      plan: profile.plan || 'trial',
      hasGoldenTick: profile.plan === 'premium',
      isVerified: true,
      role: 'user',
      ...profile,
    };
    setAllUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    try {
      localStorage.setItem('fr8x_active_user_uid', newUser.uid);
    } catch {}
  };

  const logout = () => {
    setCurrentUser(INITIAL_USERS[0]);
    try {
      localStorage.removeItem('fr8x_active_user_uid');
    } catch {}
  };

  const isPremium = currentUser.plan === 'premium';
  const bidPostingFee = isPremium ? 180 : 300; // 40% discount for Premium
  const bidDiscountPercentage = isPremium ? 40 : 0;

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        allUsers,
        switchUser,
        updateUser,
        upgradePlan,
        login,
        register,
        logout,
        bidPostingFee,
        bidDiscountPercentage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
