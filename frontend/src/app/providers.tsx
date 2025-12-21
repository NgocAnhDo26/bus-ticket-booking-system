import { type ReactNode, useMemo } from 'react';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster as SonnerToaster, Toaster } from '@/components/ui/sonner';
import { useHydrateAuth } from '@/features/auth/hooks';

type Props = {
  children: ReactNode;
};

const AuthHydrator = ({ children }: Props) => {
  useHydrateAuth();
  return <>{children}</>;
};

export const AppProviders = ({ children }: Props) => {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 30,
          },
        },
      }),
    [],
  );

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <GoogleOAuthProvider clientId={googleClientId}>
        <QueryClientProvider client={queryClient}>
          <AuthHydrator>{children}</AuthHydrator>
          <SonnerToaster position="top-center" richColors />
          <Toaster />
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
};
