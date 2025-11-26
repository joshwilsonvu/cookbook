import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import { findAndReplace } from "mdast-util-find-and-replace";

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
    remarkPlugins: [remarkFormatText()],
  },
});

function remarkFormatText() {
  return (tree: any) => {
    findAndReplace(tree, [
      // use en dash for ranges
      [/(\d)-(\d)/g, "$1–$2"],
      // good fractions
      [/\b1\/2\b/g, "½"],
      [/\b1\/3\b/g, "⅓"],
      [/\b1\/4\b/g, "¼"],
      [/\b2\/3\b/g, "⅔"],
      [/\b3\/4\b/g, "¾"],
      // degree symbol
      [/\bdegrees ([FC])\b/, "°$1"],
    ]);
  };
}
