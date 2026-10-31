"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Shared Better Auth client for browser code.
 *
 * The underlying client resolves endpoints dynamically (Proxy), so this file
 * exposes a narrow, explicitly-typed facade for the methods the auth core
 * uses today. Extend the facade with new methods as features need them.
 *
 * Change roles only in admin server code — never here and never from forms.
 */
export type AuthError = {
  code?: string;
  message?: string;
  status?: number;
  statusText?: string;
} | null;

type FetchStateConfig = {
  onSuccess?: (context: { data: unknown; response: Response }) => void;
  onError?: (context: { error: { message?: string; code?: string; status?: number }; response: Response }) => void;
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
  }) => Promise<{ data: unknown; error: AuthError }>;

  signOut: (input?: {
    fetchOptions?: FetchStateConfig;
  }) => Promise<{ data: unknown; error: AuthError }>;
}

export const authClient = createAuthClient() as unknown as OjaLinkAuthClient;
