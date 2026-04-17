'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Хук для работы с аутентификацией
 */
export function useAuth(requireAuth = false) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';
  const isAuthenticated = !!session;

  useEffect(() => {
    if (requireAuth && !isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [requireAuth, isLoading, isAuthenticated, router]);

  return {
    session,
    user: session?.user,
    isLoading,
    isAuthenticated,
  };
}
