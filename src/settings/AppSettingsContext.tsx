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
export type ThemePreset =
  | "vscode-dark"
  | "vscode-light"
  | "oled"
  | "dracula"
  | "monokai"
  | "solarized-dark"
  | "github-light";
export type ThemeMode = "system" | ThemePreset;
export type ResolvedTheme = "light" | "dark";

interface AppSettingsContextValue {
  localeMode: LocaleMode;
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  resolvedThemePreset: ThemePreset;
  setLocaleMode: (value: LocaleMode) => void;
  setThemeMode: (value: ThemeMode) => void;
}

const LOCALE_KEY = "dcw.locale_mode";
const THEME_KEY = "dcw.theme_mode";

const DARK_SYSTEM_PRESET: ThemePreset = "vscode-dark";
const LIGHT_SYSTEM_PRESET: ThemePreset = "vscode-light";

const THEME_TONES: Record<ThemePreset, ResolvedTheme> = {
  "vscode-dark": "dark",
  "vscode-light": "light",
  oled: "dark",
  dracula: "dark",
  monokai: "dark",
  "solarized-dark": "dark",
  "github-light": "light"
};

export const THEME_PRESET_OPTIONS: ThemePreset[] = [
  "vscode-dark",
  "vscode-light",
  "oled",
  "dracula",
  "monokai",
  "solarized-dark",
  "github-light"
];

const detectSystemTheme = (): ResolvedTheme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const isThemePreset = (value: string | null): value is ThemePreset =>
  value !== null && THEME_PRESET_OPTIONS.includes(value as ThemePreset);

const normalizeSavedThemeMode = (value: string | null): ThemeMode => {
  if (value === "system") {
    return "system";
  }
  if (value === "light") {
    return LIGHT_SYSTEM_PRESET;
  }
  if (value === "dark") {
    return DARK_SYSTEM_PRESET;
  }
  if (isThemePreset(value)) {
    return value;
  }
  return "system";
};

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
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(detectSystemTheme);

  useEffect(() => {
    safeStorage.setItem(LOCALE_KEY, localeMode);
  }, [localeMode]);

  useEffect(() => {
    safeStorage.setItem(THEME_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => setSystemTheme(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  const resolvedThemePreset: ThemePreset =
    themeMode === "system"
      ? systemTheme === "dark"
        ? DARK_SYSTEM_PRESET
        : LIGHT_SYSTEM_PRESET
      : themeMode;

  const resolvedTheme = THEME_TONES[resolvedThemePreset];

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedThemePreset;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme, resolvedThemePreset]);

  const value = useMemo(
    () => ({
      localeMode,
      themeMode,
      resolvedTheme,
      resolvedThemePreset,
      setLocaleMode,
      setThemeMode
    }),
    [localeMode, themeMode, resolvedTheme, resolvedThemePreset]
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
