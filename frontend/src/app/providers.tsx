import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { StoreProvider } from "@/lib/admin-store";
import { ManufacturerProvider } from "@/features/manufacturer/manufacturer-context";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";

export interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoreProvider>
          <ManufacturerProvider>
            <MotionConfig reducedMotion="user">
              {children}
              <Toaster position="bottom-right" />
            </MotionConfig>
          </ManufacturerProvider>
        </StoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default Providers;
