import "@apollo/client";

/**
 * Apollo Client 4.x requires declaring default option values used in
 * `ApolloClient` constructor `defaultOptions` for type-safe inference.
 *
 * @see https://www.apollographql.com/docs/react/data/typescript#declaring-default-options-for-type-safety
 */
declare module "@apollo/client" {
  namespace ApolloClient {
    export interface DefaultOptions {
      watchQuery?: DefaultOptions.WatchQuery;
      query?: DefaultOptions.Query;
      mutate?: DefaultOptions.Mutate;
    }
  }

  namespace ApolloClient {
    export namespace DeclareDefaultOptions {
      export interface WatchQuery {
        fetchPolicy: "cache-and-network" | "cache-first" | "network-only" | "no-cache" | "standby";
        nextFetchPolicy: "cache-first";
        errorPolicy: "all";
        returnPartialData: false;
      }

      export interface Query {
        fetchPolicy: "network-only" | "cache-first" | "no-cache" | "standby";
        errorPolicy: "all";
      }

      export interface Mutate {
        errorPolicy: "all";
      }
    }
  }
}

export {};
