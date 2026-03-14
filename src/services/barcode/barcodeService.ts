import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { BarcodeFormat } from "@zxing/library";
import { BarcodeType } from "../../types/card";

export const BARCODE_TYPES: BarcodeType[] = ["EAN13", "CODE128", "QR"];

export const normalizeScannedBarcodeType = (
  format: BarcodeFormat | string
): BarcodeType => {
  const value = (typeof format === "string" ? format : BarcodeFormat[format]).toUpperCase();
  if (value === "EAN_13" || value === "EAN13") {
    return "EAN13";
  }
  if (value === "QR_CODE" || value === "QR") {
    return "QR";
  }
  if (value === "CODE_128" || value === "CODE128") {
    return "CODE128";
  }
  return "CODE128";
};

export const renderLinearBarcode = (
  svgElement: SVGSVGElement,
  number: string,
  barcodeType: "EAN13" | "CODE128",
  options?: Partial<JsBarcode.Options>
): void => {
  JsBarcode(svgElement, number, {
    format: barcodeType,
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

export const calculateEan13CheckDigit = (digits12: string): string => {
  const sum = digits12
    .split("")
    .map(Number)
    .reduce((acc, digit, index) => acc + digit * (index % 2 === 0 ? 1 : 3), 0);
  return ((10 - (sum % 10)) % 10).toString();
};

export const isValidEan13 = (value: string): boolean => {
  if (!DIGITS_ONLY.test(value) || value.length !== 13) {
    return false;
  }
  return calculateEan13CheckDigit(value.slice(0, 12)) === value[12];
};

export const normalizeBarcodeNumber = (
  value: string,
  barcodeType: BarcodeType
): { value: string; errorCode: "ean_digits" | "ean_checksum" | null } => {
  const trimmed = value.trim();

  if (barcodeType !== "EAN13") {
    return { value: trimmed, errorCode: null };
  }

  if (!DIGITS_ONLY.test(trimmed) || (trimmed.length !== 12 && trimmed.length !== 13)) {
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
};

export const getRenderableBarcodeNumber = (
  value: string,
  barcodeType: BarcodeType
): string => {
  if (barcodeType !== "EAN13") {
    return value;
  }

  const digits = value.trim();
  if (!DIGITS_ONLY.test(digits) || digits.length < 12) {
    return digits;
  }

  const base = digits.slice(0, 12);
  return `${base}${calculateEan13CheckDigit(base)}`;
};
