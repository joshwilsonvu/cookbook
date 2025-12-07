import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import { findAndReplace } from "hast-util-find-and-replace";
import { formatters } from "./src/utils";

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
  markdown: {
    rehypePlugins: [
      () => (tree: any) => {
        console.log("Got tree:", tree);
        findAndReplace(tree, formatters);
        return tree;
      },
    ],
  },
});
