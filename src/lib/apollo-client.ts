import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  from,
  type NormalizedCacheObject,
} from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { themeConfig } from "@/config/theme";
import { isBrowser } from "@/lib/utils";

type ApolloClientInstance = ApolloClient;

let browserClient: ApolloClientInstance | undefined;

function createCache(): InMemoryCache {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            keyArgs: ["where", "search"],
            merge(existing, incoming, { args }) {
              if (!existing) return incoming;
              const offset = args?.where?.offsetPagination?.offset ?? 0;
              if (offset === 0) return incoming;

              const existingNodes = existing?.nodes ?? [];
              const incomingNodes = incoming?.nodes ?? [];
              return {
                ...incoming,
                nodes: [...existingNodes, ...incomingNodes],
              };
            },
          },
          post: {
            read(_, { args, toReference }) {
              if (args?.id) {
                return toReference({ __typename: "Post", id: args.id });
              }
              if (args?.slug || args?.uri) {
                return undefined;
              }
              return undefined;
            },
          },
        },
      },
      Post: {
        keyFields: ["databaseId"],
        fields: {
          title: {
            merge: false,
          },
          content: {
            merge: false,
          },
          categories: {
            merge: false,
          },
          tags: {
            merge: false,
          },
        },
      },
      Page: {
        keyFields: ["databaseId"],
      },
      Category: {
        keyFields: ["databaseId"],
      },
      Tag: {
        keyFields: ["databaseId"],
      },
      User: {
        keyFields: ["databaseId"],
      },
      MediaItem: {
        keyFields: ["databaseId"],
      },
    },
  });
}

function createErrorLink(): ErrorLink {
  return new ErrorLink(({ error, operation }) => {
    const opName = operation.operationName ?? "anonymous";

    if (CombinedGraphQLErrors.is(error)) {
      for (const graphQLError of error.errors) {
        console.error(
          `[GraphQL error][${opName}]: ${graphQLError.message}`,
          graphQLError.path ? `path: ${graphQLError.path.join(".")}` : "",
          graphQLError.extensions ?? "",
        );
      }
      return;
    }

    console.error(`[Network error][${opName}]:`, error);
  });
}

function createRetryLink(): RetryLink {
  return new RetryLink({
    delay: {
      initial: 300,
      max: 3000,
      jitter: true,
    },
    attempts: {
      max: 3,
      retryIf: (error) => !!error,
    },
  });
}

function createHttpLink(): HttpLink {
  return new HttpLink({
    uri: themeConfig.graphqlEndpoint,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
}

function createLinkChain(): ApolloLink {
  return from([createErrorLink(), createRetryLink(), createHttpLink()]);
}

export interface CreateApolloClientOptions {
  /** Force SSR mode (no browser cache reuse). */
  ssr?: boolean;
  /** Optional initial cache snapshot. */
  initialState?: NormalizedCacheObject;
}

/**
 * Create an Apollo Client instance for the browser.
 * Reuses a singleton on the client to preserve InMemoryCache across navigations.
 */
export function createApolloClient(
  options: CreateApolloClientOptions = {},
): ApolloClientInstance {
  const ssr = options.ssr ?? !isBrowser();

  const client = new ApolloClient({
    link: createLinkChain(),
    cache: createCache(),
    ssrMode: ssr,
    devtools: {
      enabled: process.env.NODE_ENV === "development" && !ssr,
    },
    defaultOptions: {
      watchQuery: {
        fetchPolicy: ssr ? "cache-first" : "cache-and-network",
        nextFetchPolicy: "cache-first",
        errorPolicy: "all",
        returnPartialData: false,
      },
      query: {
        // `cache-and-network` is watchQuery-only; use network-only on client queries
        // for fresh news data, cache-first on server when appropriate.
        fetchPolicy: ssr ? "network-only" : "network-only",
        errorPolicy: "all",
      },
      mutate: {
        errorPolicy: "all",
      },
    },
  });

  if (options.initialState) {
    client.cache.restore(options.initialState);
  }

  return client;
}

/**
 * Browser singleton accessor used by ApolloProvider.
 */
export function getBrowserApolloClient(
  initialState?: NormalizedCacheObject,
): ApolloClientInstance {
  if (!isBrowser()) {
    return createApolloClient({ ssr: true, initialState });
  }

  if (!browserClient) {
    browserClient = createApolloClient({ ssr: false, initialState });
    return browserClient;
  }

  if (initialState) {
    const existing = browserClient.cache.extract();
    browserClient.cache.restore(
      Object.assign({}, existing, initialState) as NormalizedCacheObject,
    );
  }

  return browserClient;
}

/**
 * Server Components / RSC Apollo client.
 * Creates a fresh client per call to avoid cross-request cache leakage.
 */
export function getClient(): ApolloClientInstance {
  return createApolloClient({ ssr: true });
}

export { createCache, createLinkChain };
