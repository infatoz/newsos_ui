import { themeConfig } from "@/config/theme";

export interface GraphQLErrorShape {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLErrorShape[];
  extensions?: Record<string, unknown>;
}

export interface GraphQLFetchOptions {
  /** ISR revalidate window in seconds. `false` disables revalidation (force-cache forever). */
  revalidate?: number | false;
  /** Next.js cache tags for on-demand revalidation. */
  tags?: string[];
  /** Override GraphQL endpoint (defaults to themeConfig.graphqlEndpoint). */
  endpoint?: string;
  /** Extra request headers. */
  headers?: HeadersInit;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
  /** When true, throw if GraphQL `errors` array is present. Default: true. */
  throwOnError?: boolean;
  /** Cache mode override for fetch. */
  cache?: RequestCache;
}

export class GraphQLFetchError extends Error {
  readonly status?: number;
  readonly errors?: GraphQLErrorShape[];
  readonly response?: unknown;

  constructor(
    message: string,
    options?: {
      status?: number;
      errors?: GraphQLErrorShape[];
      response?: unknown;
      cause?: unknown;
    },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "GraphQLFetchError";
    this.status = options?.status;
    this.errors = options?.errors;
    this.response = options?.response;
  }
}

/**
 * Lightweight server-side GraphQL fetch for RSC / ISR without Apollo.
 *
 * @example
 * ```ts
 * const data = await graphqlFetch<{ posts: { nodes: Post[] } }>(
 *   `query LatestPosts($first: Int!) { posts(first: $first) { nodes { id title } } }`,
 *   { first: 10 },
 *   { revalidate: 60, tags: ["posts"] },
 * );
 * ```
 */
export async function graphqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  options: GraphQLFetchOptions = {},
): Promise<T> {
  const {
    revalidate = 60,
    tags = [],
    endpoint = themeConfig.graphqlEndpoint,
    headers: extraHeaders,
    signal,
    throwOnError = true,
    cache,
  } = options;

  const nextOptions: { revalidate?: number | false; tags?: string[] } = {};
  if (revalidate !== undefined) {
    nextOptions.revalidate = revalidate;
  }
  if (tags.length > 0) {
    nextOptions.tags = tags;
  }

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify({ query, variables }),
      signal,
      ...(cache ? { cache } : {}),
      next: nextOptions,
    });
  } catch (cause) {
    throw new GraphQLFetchError("Failed to reach GraphQL endpoint", {
      cause,
    });
  }

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text().catch(() => undefined);
    }
    throw new GraphQLFetchError(
      `GraphQL HTTP ${response.status}: ${response.statusText}`,
      { status: response.status, response: body },
    );
  }

  let payload: GraphQLResponse<T>;
  try {
    payload = (await response.json()) as GraphQLResponse<T>;
  } catch (cause) {
    throw new GraphQLFetchError("Invalid JSON in GraphQL response", { cause });
  }

  if (payload.errors?.length && throwOnError) {
    throw new GraphQLFetchError(payload.errors[0]?.message ?? "GraphQL error", {
      errors: payload.errors,
      response: payload,
    });
  }

  if (payload.data === undefined || payload.data === null) {
    throw new GraphQLFetchError("GraphQL response contained no data", {
      errors: payload.errors,
      response: payload,
    });
  }

  return payload.data;
}

/**
 * Helper for mutating operations (always network, no ISR cache).
 */
export async function graphqlMutate<T>(
  mutation: string,
  variables?: Record<string, unknown>,
  options: Omit<GraphQLFetchOptions, "revalidate" | "cache"> = {},
): Promise<T> {
  return graphqlFetch<T>(mutation, variables, {
    ...options,
    cache: "no-store",
    revalidate: 0,
  });
}
