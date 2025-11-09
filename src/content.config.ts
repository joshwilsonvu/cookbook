import { defineCollection, z, reference } from "astro:content";

import { glob } from "astro/loaders";

const categories = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/data/categories" }),
  schema: z.object({
    // inferred from path by default
    title: z.string().optional(),
    order: z.number().int().positive(),
  }),
});
const recipes = defineCollection({
  loader: glob({ pattern: ["**/*.md", "!**/_*"], base: "./src/data/recipes" }),
  schema: z.object({
    // inferred from path by default
    title: z.string().optional(),
    category: reference("categories"),
    // TODO: use reference() ?
    author: z.string(),
    // if given a record, splits the ingredient list into sections
    ingredients: z.union([z.array(z.string()), z.record(z.array(z.string()))]),
    notes: z.string().optional(),
  }),
});

export const collections = {
  categories,
  recipes,
};
