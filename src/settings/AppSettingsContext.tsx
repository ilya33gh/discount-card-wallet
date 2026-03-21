import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { safeStorage } from "../utils/safeStorage";

export type LocaleMode = "system" | "en" | "ru" | "cv";
export type ThemeMode = "system" | "light" | "dark" | "oled";
export type ResolvedThemeMode = "light" | "dark" | "oled";
export type ResolvedTheme = "light" | "dark";
export type AccentColor =
  | "blue"
  | "cyan"
  | "teal"
  | "green"
  | "lime"
  | "yellow"
  | "orange"
  | "red"
  | "pink"
  | "violet";

interface AccentTokens {
  accent: string;
  accentSoftLight: string;
  accentSoftDark: string;
  accentRing: string;
  accentTextLight: string;
  accentTextDark: string;
}

interface AppSettingsContextValue {
  localeMode: LocaleMode;
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  resolvedThemeMode: ResolvedThemeMode;
  accentColor: AccentColor;
  setLocaleMode: (value: LocaleMode) => void;
  setThemeMode: (value: ThemeMode) => void;
  setAccentColor: (value: AccentColor) => void;
}

const LOCALE_KEY = "dcw.locale_mode";
const THEME_KEY = "dcw.theme_mode";
const ACCENT_KEY = "dcw.accent_color";

const LEGACY_LIGHT_THEMES = new Set(["vscode-light", "github-light", "light"]);
const LEGACY_DARK_THEMES = new Set([
  "vscode-dark",
  "dracula",
  "monokai",
  "solarized-dark",
  "dark"
]);

export const ACCENT_COLOR_OPTIONS: AccentColor[] = [
  "blue",
  "cyan",
  "teal",
  "green",
  "lime",
  "yellow",
  "orange",
  "red",
  "pink",
  "violet"
];

const ACCENT_COLOR_TOKENS: Record<AccentColor, AccentTokens> = {
  blue: {
    accent: "#2f6bff",
    accentSoftLight: "#eaf0ff",
    accentSoftDark: "rgba(47, 107, 255, 0.24)",
    accentRing: "rgba(47, 107, 255, 0.28)",
    accentTextLight: "#1840aa",
    accentTextDark: "#dee8ff"
  },
  cyan: {
    accent: "#1493ff",
    accentSoftLight: "#e7f4ff",
    accentSoftDark: "rgba(20, 147, 255, 0.24)",
    accentRing: "rgba(20, 147, 255, 0.3)",
    accentTextLight: "#0b5ca8",
    accentTextDark: "#dff0ff"
  },
  teal: {
    accent: "#0b9f95",
    accentSoftLight: "#e5f8f6",
    accentSoftDark: "rgba(11, 159, 149, 0.24)",
    accentRing: "rgba(11, 159, 149, 0.3)",
    accentTextLight: "#086b65",
    accentTextDark: "#d7f8f3"
  },
  green: {
    accent: "#0ea66c",
    accentSoftLight: "#e9f9f2",
    accentSoftDark: "rgba(14, 166, 108, 0.24)",
    accentRing: "rgba(14, 166, 108, 0.28)",
    accentTextLight: "#07724b",
    accentTextDark: "#daf8ea"
  },
  lime: {
    accent: "#78b700",
    accentSoftLight: "#f2fbde",
    accentSoftDark: "rgba(120, 183, 0, 0.24)",
    accentRing: "rgba(120, 183, 0, 0.3)",
    accentTextLight: "#507a00",
    accentTextDark: "#e8f9cb"
  },
  yellow: {
    accent: "#d7a700",
    accentSoftLight: "#fff6d9",
    accentSoftDark: "rgba(215, 167, 0, 0.24)",
    accentRing: "rgba(215, 167, 0, 0.3)",
    accentTextLight: "#8f6d00",
    accentTextDark: "#ffefbf"
  },
  orange: {
    accent: "#ff7a1a",
    accentSoftLight: "#fff1e6",
    accentSoftDark: "rgba(255, 122, 26, 0.24)",
    accentRing: "rgba(255, 122, 26, 0.28)",
    accentTextLight: "#c95800",
    accentTextDark: "#ffe9d6"
  },
  red: {
    accent: "#e1494e",
    accentSoftLight: "#ffebec",
    accentSoftDark: "rgba(225, 73, 78, 0.24)",
    accentRing: "rgba(225, 73, 78, 0.3)",
    accentTextLight: "#a1262b",
    accentTextDark: "#ffdfe1"
  },
  pink: {
    accent: "#de4aa4",
    accentSoftLight: "#ffe9f7",
    accentSoftDark: "rgba(222, 74, 164, 0.24)",
    accentRing: "rgba(222, 74, 164, 0.3)",
    accentTextLight: "#9f2f73",
    accentTextDark: "#ffdff3"
  },
  violet: {
    accent: "#7a4dff",
    accentSoftLight: "#f1ebff",
    accentSoftDark: "rgba(122, 77, 255, 0.24)",
    accentRing: "rgba(122, 77, 255, 0.28)",
    accentTextLight: "#5025bf",
    accentTextDark: "#ece2ff"
  }
};

