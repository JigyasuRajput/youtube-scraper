"use client";

import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { locale, toggleLocale } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      className="gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802"
        />
      </svg>
      <span className={locale === "ja" ? "font-bold text-foreground" : ""}>
        JA
      </span>
      <span className="text-muted-foreground/40">/</span>
      <span className={locale === "en" ? "font-bold text-foreground" : ""}>
        EN
      </span>
    </Button>
  );
}
