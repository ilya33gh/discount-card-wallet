import { useEffect, useRef, useState } from "react";
import { Card } from "../../types/card";
import {
  createQrSvg,
  getRenderableBarcodeNumber,
  renderLinearBarcode
} from "../../services/barcode/barcodeService";
import { getCardColorOption } from "../../services/cards/cardColors";
import { normalizeCardCategory } from "../../services/cards/cardCategories";
import { useAppSettings } from "../../settings/AppSettingsContext";
import { useI18n } from "../../i18n/useI18n";
import styles from "./CardViewer.module.css";

interface CardViewerProps {
  card: Card;
}

export const CardViewer = ({ card }: CardViewerProps) => {
  const { t } = useI18n();
  const { resolvedTheme } = useAppSettings();
  const palette = getCardColorOption(card.cardColor, resolvedTheme);
  const category = normalizeCardCategory(card.category);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomSvgRef = useRef<SVGSVGElement | null>(null);
  const [qrMarkup, setQrMarkup] = useState<string>("");
  const [isZoomed, setIsZoomed] = useState(false);

  const barcodeType = card.barcodeType;
  const renderableNumber =
    barcodeType === "EAN13" ? getRenderableBarcodeNumber(card.number, "EAN13") : card.number;
  const canRenderEan = barcodeType !== "EAN13" || /^\d{13}$/.test(renderableNumber);

  const renderLinear = (
    target: SVGSVGElement | null,
    options?: { width?: number; height?: number }
  ) => {
    if (!target) {
      return;
    }
    const linearType: "EAN13" | "CODE128" =
      barcodeType === "EAN13" ? "EAN13" : "CODE128";
    try {
      renderLinearBarcode(target, renderableNumber, linearType, {
        width: options?.width ?? 2,
        height: options?.height ?? 108,
        lineColor: "#111111"
      });
    } catch {
      target.textContent = "";
    }
  };

  useEffect(() => {
    if (barcodeType === "QR") {
      createQrSvg(card.number, "#111111", "#ffffff")
        .then(setQrMarkup)
        .catch(() => setQrMarkup(""));
      return;
    }
    renderLinear(svgRef.current);
  }, [barcodeType, renderableNumber, card.number]);

  useEffect(() => {
    if (barcodeType === "QR" || !isZoomed) {
      return;
    }
    renderLinear(zoomSvgRef.current, { width: 2.2, height: 120 });
  }, [barcodeType, renderableNumber, card.number, isZoomed]);

  const barcodeLabel =
    barcodeType === "EAN13"
      ? t.detail.ean13
      : barcodeType === "CODE128"
        ? t.detail.code128
        : t.detail.qr;

  const isCodeAvailable = barcodeType === "QR" || canRenderEan;
  const hasNotes = card.notes.trim().length > 0;

  return (
    <>
      <section className={styles.viewer}>
        <div
          className={styles.walletCard}
          style={{
            background: palette.surface,
            borderColor: palette.border
          }}
        >
          <div className={styles.cardHeader}>
            <h2 className={styles.store} style={{ color: palette.text }}>
              {card.name}
            </h2>
            <p className={styles.number} style={{ color: palette.subtleText }}>
              {card.number}
            </p>
            <p className={styles.meta} style={{ color: palette.subtleText }}>
              {t.detail.category}: {t.form.categories[category]}
            </p>
          </div>

          <article className={styles.codeTile}>
            <p className={styles.codeTitle}>{barcodeLabel}</p>
            <button
              type="button"
              className={styles.codeBody}
              disabled={!isCodeAvailable}
              onClick={() => setIsZoomed(true)}
              aria-label="Zoom code"
            >
              {barcodeType === "QR" ? (
                <div className={styles.qrWrap} dangerouslySetInnerHTML={{ __html: qrMarkup }} />
              ) : canRenderEan ? (
                <svg
                  ref={svgRef}
                  className={styles.svgCode}
                  aria-label={`${card.name} ${barcodeLabel}`}
                />
              ) : (
                <span className={styles.unavailable}>{t.detail.eanUnavailable}</span>
              )}
            </button>
          </article>

          {hasNotes ? (
            <article className={styles.notesBlock}>
              <p className={styles.notesTitle}>{t.detail.notes}</p>
              <p className={styles.notesText}>{card.notes}</p>
            </article>
          ) : null}
        </div>
      </section>

      {isZoomed ? (
        <button type="button" className={styles.zoomOverlay} onClick={() => setIsZoomed(false)}>
          <div className={styles.zoomCard} onClick={(event) => event.stopPropagation()}>
            <p className={styles.zoomTitle}>{barcodeLabel}</p>
            <div className={styles.zoomBody}>
              {barcodeType === "QR" ? (
                <div className={styles.qrWrapZoom} dangerouslySetInnerHTML={{ __html: qrMarkup }} />
              ) : (
                <svg
                  ref={zoomSvgRef}
                  className={styles.svgCodeZoom}
                  aria-label={`${card.name} ${barcodeLabel}`}
                />
              )}
            </div>
          </div>
        </button>
      ) : null}
    </>
  );
};
