import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { DEFAULT_ROLE } from '../lib/insforge';
import * as auth from '../services/authService';
import { ensureProfile, fetchProfile } from '../services/databaseService';
import { normalizeRole, type RoleKey } from '../lib/roles';
import type { SessionUser, Profile } from '../types';

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, role: string) => Promise<{ error?: string; needsVerification?: boolean }>;
  signOut: () => Promise<void>;
  sendReset: (email: string) => Promise<{ error?: string }>;
  confirmReset: (email: string, code: string, newPassword: string) => Promise<{ error?: string }>;
  verifyEmail: (email: string, otp: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function buildSessionUser(raw: auth.RawAuthUser, profile: Profile | null): SessionUser {
  const role: RoleKey = normalizeRole(profile?.role ?? (raw.profile?.role as string));
  return {
    id: raw.id,
    email: raw.email,
    emailVerified: !!raw.emailVerified,
    name: profile?.full_name || (raw.profile?.name as string) || raw.email.split('@')[0],
    role,
    profile,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    const raw = await auth.getCurrentUser();
    if (!raw) { setUser(null); setLoading(false); return; }
    let profile = await fetchProfile(raw.id);
    if (!profile) {
      profile = await ensureProfile(raw.id, {
        full_name: (raw.profile?.name as string) || '',
        role: DEFAULT_ROLE,
      });
    }
    setUser(buildSessionUser(raw, profile));
    setLoading(false);
  }, []);

  useEffect(() => { void loadSession(); }, [loadSession]);

  const signIn: AuthState['signIn'] = async (email, password) => {
    try {
      await auth.signInWithPassword(email, password);
      await loadSession();
      return {};
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const signUp: AuthState['signUp'] = async (email, password, name, role) => {
    try {
      const { user: newUser, needsVerification } = await auth.signUp(
        email, password, name, `${window.location.origin}/login`,
      );
      // If the backend issued a session immediately, create the profile now.
      if (newUser?.id) {
        await ensureProfile(newUser.id, { full_name: name, role });
      }
      return { needsVerification };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const signOut: AuthState['signOut'] = async () => {
    await auth.signOut();
    setUser(null);
  };

  const sendReset: AuthState['sendReset'] = async (email) => {
    try {
      await auth.sendResetPasswordEmail(email, `${window.location.origin}/reset-password`);
      return {};
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const confirmReset: AuthState['confirmReset'] = async (email, code, newPassword) => {
    try {
      await auth.resetPasswordWithCode(email, code, newPassword);
      return {};
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const verifyEmail: AuthState['verifyEmail'] = async (email, otp) => {
    try {
      await auth.verifyEmail(email, otp);
      return {};
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const refreshProfile = useCallback(async () => { await loadSession(); }, [loadSession]);

  const value: AuthState = { user, loading, signIn, signUp, signOut, sendReset, confirmReset, verifyEmail, refreshProfile };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
