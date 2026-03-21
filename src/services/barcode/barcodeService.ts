import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { BarcodeFormat } from "@zxing/library";
import { BarcodeType } from "../../types/card";

type LinearBarcodeType = Exclude<BarcodeType, "QR">;

const JSBAR_FORMAT: Record<LinearBarcodeType, string> = {
  EAN13: "EAN13",
  EAN8: "EAN8",
  UPC: "UPC",
  CODE128: "CODE128",
  CODE39: "CODE39",
  ITF14: "ITF14",
  CODABAR: "codabar"
};

export const BARCODE_TYPES: BarcodeType[] = [
  "EAN13",
  "EAN8",
  "UPC",
  "CODE128",
  "CODE39",
  "ITF14",
  "CODABAR",
  "QR"
];

export const normalizeScannedBarcodeType = (format: BarcodeFormat | string): BarcodeType => {
  const value = (typeof format === "string" ? format : BarcodeFormat[format]).toUpperCase();

  if (value === "EAN_13" || value === "EAN13") {
    return "EAN13";
  }
  if (value === "EAN_8" || value === "EAN8") {
    return "EAN8";
  }
  if (value === "UPC_A" || value === "UPCA" || value === "UPC") {
    return "UPC";
  }
  if (value === "QR_CODE" || value === "QR") {
    return "QR";
  }
  if (value === "CODE_39" || value === "CODE39") {
    return "CODE39";
  }
  if (value === "ITF" || value === "ITF14") {
    return "ITF14";
  }
  if (value === "CODABAR") {
    return "CODABAR";
  }
  if (value === "CODE_128" || value === "CODE128") {
    return "CODE128";
  }

  return "CODE128";
};

export const renderLinearBarcode = (
  svgElement: SVGSVGElement,
  number: string,
  barcodeType: LinearBarcodeType,
  options?: Partial<JsBarcode.Options>
): void => {
  JsBarcode(svgElement, number, {
    format: JSBAR_FORMAT[barcodeType],
    displayValue: false,
    margin: 0,
    width: 2,
    height: 90,
    background: "transparent",
    lineColor: "#f9f9f9",
    ...options
  });
};

export const createQrSvg = async (
  value: string,
  color = "#f9f9f9",
  background = "#00000000"
): Promise<string> =>
  QRCode.toString(value, {
    type: "svg",
    color: {
      dark: color,
      light: background
    },
    margin: 1,
    width: 320
  });

const DIGITS_ONLY = /^\d+$/;
const GTIN_EAN13 = /^\d{12,13}$/;
const GTIN_EAN8 = /^\d{7,8}$/;
const GTIN_UPC = /^\d{11,12}$/;
const GTIN_ITF14 = /^\d{13,14}$/;

const calculateWeightedCheckDigit = (baseDigits: string): string => {
  const sum = baseDigits
    .split("")
    .reverse()
    .reduce((acc, digit, index) => acc + Number(digit) * (index % 2 === 0 ? 3 : 1), 0);
  return ((10 - (sum % 10)) % 10).toString();
};

export const calculateEan13CheckDigit = (digits12: string): string =>
  calculateWeightedCheckDigit(digits12);

const calculateEan8CheckDigit = (digits7: string): string =>
  calculateWeightedCheckDigit(digits7);

const calculateUpcCheckDigit = (digits11: string): string =>
  calculateWeightedCheckDigit(digits11);

const calculateItf14CheckDigit = (digits13: string): string =>
  calculateWeightedCheckDigit(digits13);

export const isValidEan13 = (value: string): boolean => {
  if (!DIGITS_ONLY.test(value) || value.length !== 13) {
    return false;
  }
  return calculateEan13CheckDigit(value.slice(0, 12)) === value[12];
};

const isValidEan8 = (value: string): boolean => {
  if (!DIGITS_ONLY.test(value) || value.length !== 8) {
    return false;
  }
  return calculateEan8CheckDigit(value.slice(0, 7)) === value[7];
};

const isValidUpc = (value: string): boolean => {
  if (!DIGITS_ONLY.test(value) || value.length !== 12) {
    return false;
  }
  return calculateUpcCheckDigit(value.slice(0, 11)) === value[11];
};

const isValidItf14 = (value: string): boolean => {
  if (!DIGITS_ONLY.test(value) || value.length !== 14) {
    return false;
  }
  return calculateItf14CheckDigit(value.slice(0, 13)) === value[13];
};

export type BarcodeNormalizeError =
  | "ean_digits"
  | "ean_checksum"
  | "ean8_digits"
  | "ean8_checksum"
  | "upc_digits"
  | "upc_checksum"
  | "itf14_digits"
  | "itf14_checksum"
  | null;

export const normalizeBarcodeNumber = (
  value: string,
  barcodeType: BarcodeType
): { value: string; errorCode: BarcodeNormalizeError } => {
  const trimmed = value.trim();

  if (barcodeType === "EAN13") {
    if (!GTIN_EAN13.test(trimmed)) {
      return { value: trimmed, errorCode: "ean_digits" };
    }
    if (trimmed.length === 12) {
      return {
        value: `${trimmed}${calculateEan13CheckDigit(trimmed)}`,
        errorCode: null
      };
    }
    if (!isValidEan13(trimmed)) {
      return { value: trimmed, errorCode: "ean_checksum" };
    }
    return { value: trimmed, errorCode: null };
  }

  if (barcodeType === "EAN8") {
    if (!GTIN_EAN8.test(trimmed)) {
      return { value: trimmed, errorCode: "ean8_digits" };
    }
    if (trimmed.length === 7) {
      return {
        value: `${trimmed}${calculateEan8CheckDigit(trimmed)}`,
        errorCode: null
      };
    }
    if (!isValidEan8(trimmed)) {
      return { value: trimmed, errorCode: "ean8_checksum" };
    }
    return { value: trimmed, errorCode: null };
  }

  if (barcodeType === "UPC") {
    if (!GTIN_UPC.test(trimmed)) {
      return { value: trimmed, errorCode: "upc_digits" };
    }
    if (trimmed.length === 11) {
      return {
        value: `${trimmed}${calculateUpcCheckDigit(trimmed)}`,
        errorCode: null
      };
    }
    if (!isValidUpc(trimmed)) {
      return { value: trimmed, errorCode: "upc_checksum" };
    }
    return { value: trimmed, errorCode: null };
  }

  if (barcodeType === "ITF14") {
    if (!GTIN_ITF14.test(trimmed)) {
      return { value: trimmed, errorCode: "itf14_digits" };
    }
    if (trimmed.length === 13) {
      return {
        value: `${trimmed}${calculateItf14CheckDigit(trimmed)}`,
        errorCode: null
      };
    }
    if (!isValidItf14(trimmed)) {
      return { value: trimmed, errorCode: "itf14_checksum" };
    }
    return { value: trimmed, errorCode: null };
  }

  return { value: trimmed, errorCode: null };
};

export const getRenderableBarcodeNumber = (value: string, barcodeType: BarcodeType): string => {
  const normalized = normalizeBarcodeNumber(value, barcodeType);
  return normalized.value;
};

export const isLinearBarcodeType = (value: BarcodeType): value is LinearBarcodeType =>
  value !== "QR";

export const isNumericBarcodeType = (value: BarcodeType): boolean =>
  value === "EAN13" || value === "EAN8" || value === "UPC" || value === "ITF14";
