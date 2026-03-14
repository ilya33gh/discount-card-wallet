import { BarcodeType, CardCreateInput, CardUpdateInput } from "../types/card";
import { normalizeBarcodeNumber } from "../services/barcode/barcodeService";

export interface ValidationResult {
  isValid: boolean;
  errors: Partial<Record<"name" | "number", string>>;
}

export interface ValidationMessages {
  storeRequired: string;
  numberRequired: string;
  eanDigits: string;
  eanChecksum: string;
  code128Length: string;
  qrLength: string;
}

export const sanitizeText = (value: string, maxLength = 200): string =>
  value.trim().replace(/\s+/g, " ").slice(0, maxLength);

export const sanitizeCardInput = (
  input: CardCreateInput | CardUpdateInput
): CardCreateInput | CardUpdateInput => {
  const result: CardCreateInput | CardUpdateInput = { ...input };

  if (typeof result.name === "string") {
    result.name = sanitizeText(result.name, 80);
  }
  if (typeof result.number === "string") {
    result.number = sanitizeText(result.number, 80);
  }
  if (typeof result.notes === "string") {
    result.notes = sanitizeText(result.notes, 400);
  }

  return result;
};

export const validateCardInput = (
  name: string,
  number: string,
  barcodeType: BarcodeType,
  messages: ValidationMessages
): ValidationResult => {
  const errors: ValidationResult["errors"] = {};

  if (!name.trim()) {
    errors.name = messages.storeRequired;
  }

  if (!number.trim()) {
    errors.number = messages.numberRequired;
  } else if (barcodeType === "EAN13") {
    const result = normalizeBarcodeNumber(number, barcodeType);
    if (result.errorCode === "ean_digits") {
      errors.number = messages.eanDigits;
    } else if (result.errorCode === "ean_checksum") {
      errors.number = messages.eanChecksum;
    }
  } else if (barcodeType === "CODE128" && number.length > 80) {
    errors.number = messages.code128Length;
  } else if (barcodeType === "QR" && number.length > 512) {
    errors.number = messages.qrLength;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
