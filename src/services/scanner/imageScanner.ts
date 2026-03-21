import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import Quagga from "@ericblade/quagga2";
import jsQR from "jsqr";
import { BarcodeType } from "../../types/card";
import { normalizeScannedBarcodeType } from "../barcode/barcodeService";

interface BarcodeDetectorResult {
  format?: string;
  rawValue?: string;
}

interface BarcodeDetectorLike {
  detect: (image: ImageBitmapSource | HTMLImageElement) => Promise<BarcodeDetectorResult[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
}

const MAX_IMAGE_SIDE = 1800;

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image-load-failed"));
    image.src = url;
  });

const createReader = (): BrowserMultiFormatReader => {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.ITF,
    BarcodeFormat.CODABAR,
    BarcodeFormat.QR_CODE
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);

  return new BrowserMultiFormatReader(hints);
};

const toResult = (rawValue: string, format: string | BarcodeFormat): FileScanResult => ({
  number: rawValue.trim(),
  barcodeType: normalizeScannedBarcodeType(format)
});

const tryNativeBarcodeDetector = async (
  image: HTMLImageElement,
  file?: File
): Promise<FileScanResult | null> => {
  const detectorCtor = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector;

  if (!detectorCtor) {
    return null;
  }

  const detector = new detectorCtor({
    formats: ["ean_13", "ean_8", "upc_a", "code_128", "code_39", "itf", "codabar", "qr_code"]
  });

  try {
    if (file && typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(file);
      try {
        const foundFromBitmap = await detector.detect(bitmap);
        const hit = foundFromBitmap.find((item) => item.rawValue?.trim());
        if (hit?.rawValue) {
          return toResult(hit.rawValue, hit.format ?? "CODE_128");
        }
      } finally {
        bitmap.close();
      }
    }

    const found = await detector.detect(image);
    const hit = found.find((item) => item.rawValue?.trim());
    if (hit?.rawValue) {
      return toResult(hit.rawValue, hit.format ?? "CODE_128");
    }

    return null;
  } catch {
    return null;
  }
};

const createCanvasVariant = (
  image: HTMLImageElement,
  rotation: 0 | 90 | 180 | 270,
  enhanced = false
): HTMLCanvasElement => {
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.width, image.height));
  const sourceWidth = Math.max(1, Math.round(image.width * scale));
  const sourceHeight = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  const swapSides = rotation === 90 || rotation === 270;

  canvas.width = swapSides ? sourceHeight : sourceWidth;
  canvas.height = swapSides ? sourceWidth : sourceHeight;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return canvas;
  }

  ctx.imageSmoothingEnabled = true;
  if (enhanced) {
    ctx.filter = "grayscale(1) contrast(1.5)";
  }

  if (rotation === 0) {
    ctx.drawImage(image, 0, 0, sourceWidth, sourceHeight);
  } else if (rotation === 90) {
    ctx.translate(canvas.width, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(image, 0, 0, sourceWidth, sourceHeight);
  } else if (rotation === 180) {
    ctx.translate(canvas.width, canvas.height);
    ctx.rotate(Math.PI);
    ctx.drawImage(image, 0, 0, sourceWidth, sourceHeight);
  } else {
    ctx.translate(0, canvas.height);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(image, 0, 0, sourceWidth, sourceHeight);
  }

  return canvas;
};

const decodeWithJsQr = (canvas: HTMLCanvasElement): FileScanResult | null => {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return null;
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth"
  });

  if (!result?.data?.trim()) {
    return null;
  }

  return toResult(result.data, "QR_CODE");
};

const decodeWithZxing = (reader: BrowserMultiFormatReader, canvas: HTMLCanvasElement): FileScanResult | null => {
  try {
    const result = reader.decodeFromCanvas(canvas);
    const value = result.getText().trim();
    if (!value) {
      return null;
    }

    return toResult(value, result.getBarcodeFormat());
  } catch {
    return null;
  }
};

const decodeWithQuagga = async (canvas: HTMLCanvasElement): Promise<FileScanResult | null> =>
  new Promise((resolve) => {
    Quagga.decodeSingle(
      {
        src: canvas.toDataURL("image/jpeg", 0.92),
        numOfWorkers: 0,
        locate: true,
        inputStream: {
          size: 1200
        },
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "upc_reader",
            "code_128_reader",
            "code_39_reader",
            "codabar_reader",
            "i2of5_reader"
          ]
        }
      },
      (result: any) => {
        const code = result?.codeResult?.code?.trim();
        const format = result?.codeResult?.format;

        if (!code) {
          resolve(null);
          return;
        }

        resolve(toResult(code, format ?? "CODE_128"));
      }
    );
  });

const tryMultiDecoder = async (image: HTMLImageElement): Promise<FileScanResult> => {
  const reader = createReader();
  const rotations: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270];

  for (const enhanced of [false, true]) {
    for (const rotation of rotations) {
      const canvas = createCanvasVariant(image, rotation, enhanced);

      const qrResult = decodeWithJsQr(canvas);
      if (qrResult) {
        return qrResult;
      }

      const zxingResult = decodeWithZxing(reader, canvas);
      if (zxingResult) {
        return zxingResult;
      }

      const quaggaResult = await decodeWithQuagga(canvas);
      if (quaggaResult) {
        return quaggaResult;
      }
    }
  }

  throw new Error("decode-failed");
};

export interface FileScanResult {
  number: string;
  barcodeType: BarcodeType;
}

export const scanBarcodeFromFile = async (file: File): Promise<FileScanResult> => {
  if (!file.type.startsWith("image/")) {
    throw new Error("unsupported-file-type");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);

    const nativeResult = await tryNativeBarcodeDetector(image, file);
    if (nativeResult) {
      return nativeResult;
    }

    return await tryMultiDecoder(image);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
