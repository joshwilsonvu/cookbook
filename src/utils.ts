import { basename } from "node:path/posix";
import type { CollectionEntry } from "astro:content";
import { decodeHTML } from "entities";

type Recipe = CollectionEntry<"recipes">;

export function getTitle(recipe: Recipe) {
  if (recipe.data.title) {
    return recipe.data.title;
  }
  const file = basename(recipe.id);
  const title = file.replace(/[_-]+/g, " ");
  return titleCase(title);
}

export function titleCase(s: string) {
  return s
    .split(" ")
    .filter((ss) => ss)
    .map((ss) => capitalize(ss))
    .join(" ");
}

export function capitalize(s: string) {
  return s[0].toUpperCase() + s.slice(1);
}

/** Replacers must be functions to work with both String.prototype.replace and hast-util-find-and-replace. */
export const formatters: Array<
  [RegExp, Parameters<typeof String.prototype.replace>[1]]
> = [
  // use en dash for ranges, not hyphen or em dash
  [/(\d+)[-—](\d+)/g, (_match, n1, n2) => `${n1}–${n2}`],
  // use times symbol instead of "x" for dimensions
  [/(\d+)x(\d+)/g, (_match, n1, n2) => `${n1}×${n2}`],
  // good fractions
  [/\b1\/2\b/g, () => "½"],
  [/\b1\/3\b/g, () => "⅓"],
  [/\b1\/4\b/g, () => "¼"],
  [/\b2\/3\b/g, () => "⅔"],
  [/\b3\/4\b/g, () => "¾"],
  [/\b1\/8\b/g, () => "⅛"],
  // degree symbol
  [/\b(?:degrees|°) ?F?\b/g, () => "°"],
  // short units
  [/teaspoons?/g, () => "tsp"],
  [/tablespoons?/g, () => "tbsp"],
];

export function format(s: string) {
  return decodeHTML(
    formatters.reduce(
      (ss, [regex, replacement]) => ss.replace(regex, replacement),
      s,
    ),
  );
}
