type SearchableCategory = { id: number; name: string; path: string };

export function getSchemaCategoryOptions<T extends SearchableCategory>(nodes: readonly T[], selectedId: number, search: string) {
  const query = search.trim().toLocaleLowerCase();
  const matches = query ? nodes.filter((node) => `${node.name} ${node.path}`.toLocaleLowerCase().includes(query)) : nodes;
  const selected = nodes.find((node) => node.id === selectedId);
  const retainedSelection = selected && !matches.some((node) => node.id === selectedId) ? selected : undefined;

  // A controlled native select must keep its current value among the options.
  // Retaining it must not inflate the count of actual search matches.
  return { selected, retainedSelection, options: retainedSelection ? [retainedSelection, ...matches] : matches, matchCount: matches.length };
}

export function getSchemaCategoryNavigationHref(pathname: string, selectedId: number, value: string) {
  const nextId = Number(value);
  if (!Number.isInteger(nextId) || nextId === selectedId) return null;
  return `${pathname}?node=${nextId}`;
}
