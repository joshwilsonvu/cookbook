// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  scopedStyleStrategy: "class",
  devToolbar: {
    enabled: false,
  },
  output: "static",
  site: "https://cookbook.joshwilsonvu.com",
  integrations: [icon()],
});
