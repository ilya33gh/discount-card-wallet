export type BarcodeType = "EAN13" | "CODE128" | "QR";
export type CardColor = "blue" | "sky" | "teal" | "mint" | "green" | "lime" | "yellow" | "amber" | "orange" | "red" | "pink" | "purple" | "indigo" | "brown" | "gray";
export type CardCategory =
  | "grocery"
  | "pharmacy"
  | "fashion"
  | "fuel"
  | "cafe"
  | "electronics"
  | "other";

export interface Card {
  id: string;
  name: string;
  number: string;
  barcodeType: BarcodeType;
  cardColor: CardColor;
  category: CardCategory;
  favorite: boolean;
  notes: string;
  logoDataUrl: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  usageCount: number;
  lastUsedAt: number | null;
}

export interface CardCreateInput {
  name: string;
  number: string;
  barcodeType: BarcodeType;
  cardColor?: CardColor;
  category?: CardCategory;
  notes?: string;
  logoDataUrl?: string | null;
  favorite?: boolean;
}

export interface CardUpdateInput {
  name?: string;
  number?: string;
  barcodeType?: BarcodeType;
  cardColor?: CardColor;
  category?: CardCategory;
  notes?: string;
  logoDataUrl?: string | null;
  favorite?: boolean;
}
