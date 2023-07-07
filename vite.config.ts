import { defineConfig } from "vite";

export default defineConfig(() => ({
  resolve: {
    alias: {
      src: `./src`,
    },
  },
  test: {
    include: [`src/sequence/sequence.test.ts`],
  },
}));
