'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface UserContextType {
  user: any;
  roles: string[];
  isAdmin: boolean;
  isEducator: boolean;
  isStudent: boolean;
  loadingRoles: boolean;
  displayName: string;
  setDisplayName: (name: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, error, isLoading } = useUser();
  const [roles, setRoles] = useState<string[]>(['Student']);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [displayName, setDisplayName] = useState('');


  // Fetch user roles from Management API
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user?.sub) {
        console.log('No user.sub found, setting loading to false');
        setLoadingRoles(false);
        return;
      }

      console.log('Fetching user roles for:', user.sub);
      try {
        const response = await fetch('/api/user-roles');
        console.log('Role fetch response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Role fetch response data:', data);
          setRoles(data.roles || ['Student']);
        } else {
          setRoles(['Student']);
        }
      } catch (error) {
        setRoles(['Student']);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchUserRoles();
  }, [user?.sub]);

  // Fetch user profile for display name
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`/api/user-profile?userId=${encodeURIComponent(user.email || user.sub || '')}`);
        const data = await response.json();
        
        if (data.success && data.profile) {
          setDisplayName(data.profile.displayName || user.name || user.email || '');
        } else {
          setDisplayName(user.name || user.email || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setDisplayName(user.name || user.email || '');
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Calculate role flags
  const isAdmin = roles.includes('Admin');
  const isEducator = roles.includes('Educator');
  const isStudent = roles.includes('Student');

  const value: UserContextType = {
    user,
    roles,
    isAdmin,
    isEducator,
    isStudent,
    loadingRoles,
    displayName,
    setDisplayName,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}
