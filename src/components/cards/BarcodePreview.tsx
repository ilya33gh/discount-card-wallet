import { useEffect, useRef, useState } from "react";
import { Card } from "../../types/card";
import {
  createQrSvg,
  getRenderableBarcodeNumber,
  isLinearBarcodeType,
  renderLinearBarcode
} from "../../services/barcode/barcodeService";
import styles from "./BarcodePreview.module.css";

interface BarcodePreviewProps {
  card: Pick<Card, "number" | "barcodeType" | "name">;
}

export const BarcodePreview = ({ card }: BarcodePreviewProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [qrMarkup, setQrMarkup] = useState<string>("");

  useEffect(() => {
    if (card.barcodeType === "QR") {
      createQrSvg(card.number, "#f3fcf8")
        .then(setQrMarkup)
        .catch(() => setQrMarkup(""));
      return;
    }

    if (!svgRef.current || !isLinearBarcodeType(card.barcodeType)) {
      return;
    }

    try {
      renderLinearBarcode(
        svgRef.current,
        getRenderableBarcodeNumber(card.number, card.barcodeType),
        card.barcodeType,
        {
          width: 1,
          height: 30
        }
      );
    } catch {
      svgRef.current.textContent = "";
    }
  }, [card.barcodeType, card.number]);

  if (card.barcodeType === "QR") {
    return qrMarkup ? (
      <div
        className={styles.preview}
        dangerouslySetInnerHTML={{ __html: qrMarkup }}
        aria-label={`${card.name} QR preview`}
      />
    ) : (
      <div className={styles.preview}>QR</div>
    );
  }

  return (
    <div className={styles.preview}>
      <svg ref={svgRef} className={styles.svg} aria-label={`${card.name} barcode preview`} />
    </div>
  );
};
