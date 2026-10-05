// src/components/search-form.tsx
// Search box for institutions and cities (plain form, works without JavaScript).

import Form from "next/form";
import { inputClass } from "./ui";

export function SearchForm({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <Form action="/search" className="flex gap-2">
      <input
        name="q"
        defaultValue={defaultValue}
        placeholder="Search an institution or city"
        aria-label="Search an institution or city"
        className={inputClass}
      />
      <button type="submit" className="rounded-lg border border-border px-4 text-sm hover:border-muted">
        Search
      </button>
    </Form>
  );
}
