import { print, type DocumentNode } from "graphql";
import {
  graphqlFetch,
  graphqlMutate,
  type GraphQLFetchOptions,
} from "@/lib/graphql-fetch";

/** Convert an Apollo `gql` DocumentNode (or raw string) for graphqlFetch. */
export function toQueryString(document: DocumentNode | string): string {
  return typeof document === "string" ? document : print(document);
}

export async function fetchQuery<T>(
  document: DocumentNode | string,
  variables?: Record<string, unknown>,
  options?: GraphQLFetchOptions,
): Promise<T> {
  return graphqlFetch<T>(toQueryString(document), variables, options);
}

export async function fetchMutation<T>(
  document: DocumentNode | string,
  variables?: Record<string, unknown>,
  options?: Omit<GraphQLFetchOptions, "revalidate" | "cache">,
): Promise<T> {
  return graphqlMutate<T>(toQueryString(document), variables, options);
}
