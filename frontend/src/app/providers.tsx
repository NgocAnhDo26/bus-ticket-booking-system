import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { type ReactNode, useMemo } from "react";
import { ThemeProvider } from "@/hooks/use-theme";
import { useHydrateAuth } from "@/features/auth/hooks";

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
    []
  );

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

  return (
    <ThemeProvider>
      <GoogleOAuthProvider clientId={googleClientId}>
        <QueryClientProvider client={queryClient}>
          <AuthHydrator>{children}</AuthHydrator>
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
};
