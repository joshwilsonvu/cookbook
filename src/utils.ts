import { basename } from "node:path/posix";

export function getTitle(id: string) {
  const file = basename(id);
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

export const formatters = [
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
] as const;

export function format(s: string) {
  return formatters.reduce(
    (ss, [regex, replacement]) => ss.replace(regex, replacement),
    s,
  );
}
