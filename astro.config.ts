import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import { findAndReplace } from "hast-util-find-and-replace";
import { formatters } from "./src/utils";

import preact from "@astrojs/preact";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: true,
    },
  },
  scopedStyleStrategy: "class",
  devToolbar: {
    enabled: false,
  },
  output: "static",
  site: "https://ourkitchentable.us",
  integrations: [icon(), preact()],
  markdown: {
    rehypePlugins: [
      () => (tree: any) => {
        findAndReplace(tree, formatters);
        return tree;
      },
    ],
  },
  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        // also considered "Beth Ellen", "Shadows Into Light Two", "Kalam", "Caveat Brush", "Homemade Apple"
        // name: "Rock Salt",
        name: "Mansalva",
        cssVariable: "--font-g-display",
      },
      {
        provider: fontProviders.google(),
        // also considered "Poppins"
        name: "Manrope",
        cssVariable: "--font-g-body",
      },
    ],
  },
});