import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  displayName: "frontend",
  testEnvironment: "jsdom",
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  testMatch: [
    "<rootDir>/tests/unit/**/*.{test,spec}.{ts,tsx}",
    "<rootDir>/src/**/*.{test,spec}.{ts,tsx}",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: [],
  clearMocks: true,
  collectCoverageFrom: [
    "src/utils/**/*.{ts,tsx}",
    "src/lib/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
  ],
};

export default createJestConfig(config);
