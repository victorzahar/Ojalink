"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Shared Better Auth client for browser code.
 *
 * Better Auth's browser client addresses endpoints by nested path
 * (`signIn.email` → POST /api/auth/sign-in/email). The flat names like
 * `signInEmail` only exist on the server API (`auth.api.signInEmail`).
 * This facade keeps the flat, typed names for callers while mapping them
 * onto the nested client. Every call goes to this site's /api/auth.
 *
 * Change roles only in admin server code — never here and never from forms.
 */
export type AuthError = {
  code?: string;
  message?: string;
  status?: number;
  statusText?: string;
} | null;

/**
 * ERROR-HANDLING NOTE — do not mask failures.
 *
 * Map auth failures by HTTP status, never by collapsing everything into one
 * friendly message: a 404/500/network bug once looked like "wrong password"
 * and hid a bad endpoint for a whole step. Rules used app-wide:
 *   401 → wrong credentials   429 → too many attempts   anything else → generic
 * In development, log the real status/code/message so the console shows the truth.
 */
export function authErrorMessage(error: AuthError): string {
  if (process.env.NODE_ENV === "development") {
    console.error("[auth] request failed", {
      status: error?.status ?? "network",
      code: error?.code,
      message: error?.message,
    });
  }

  if (error?.status === 401) return "Wrong email or password";
  if (error?.status === 429) return "Too many attempts. Wait a few seconds and try again.";
  return "Something went wrong. Please try again.";
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  /** User role, decided by the server; clients never set it. */
  role?: "buyer" | "vendor" | "rider" | "admin";
  /** Extra field from the shared auth config; may be missing on old rows. */
  phone?: string | null;
} | null;

type FetchStateConfig = {
  onSuccess?: (context: { data: unknown; response: Response }) => void;
  onError?: (context: { error: { message?: string; code?: string; status?: number }; response: Response }) => void;
};

/** Runtime shape of the Better Auth client for the endpoints this app uses. */
type BetterAuthRuntimeClient = {
  signUp: {
    email: (input: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      fetchOptions?: FetchStateConfig;
    }) => Promise<{ data: unknown; error: AuthError }>;
  };
  signIn: {
    email: (input: {
      email: string;
      password: string;
      fetchOptions?: FetchStateConfig;
    }) => Promise<{ data: { user: NonNullable<AuthUser> } | null; error: AuthError }>;
  };
  signOut: (input?: {
    fetchOptions?: FetchStateConfig;
  }) => Promise<{ data: unknown; error: AuthError }>;
  getSession: (input?: {
    query?: { disableCookieCache?: boolean };
    fetchOptions?: FetchStateConfig;
  }) => Promise<{ data: { user: NonNullable<AuthUser>; session: unknown } | null; error: AuthError }>;
};

export interface OjaLinkAuthClient {
  signUpEmail: (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    fetchOptions?: FetchStateConfig;
  }) => Promise<{ data: unknown; error: AuthError }>;

  signInEmail: (input: {
    email: string;
    password: string;
    fetchOptions?: FetchStateConfig;
  }) => Promise<{ data: { user: NonNullable<AuthUser> } | null; error: AuthError }>;

  signOut: (input?: {
    fetchOptions?: FetchStateConfig;
  }) => Promise<{ data: unknown; error: AuthError }>;

  /** Reads the current session via GET /api/auth/get-session. `data` is null when signed out. */
  getSession: (input?: {
    query?: { disableCookieCache?: boolean };
    fetchOptions?: FetchStateConfig;
  }) => Promise<{ data: { user: NonNullable<AuthUser>; session: unknown } | null; error: AuthError }>;
}

const client = createAuthClient() as unknown as BetterAuthRuntimeClient;

export const authClient: OjaLinkAuthClient = {
  signUpEmail: (input) => client.signUp.email(input),
  signInEmail: (input) => client.signIn.email(input),
  signOut: (input) => client.signOut(input),
  getSession: (input) => client.getSession(input),
};
