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
    light: {
      surface: "#e9f2ff",
      border: "#b6d7ff",
      text: "#0b3a75",
      subtleText: "#3168b0"
    },
    dark: {
      surface: "#17345a",
      border: "#376ea7",
      text: "#e4f1ff",
      subtleText: "#b8d5ff"
    }
  },
  {
    id: "green",
    light: {
      surface: "#e7f8ee",
      border: "#bde6cb",
      text: "#16492d",
      subtleText: "#3a7a57"
    },
    dark: {
      surface: "#1c4230",
      border: "#3f7a5d",
      text: "#e2f6ea",
      subtleText: "#b6e2c7"
    }
  },
  {
    id: "orange",
    light: {
      surface: "#fff2e6",
      border: "#ffd6b0",
      text: "#6a3412",
      subtleText: "#a3592d"
    },
    dark: {
      surface: "#5e321c",
      border: "#9a5b33",
      text: "#ffecde",
      subtleText: "#f5c9a8"
    }
  },
  {
    id: "purple",
    light: {
      surface: "#f1edff",
      border: "#d5c7ff",
      text: "#4a2d7d",
      subtleText: "#6f50a8"
    },
    dark: {
      surface: "#3c2d5e",
      border: "#67508f",
      text: "#f0e8ff",
      subtleText: "#d2c1f5"
    }
  },
  {
    id: "gray",
    light: {
      surface: "#f2f2f7",
      border: "#d1d1d6",
      text: "#1c1c1e",
      subtleText: "#636366"
    },
    dark: {
      surface: "#3a3a3c",
      border: "#636366",
      text: "#ffffff",
      subtleText: "#d1d1d6"
    }
  }
];

const colorMap = new Map(CARD_COLOR_OPTIONS.map((color) => [color.id, color]));

export const DEFAULT_CARD_COLOR: CardColor = "blue";

export const getCardColorOption = (
  color: CardColor | undefined,
  theme: ResolvedTheme
) => {
  const selected = colorMap.get(color ?? DEFAULT_CARD_COLOR) ?? colorMap.get(DEFAULT_CARD_COLOR)!;
  return selected[theme];
};

export const normalizeCardColor = (color: string | undefined): CardColor =>
  colorMap.has(color as CardColor) ? (color as CardColor) : DEFAULT_CARD_COLOR;
