'use client';

/**
 * Auth compatibility hooks.
 *
 * When a Clerk publishable key is configured these delegate to the real Clerk
 * hooks. Otherwise they return safe mock values so the dashboard renders
 * without authentication (demo / landing-only mode).
 *
 * We avoid conditional hook calls by always returning from the same code path
 * — the branch is on the *result*, not on whether the hook is called.
 */

import { useCallback, useMemo } from 'react';

/* -------------------------------------------------------------------------- */
/*  Detect Clerk at module level (client-side env var)                        */
/* -------------------------------------------------------------------------- */
const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/* -------------------------------------------------------------------------- */
/*  Lazy-loaded Clerk module (only resolved when key is present)              */
/* -------------------------------------------------------------------------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let clerkModule: any = null;

function getClerk() {
  if (!clerkModule && HAS_CLERK) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    clerkModule = require('@clerk/nextjs');
  }
  return clerkModule;
}

/* -------------------------------------------------------------------------- */
/*  useAuthCompat                                                             */
/* -------------------------------------------------------------------------- */

interface AuthCompat {
  getToken: () => Promise<string | null>;
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
}

const MOCK_AUTH: AuthCompat = {
  getToken: async () => null,
  isLoaded: true,
  isSignedIn: false,
  userId: null,
};

/**
 * Drop-in replacement for `useAuth()` from `@clerk/nextjs`.
 * Returns a mock when Clerk is not configured.
 */
export function useAuthCompat(): AuthCompat {
  const clerk = getClerk();

  // Stable mock so callers don't re-render
  const mock = useMemo(() => MOCK_AUTH, []);

  if (clerk) {
    return clerk.useAuth();
  }
  return mock;
}

/* -------------------------------------------------------------------------- */
/*  useUserCompat                                                             */
/* -------------------------------------------------------------------------- */

interface UserCompat {
  user: {
    firstName: string | null;
    lastName: string | null;
    emailAddresses: { emailAddress: string }[];
    imageUrl: string | null;
  } | null;
  isLoaded: boolean;
  isSignedIn: boolean;
}

/**
 * Drop-in replacement for `useUser()` from `@clerk/nextjs`.
 */
export function useUserCompat(): UserCompat {
  const clerk = getClerk();

  const mockUser = useMemo(
    () => ({
      user: {
        firstName: 'Doctor',
        lastName: 'Demo',
        emailAddresses: [{ emailAddress: 'demo@doci.app' }],
        imageUrl: null,
      },
      isLoaded: true as const,
      isSignedIn: false as const,
    }),
    []
  );

  if (clerk) {
    return clerk.useUser();
  }
  return mockUser;
}

/* -------------------------------------------------------------------------- */
/*  useGetToken — convenience wrapper used by API calls                       */
/* -------------------------------------------------------------------------- */

/**
 * Returns a stable `getToken` callback. In demo mode it always resolves to
 * `"demo-token"` so fetch calls don't immediately bail out.
 */
export function useGetToken(): () => Promise<string | null> {
  const { getToken } = useAuthCompat();
  return useCallback(async () => {
    const token = await getToken();
    return token ?? 'demo-token';
  }, [getToken]);
}