export const ACCENT_COLOR_SWATCH: Record<AccentColor, string> = {
  blue: "#2f6bff",
  cyan: "#1493ff",
  teal: "#0b9f95",
  green: "#0ea66c",
  lime: "#78b700",
  yellow: "#d7a700",
  orange: "#ff7a1a",
  red: "#e1494e",
  pink: "#de4aa4",
  violet: "#7a4dff"
};

const LEGACY_ACCENT_MAP: Record<string, AccentColor> = {
  rose: "pink"
};

const detectSystemTheme = (): ResolvedTheme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const normalizeSavedThemeMode = (value: string | null): ThemeMode => {
  if (value === "system" || value === "light" || value === "dark" || value === "oled") {
    return value;
  }
  if (value && LEGACY_LIGHT_THEMES.has(value)) {
    return "light";
  }
  if (value && LEGACY_DARK_THEMES.has(value)) {
    return "dark";
  }
  return "system";
};

const normalizeSavedAccentColor = (value: string | null): AccentColor =>
  value && ACCENT_COLOR_OPTIONS.includes(value as AccentColor)
    ? (value as AccentColor)
    : value && LEGACY_ACCENT_MAP[value]
      ? LEGACY_ACCENT_MAP[value]
    : "blue";

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export const AppSettingsProvider = ({ children }: PropsWithChildren) => {
  const [localeMode, setLocaleMode] = useState<LocaleMode>(() => {
    const saved = safeStorage.getItem(LOCALE_KEY);
    return saved === "en" || saved === "ru" || saved === "cv" || saved === "system"
      ? saved
      : "system";
  });
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    normalizeSavedThemeMode(safeStorage.getItem(THEME_KEY))
  );
  const [accentColor, setAccentColor] = useState<AccentColor>(() =>
    normalizeSavedAccentColor(safeStorage.getItem(ACCENT_KEY))
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(detectSystemTheme);

  useEffect(() => {
    safeStorage.setItem(LOCALE_KEY, localeMode);
  }, [localeMode]);

  useEffect(() => {
    safeStorage.setItem(THEME_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    safeStorage.setItem(ACCENT_KEY, accentColor);
  }, [accentColor]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => setSystemTheme(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  const resolvedThemeMode: ResolvedThemeMode =
    themeMode === "system" ? (systemTheme === "dark" ? "dark" : "light") : themeMode;

  const resolvedTheme: ResolvedTheme = resolvedThemeMode === "light" ? "light" : "dark";

  useEffect(() => {
    const root = document.documentElement;
    const accent = ACCENT_COLOR_TOKENS[accentColor];

    root.dataset.theme = resolvedThemeMode;
    root.style.colorScheme = resolvedTheme;
    root.style.setProperty("--accent", accent.accent);
    root.style.setProperty(
      "--accent-soft",
      resolvedThemeMode === "light" ? accent.accentSoftLight : accent.accentSoftDark
    );
    root.style.setProperty("--accent-ring", accent.accentRing);
    root.style.setProperty(
      "--accent-text",
      resolvedThemeMode === "light" ? accent.accentTextLight : accent.accentTextDark
    );

    const themeColor =
      resolvedThemeMode === "light"
        ? "#f4f7ff"
        : resolvedThemeMode === "oled"
          ? "#000000"
          : "#1a1b1f";
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", themeColor);
    }
  }, [resolvedTheme, resolvedThemeMode, accentColor]);

  const value = useMemo(
    () => ({
      localeMode,
      themeMode,
      resolvedTheme,
      resolvedThemeMode,
      accentColor,
      setLocaleMode,
      setThemeMode,
      setAccentColor
    }),
    [localeMode, themeMode, resolvedTheme, resolvedThemeMode, accentColor]
  );

  return (
    <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
  );
};

export const useAppSettings = (): AppSettingsContextValue => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within AppSettingsProvider");
  }
  return context;
};
