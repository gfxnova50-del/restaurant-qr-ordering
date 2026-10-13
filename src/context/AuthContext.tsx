'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface UserSession {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  demoLogin: () => void;
  brandColor: string;
  setBrandColor: (color: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [brandColor, setBrandColorState] = useState<string>('#E23744');

  useEffect(() => {
    // Check saved brand color
    try {
      const savedColor = localStorage.getItem('qrmenu_brand_color');
      if (savedColor) {
        setBrandColorState(savedColor);
        document.documentElement.style.setProperty('--brand', savedColor);
        document.documentElement.style.setProperty('--brand-color', savedColor);
      } else {
        document.documentElement.style.setProperty('--brand', '#E23744');
        document.documentElement.style.setProperty('--brand-color', '#E23744');
      }
    } catch {}

    // Check user session
    const checkSession = async () => {
      try {
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || 'owner@spicegarden.demo',
              name: session.user.user_metadata?.full_name || 'Restaurant Owner',
            });
            setLoading(false);
            return;
          }
        }

        // Fallback demo session from localStorage
        const savedAuth = localStorage.getItem('qrmenu_owner_auth');
        if (savedAuth) {
          setUser(JSON.parse(savedAuth));
        }
      } catch (e) {
        console.warn('Session check failed:', e);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const setBrandColor = (color: string) => {
    setBrandColorState(color);
    try {
      localStorage.setItem('qrmenu_brand_color', color);
      document.documentElement.style.setProperty('--brand', color);
      document.documentElement.style.setProperty('--brand-color', color);
    } catch {}
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });

        if (error) {
          // If Supabase returned error or credentials failed, check if demo fallback matches
          if (email.toLowerCase().includes('demo') || pass === 'demo123456') {
            const demoUser: UserSession = {
              id: 'a0000000-0000-0000-0000-000000000001',
              email,
              name: 'Demo Owner',
            };
            setUser(demoUser);
            localStorage.setItem('qrmenu_owner_auth', JSON.stringify(demoUser));
            return { success: true };
          }
          return { success: false, error: error.message };
        }

        if (data.user) {
          const u: UserSession = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name || 'Restaurant Owner',
          };
          setUser(u);
          localStorage.setItem('qrmenu_owner_auth', JSON.stringify(u));
          return { success: true };
        }
      }

      // Demo login fallback
      if (pass === 'demo123456' || email.includes('owner') || email.includes('demo')) {
        const demoUser: UserSession = {
          id: 'a0000000-0000-0000-0000-000000000001',
          email,
          name: 'Demo Restaurant Owner',
        };
        setUser(demoUser);
        localStorage.setItem('qrmenu_owner_auth', JSON.stringify(demoUser));
        return { success: true };
      }

      return { success: false, error: 'Invalid credentials. Use demo123456 for demo login.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = () => {
    const demoUser: UserSession = {
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'owner@spicegarden.demo',
      name: 'Rajesh Sharma (Owner)',
    };
    setUser(demoUser);
    localStorage.setItem('qrmenu_owner_auth', JSON.stringify(demoUser));
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    } catch {}
    setUser(null);
    try {
      localStorage.removeItem('qrmenu_owner_auth');
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        demoLogin,
        brandColor,
        setBrandColor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
