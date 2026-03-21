import { CardColor } from "../../types/card";
import { ResolvedTheme } from "../../settings/AppSettingsContext";

export interface CardColorOption {
  id: CardColor;
  light: {
    surface: string;
    border: string;
    text: string;
    subtleText: string;
  };
  dark: {
    surface: string;
    border: string;
    text: string;
    subtleText: string;
  };
}

export const CARD_COLOR_OPTIONS: CardColorOption[] = [
  {
    id: "blue",
    light: { surface: "#e5eeff", border: "#7ea5ff", text: "#123f9a", subtleText: "#2d5fbe" },
    dark: { surface: "#1d3a74", border: "#5f8fff", text: "#edf3ff", subtleText: "#cddfff" }
  },
  {
    id: "sky",
    light: { surface: "#e6f6ff", border: "#6fc8ff", text: "#0b537c", subtleText: "#247aaa" },
    dark: { surface: "#145274", border: "#54b7f6", text: "#e6f7ff", subtleText: "#bce7ff" }
  },
  {
    id: "teal",
    light: { surface: "#e5fffa", border: "#51d9c3", text: "#0a5f54", subtleText: "#288478" },
    dark: { surface: "#14685e", border: "#3fc7b1", text: "#e7fff9", subtleText: "#bdf3e8" }
  },
  {
    id: "mint",
    light: { surface: "#e8fff1", border: "#68df96", text: "#0f6539", subtleText: "#2f8d5b" },
    dark: { surface: "#15623a", border: "#4fc17b", text: "#ebfff2", subtleText: "#c7f7d7" }
  },
  {
    id: "green",
    light: { surface: "#e7fce9", border: "#65cf6b", text: "#1c6219", subtleText: "#3c8a3b" },
    dark: { surface: "#2a6421", border: "#56b258", text: "#efffed", subtleText: "#ccf2c7" }
  },
  {
    id: "lime",
    light: { surface: "#f4ffd8", border: "#b8de3c", text: "#4f6404", subtleText: "#6f890f" },
    dark: { surface: "#566517", border: "#9fbc3d", text: "#f6ffd8", subtleText: "#deef9f" }
  },
  {
    id: "yellow",
    light: { surface: "#fff8cc", border: "#ffd43f", text: "#6a4c00", subtleText: "#946800" },
    dark: { surface: "#6a5312", border: "#d8ae2f", text: "#fff6d4", subtleText: "#ffe5a2" }
  },
  {
    id: "amber",
    light: { surface: "#fff1cc", border: "#ffbe4d", text: "#703f00", subtleText: "#985d00" },
    dark: { surface: "#6d4315", border: "#d48b2e", text: "#fff0da", subtleText: "#ffd29f" }
  },
  {
    id: "orange",
    light: { surface: "#ffe9db", border: "#ff9a53", text: "#7a3100", subtleText: "#b15719" },
    dark: { surface: "#7a3913", border: "#db7836", text: "#fff0e7", subtleText: "#ffd1b6" }
  },
  {
    id: "red",
    light: { surface: "#ffe2e4", border: "#ff7c87", text: "#8b1c2b", subtleText: "#b53c4b" },
    dark: { surface: "#7a1f2b", border: "#d65462", text: "#ffecef", subtleText: "#ffc4cb" }
  },
  {
    id: "pink",
    light: { surface: "#ffe5f3", border: "#ff83cb", text: "#8a1e5a", subtleText: "#ba3f7d" },
    dark: { surface: "#712649", border: "#d85f9c", text: "#ffeaf5", subtleText: "#ffc9e1" }
  },
  {
    id: "purple",
    light: { surface: "#f1e7ff", border: "#b48cff", text: "#5427a7", subtleText: "#7a4ac8" },
    dark: { surface: "#4b2a7b", border: "#8b63de", text: "#f6efff", subtleText: "#dccbff" }
  },
  {
    id: "indigo",
    light: { surface: "#e8ebff", border: "#8f9eff", text: "#2b3d8f", subtleText: "#4b5dbf" },
    dark: { surface: "#283c80", border: "#6479db", text: "#edf1ff", subtleText: "#cad3ff" }
  },
  {
    id: "brown",
    light: { surface: "#f5e8dd", border: "#d0a47f", text: "#5d3920", subtleText: "#8b5c3d" },
    dark: { surface: "#5b3a24", border: "#a0714a", text: "#f8efe8", subtleText: "#e8ccb7" }
  },
  {
    id: "gray",
    light: { surface: "#edf1f7", border: "#b0bdd0", text: "#253246", subtleText: "#4f617b" },
    dark: { surface: "#354153", border: "#6b7f9a", text: "#f0f4fa", subtleText: "#cbd7e8" }
  }
];

const colorMap = new Map(CARD_COLOR_OPTIONS.map((color) => [color.id, color]));

const LEGACY_COLOR_MAP: Record<string, CardColor> = {
  neutral: "gray"
};

export const DEFAULT_CARD_COLOR: CardColor = "blue";

export const getCardColorOption = (color: CardColor | undefined, theme: ResolvedTheme) => {
  const selected = colorMap.get(color ?? DEFAULT_CARD_COLOR) ?? colorMap.get(DEFAULT_CARD_COLOR)!;
  return selected[theme];
};

export const normalizeCardColor = (color: string | undefined): CardColor => {
  if (!color) {
    return DEFAULT_CARD_COLOR;
  }
  if (colorMap.has(color as CardColor)) {
    return color as CardColor;
  }
  if (LEGACY_COLOR_MAP[color]) {
    return LEGACY_COLOR_MAP[color];
  }
  return DEFAULT_CARD_COLOR;
};
