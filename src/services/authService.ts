import { insforge } from '../lib/insforge';

/**
 * Authentication service — a thin, typed wrapper around `insforge.auth`.
 *
 * It centralises every call to the InsForge auth API and returns plain,
 * predictable shapes so the AuthContext (and any future consumer) never has to
 * reach into the SDK directly. Session token management is handled by the SDK
 * itself (browser cookie mode); these helpers just orchestrate the calls.
 */

export interface RawAuthUser {
  id: string;
  email: string;
  emailVerified?: boolean;
  metadata?: Record<string, unknown> | null;
  profile?: { name?: string; avatar_url?: string } & Record<string, unknown> | null;
}

export interface SignUpResult {
  user?: RawAuthUser;
  needsVerification: boolean;
}

/** Return the currently authenticated user (or null). */
export async function getCurrentUser(): Promise<RawAuthUser | null> {
  const { data } = await insforge.auth.getCurrentUser();
  return (data?.user as RawAuthUser) ?? null;
}

/** Sign in with email + password. Throws on failure. */
export async function signInWithPassword(email: string, password: string): Promise<RawAuthUser | null> {
  const { data, error } = await insforge.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return ((data as any)?.user as RawAuthUser) ?? null;
}

/** Register a new account. Throws on failure. */
export async function signUp(
  email: string,
  password: string,
  name: string,
  redirectTo?: string,
): Promise<SignUpResult> {
  const { data, error } = await insforge.auth.signUp({ email, password, name, redirectTo });
  if (error) throw new Error(error.message);
  return {
    user: (data as any)?.user as RawAuthUser | undefined,
    needsVerification: !!(data as any)?.requireEmailVerification,
  };
}

/** Sign the current user out. */
export async function signOut(): Promise<void> {
  await insforge.auth.signOut();
}

/** Email a password-reset code / link. Throws on failure. */
export async function sendResetPasswordEmail(email: string, redirectTo?: string): Promise<void> {
  const { error } = await insforge.auth.sendResetPasswordEmail({ email, redirectTo });
  if (error) throw new Error(error.message);
}

/**
 * Code-based reset: exchange the emailed 6-digit code for a one-time token,
 * then set the new password. Throws on failure.
 */
export async function resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<void> {
  const { data, error } = await insforge.auth.exchangeResetPasswordToken({ email, code });
  if (error) throw new Error(error.message);
  const token = (data as any)?.token;
  if (!token) throw new Error('Invalid or expired reset code.');
  const { error: resetErr } = await insforge.auth.resetPassword({ newPassword, otp: token });
  if (resetErr) throw new Error(resetErr.message);
}

/** Link-based reset: the backend already validated the token from the email link. */
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
  const { error } = await insforge.auth.resetPassword({ newPassword, otp: token });
  if (error) throw new Error(error.message);
}

/** Verify an email address with a 6-digit OTP. Throws on failure. */
export async function verifyEmail(email: string, otp: string): Promise<void> {
  const { error } = await insforge.auth.verifyEmail({ email, otp });
  if (error) throw new Error(error.message);
}

/** Resend the verification email. Throws on failure. */
export async function resendVerificationEmail(email: string, redirectTo?: string): Promise<void> {
  const { error } = await insforge.auth.resendVerificationEmail({ email, redirectTo });
  if (error) throw new Error(error.message);
}
