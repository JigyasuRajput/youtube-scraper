"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchFormProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full items-center gap-2 rounded-xl border bg-card p-2 shadow-sm transition-shadow focus-within:shadow-md"
    >
      <div className="flex flex-1 items-center gap-2 pl-2">
        <svg
          className="h-4 w-4 shrink-0 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          disabled={isLoading}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </div>
      <Button
        type="submit"
        disabled={isLoading || !query.trim()}
        size="sm"
        className="shrink-0 rounded-lg px-5"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t.analyzing}
          </span>
        ) : (
          t.searchButton
        )}
      </Button>
    </form>
  );
}
