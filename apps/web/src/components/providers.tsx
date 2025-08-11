"use client";

import { SessionProvider } from "next-auth/react";
import { Provider } from "react-redux";
import { ReactNode } from "react";
import { store } from "../../../../packages/store/store";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <SessionProvider>{children}</SessionProvider>
    </Provider>
  );
}
