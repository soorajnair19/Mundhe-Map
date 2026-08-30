"use client";

import { Moon, Sun } from "lucide-react";
import type { MapTheme } from "@/lib/geo/maharashtra";

interface ThemeToggleProps {
  theme: MapTheme;
  onChange: (theme: MapTheme) => void;
}

export function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  const next = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--panel)]/95 px-2.5 py-1.5 text-xs font-medium text-[var(--ink)] shadow-sm backdrop-blur-sm hover:border-[var(--border-strong)]"
      aria-label={`Switch to ${next} mode`}
      title="Temporary theme preview"
    >
      {theme === "light" ? (
        <Moon size={14} strokeWidth={2} aria-hidden />
      ) : (
        <Sun size={14} strokeWidth={2} aria-hidden />
      )}
      {next === "dark" ? "Dark" : "Light"}
    </button>
  );
}
