import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Jikota web — Module 0. Mobile-first; strict TS; vitest for the QA gates.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
} as Parameters<typeof defineConfig>[0] & { test: object });
