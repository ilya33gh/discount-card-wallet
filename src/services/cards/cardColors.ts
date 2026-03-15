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
      surface: "#dcebff",
      border: "#8fc1ff",
      text: "#0a3470",
      subtleText: "#2a6cc2"
    },
    dark: {
      surface: "#1b3f6b",
      border: "#4f8fd1",
      text: "#eef6ff",
      subtleText: "#cde3ff"
    }
  },
  {
    id: "sky",
    light: {
      surface: "#e0f4ff",
      border: "#9ad8ff",
      text: "#0b4b6e",
      subtleText: "#2a7fb0"
    },
    dark: {
      surface: "#1a455a",
      border: "#4aa3c8",
      text: "#e9f8ff",
      subtleText: "#bfe9ff"
    }
  },
  {
    id: "teal",
    light: {
      surface: "#e2faf6",
      border: "#96e3d7",
      text: "#0f4c45",
      subtleText: "#2c7b72"
    },
    dark: {
      surface: "#184a44",
      border: "#3f8f86",
      text: "#e8fbf7",
      subtleText: "#bdebe2"
    }
  },
  {
    id: "mint",
    light: {
      surface: "#e6fde9",
      border: "#9ee9b0",
      text: "#145130",
      subtleText: "#2e7b48"
    },
    dark: {
      surface: "#1c4b32",
      border: "#4f9a69",
      text: "#ecfdf1",
      subtleText: "#c9f1d7"
    }
  },
  {
    id: "green",
    light: {
      surface: "#e0f9ea",
      border: "#8fdfad",
      text: "#134a2a",
      subtleText: "#2f7f52"
    },
    dark: {
      surface: "#1d4b35",
      border: "#4a996e",
      text: "#ebfbf2",
      subtleText: "#c5f0d5"
    }
  },
  {
    id: "lime",
    light: {
      surface: "#f0ffd9",
      border: "#c8ef7a",
      text: "#486100",
      subtleText: "#6f8b1a"
    },
    dark: {
      surface: "#3f4f1a",
      border: "#8db343",
      text: "#f1f8d8",
      subtleText: "#d9f2a3"
    }
  },
  {
    id: "yellow",
    light: {
      surface: "#fff6cc",
      border: "#ffd36b",
      text: "#6a4a00",
      subtleText: "#a06b00"
    },
    dark: {
      surface: "#5a4512",
      border: "#c9a133",
      text: "#fff5d6",
      subtleText: "#ffe1a0"
    }
  },
  {
    id: "amber",
    light: {
      surface: "#ffefcf",
      border: "#ffc36b",
      text: "#6f3c00",
      subtleText: "#a96500"
    },
    dark: {
      surface: "#5b3b14",
      border: "#c98a2f",
      text: "#fff0d8",
      subtleText: "#ffd2a3"
    }
  },
  {
    id: "orange",
    light: {
      surface: "#ffe8d9",
      border: "#ffb673",
      text: "#6b2f0b",
      subtleText: "#b35b2a"
    },
    dark: {
      surface: "#6a351b",
      border: "#b66834",
      text: "#fff0e6",
      subtleText: "#ffd2b1"
    }
  },
  {
    id: "red",
    light: {
      surface: "#ffe1e5",
      border: "#ff9fb0",
      text: "#7a1020",
      subtleText: "#b13a4c"
    },
    dark: {
      surface: "#5b1e27",
      border: "#c44a5e",
      text: "#ffe9ee",
      subtleText: "#f2b6c4"
    }
  },
  {
    id: "pink",
    light: {
      surface: "#ffe6f3",
      border: "#ffadd9",
      text: "#7a1a4b",
      subtleText: "#b33b74"
    },
    dark: {
      surface: "#5a213b",
      border: "#c05286",
      text: "#ffeaf5",
      subtleText: "#f7b6db"
    }
  },
  {
    id: "purple",
    light: {
      surface: "#efe6ff",
      border: "#c6a8ff",
      text: "#4b2c85",
      subtleText: "#7a55bf"
    },
    dark: {
      surface: "#45316b",
      border: "#7a5db0",
      text: "#f6efff",
      subtleText: "#e0cffc"
    }
  },
  {
    id: "indigo",
    light: {
      surface: "#e7e9ff",
      border: "#b2b8ff",
      text: "#2d3b7a",
      subtleText: "#4c5bb3"
    },
    dark: {
      surface: "#2a315a",
      border: "#5c6bc7",
      text: "#eef0ff",
      subtleText: "#c8cdfc"
    }
  },
  {
    id: "brown",
    light: {
      surface: "#f4e9df",
      border: "#d9b89a",
      text: "#5b3a22",
      subtleText: "#8b5c3b"
    },
    dark: {
      surface: "#4a3222",
      border: "#9a6c4b",
      text: "#f8efe7",
      subtleText: "#e7cbb2"
    }
  },
  {
    id: "gray",
    light: {
      surface: "#f4f5f8",
      border: "#c0c5d1",
      text: "#1b1d20",
      subtleText: "#5a5f6c"
    },
    dark: {
      surface: "#3f424a",
      border: "#7a808f",
      text: "#ffffff",
      subtleText: "#d7dde7"
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