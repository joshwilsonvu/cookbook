export function getTitle(id: string) {
  const title = id.replace(/[_-]+/g, " ");
  return titleCase(title);
}

export function titleCase(s: string) {
  return s
    .split(" ")
    .map((ss) => capitalize(ss))
    .join(" ");
}

export function capitalize(s: string) {
  return s[0].toUpperCase() + s.slice(1);
}
