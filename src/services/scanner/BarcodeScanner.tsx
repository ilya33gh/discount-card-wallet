import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { BarcodeType } from "../../types/card";
import { normalizeScannedBarcodeType } from "../barcode/barcodeService";
import styles from "./BarcodeScanner.module.css";

interface BarcodeScannerProps {
  onDetected: (payload: { number: string; barcodeType: BarcodeType }) => void;
  onCancel: () => void;
  hint: string;
  errorText: string;
  closeLabel: string;
}

export const BarcodeScanner = ({
  onDetected,
  onCancel,
  hint,
  errorText,
  closeLabel
}: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let active = true;

    const start = async () => {
      if (!videoRef.current) {
        return;
      }

      try {
        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: { facingMode: { ideal: "environment" } }
          },
          videoRef.current,
          (result) => {
            if (!result || !active) {
              return;
            }
            const rawValue = result.getText().trim();
            if (!rawValue) {
              return;
            }

            const barcodeType = normalizeScannedBarcodeType(
              result.getBarcodeFormat()
            );
            controlsRef.current?.stop();
            onDetected({ number: rawValue, barcodeType });
          }
        );
        controlsRef.current = controls;
      } catch {
        setError(errorText);
      }
    };

    start();

    return () => {
      active = false;
      controlsRef.current?.stop();
    };
  }, [onDetected]);

  return (
    <div className={styles.overlay}>
      <div className={styles.cameraShell}>
        <video ref={videoRef} className={styles.video} muted playsInline />
        <div className={styles.statusRow}>
          <span className={error ? styles.error : undefined}>
            {error ?? hint}
          </span>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
