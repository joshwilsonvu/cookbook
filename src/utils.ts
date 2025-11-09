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
