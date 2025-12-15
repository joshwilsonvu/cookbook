import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import { findAndReplace } from "hast-util-find-and-replace";
import { formatters } from "./src/utils";

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
  site: "https://cookbook.joshwilsonvu.com",
  integrations: [icon()],
  markdown: {
    rehypePlugins: [
      () => (tree: any) => {
        findAndReplace(tree, formatters);
        return tree;
      },
    ],
  },
  // make recipes available at top level
  redirects: {
    "/[...id]": "/recipes/[...id]",
  },
  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        // also considered "Shadows Into Light Two", "Kalam", "Caveat Brush"
        name: "Beth Ellen",
        cssVariable: "--font-beth-ellen",
      },
      {
        provider: fontProviders.google(),
        // also considered "Poppins"
        name: "Lato",
        cssVariable: "--font-lato",
      },
    ],
  },
});
