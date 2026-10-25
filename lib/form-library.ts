export type FormFilter = "all" | "published" | "drafts";

export type FormLibrarySearchItem = {
  title: string;
  published: boolean;
};

export function filterFormLibrary<T extends FormLibrarySearchItem>(
  forms: readonly T[],
  filter: FormFilter,
  query: string,
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return forms.filter((form) => {
    const matchesFilter = filter === "all" || (filter === "published" ? form.published : !form.published);
    return matchesFilter && form.title.toLocaleLowerCase().includes(normalizedQuery);
  });
}
