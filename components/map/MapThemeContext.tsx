"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { MapTheme } from "@/lib/geo/maharashtra";

const MapThemeContext = createContext<MapTheme>("light");

export function MapThemeProvider({
  theme,
  children,
}: {
  theme: MapTheme;
  children: ReactNode;
}) {
  return (
    <MapThemeContext.Provider value={theme}>{children}</MapThemeContext.Provider>
  );
}

export function useMapTheme(): MapTheme {
  return useContext(MapThemeContext);
}
