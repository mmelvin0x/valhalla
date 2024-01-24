import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(new QueryClient());

  return (
    <QueryClientProvider client={client}>
      {/* <ReactQueryStreamedHydration>{children}</ReactQueryStreamedHydration> */}
      {children}
    </QueryClientProvider>
  );
}
