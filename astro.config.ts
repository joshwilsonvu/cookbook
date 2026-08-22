import { defineConfig, fontProviders } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { defineHastPlugin } from "satteri";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import { format } from "./src/utils";

import preact from "@astrojs/preact";

import cloudflare from "@astrojs/cloudflare";

const recipeFormatter = defineHastPlugin({
  name: "recipe-formatter",
  text: (node) => {
    return { ...node, value: format(node.value) };
  },
});

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
  integrations: [icon(), preact({ compat: false })],

  markdown: {
    processor: satteri({
      features: { smartPunctuation: true },
      hastPlugins: [recipeFormatter],
    }),
  },

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

  build: {
    format: "file",
    concurrency: 4,
  },
  adapter: cloudflare({
    prerenderEnvironment: "node", // for Satteri I think
  }),
  session: false,
});
