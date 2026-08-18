"use client";

import { useCallback, useEffect, useMemo } from "react";

export function useQueueNav<T extends { id: string }>(
  items: T[],
  selectedId: string | null,
  onSelect: (id: string) => void,
  enabled: boolean,
) {
  const selectedIndex = useMemo(
    () => (selectedId ? items.findIndex((item) => item.id === selectedId) : -1),
    [items, selectedId],
  );
  const showNav = items.length > 1 && selectedIndex >= 0;
  const canPrev = enabled && showNav && selectedIndex > 0;
  const canNext = enabled && showNav && selectedIndex < items.length - 1;

  const goPrev = useCallback(() => {
    if (!canPrev) return;
    onSelect(items[selectedIndex - 1].id);
  }, [canPrev, items, onSelect, selectedIndex]);

  const goNext = useCallback(() => {
    if (!canNext) return;
    onSelect(items[selectedIndex + 1].id);
  }, [canNext, items, onSelect, selectedIndex]);

  useEffect(() => {
    if (!showNav || !enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        goPrev();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, goNext, goPrev, showNav]);

  return showNav
    ? { onPrev: goPrev, onNext: goNext, canPrev, canNext }
    : {};
}
