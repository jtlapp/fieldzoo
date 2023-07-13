import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import tsconfigpaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [sveltekit(), tsconfigpaths()],
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"],
  },
});
