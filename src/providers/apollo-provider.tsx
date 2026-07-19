"use client";

import { useMemo, type ReactNode } from "react";
import { ApolloProvider } from "@apollo/client/react";
import {
  getBrowserApolloClient,
  type CreateApolloClientOptions,
} from "@/lib/apollo-client";
import type { NormalizedCacheObject } from "@apollo/client";

export interface AppApolloProviderProps {
  children: ReactNode;
  /** Optional dehydrated cache from the server. */
  initialState?: NormalizedCacheObject;
}

/**
 * Client-side Apollo Provider wrapping the app tree.
 */
export function AppApolloProvider({
  children,
  initialState,
}: AppApolloProviderProps) {
  const client = useMemo(
    () => getBrowserApolloClient(initialState),
    // initialState is only applied on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

/** Alias matching common naming. */
export { AppApolloProvider as ApolloClientProvider };

export type { CreateApolloClientOptions };
