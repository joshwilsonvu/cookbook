import { defineCollection } from "astro:content";
import { z } from "astro/zod";

import { glob } from "astro/loaders";

const recipes = defineCollection({
  loader: glob({ pattern: ["**/*.md", "!**/_*"], base: "./src/data/recipes" }),
  schema: z.object({
    // inferred from path by default
    title: z.string().nullish(),
    author: z.string(),
    course: z.enum([
      "entrée",
      "side",
      "salad",
      "soup",
      "dessert",
      "breakfast",
      "beverage",
    ]),
    // if given a record, splits the ingredient list into sections
    ingredients: z.union([
      z.array(z.string()),
      z.record(z.string(), z.array(z.string())),
    ]),
    notes: z.string().nullish(),
    collections: z.array(z.string()).nullish(),
    source: z.url().nullish(),
  }),
});

export const collections = {
  recipes,
};
