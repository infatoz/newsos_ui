import type { CodegenConfig } from "@graphql-codegen/cli";

/**
 * GraphQL Code Generator config for the NewsPortal WordPress WPGraphQL schema.
 *
 * Usage:
 *   npm run codegen
 *
 * Point schema at your WordPress GraphQL endpoint (or a local SDL dump).
 */
const schema =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
  process.env.GRAPHQL_SCHEMA_URL ||
  "http://localhost/graphql";

const config: CodegenConfig = {
  overwrite: true,
  schema,
  documents: [
    "src/graphql/**/*.{graphql,gql,ts,tsx}",
    "!src/graphql/generated/**",
    "src/**/*.graphql",
  ],
  ignoreNoDocuments: true,
  generates: {
    "src/graphql/generated/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        withHooks: true,
        withHOC: false,
        withComponent: false,
        apolloReactCommonImportFrom: "@apollo/client",
        apolloReactHooksImportFrom: "@apollo/client/react",
        reactApolloVersion: 4,
        skipTypename: false,
        enumsAsTypes: true,
        dedupeOperationSuffix: true,
        useTypeImports: true,
        scalars: {
          Date: "string",
          DateTime: "string",
          Number: "number",
        },
      },
    },
  },
  hooks: {
    afterAllFileWrite: ["prettier --write"],
  },
};

export default config;
