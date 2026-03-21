import { useEffect, useRef, useState } from "react";
import { IconCheck, IconCopy, IconZoomIn } from "@tabler/icons-react";
import { Card } from "../../types/card";
import {
  createQrSvg,
  getRenderableBarcodeNumber,
  isLinearBarcodeType,
  normalizeBarcodeNumber,
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

const BARCODE_LABELS: Record<Card["barcodeType"], string> = {
  EAN13: "EAN-13",
  EAN8: "EAN-8",
  UPC: "UPC-A",
  CODE128: "CODE-128",
  CODE39: "CODE-39",
  ITF14: "ITF-14",
  CODABAR: "Codabar",
  QR: "QR"
};

export const CardViewer = ({ card }: CardViewerProps) => {
  const { t } = useI18n();
  const { resolvedTheme } = useAppSettings();
  const palette = getCardColorOption(card.cardColor, resolvedTheme);
  const category = normalizeCardCategory(card.category);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomSvgRef = useRef<SVGSVGElement | null>(null);
  const copyResetRef = useRef<number | null>(null);
  const [qrMarkup, setQrMarkup] = useState<string>("");
  const [zoomState, setZoomState] = useState<"closed" | "open" | "closing">("closed");
  const [isCopied, setIsCopied] = useState(false);

  const barcodeType = card.barcodeType;
  const normalized = normalizeBarcodeNumber(card.number, barcodeType);
  const renderableNumber = getRenderableBarcodeNumber(card.number, barcodeType);
  const isCodeAvailable =
    barcodeType === "QR" ? card.number.trim().length > 0 : normalized.errorCode === null;
  const canZoom = isCodeAvailable && (barcodeType !== "QR" || qrMarkup.length > 0);
  const isZoomVisible = zoomState !== "closed";

  const closeZoom = () => {
    setZoomState((current) => (current === "closed" ? "closed" : "closing"));
  };

  const handleCopyNumber = async () => {
    const value = card.number.trim();
    if (!value) {
      return;
    }

    let copied = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        copied = true;
      } catch {
        copied = false;
      }
    }

    if (!copied) {
      const helper = document.createElement("textarea");
      helper.value = value;
      helper.setAttribute("readonly", "true");
      helper.style.position = "fixed";
      helper.style.top = "-9999px";
      document.body.append(helper);
      helper.select();
      copied = document.execCommand("copy");
      helper.remove();
    }

    if (!copied) {
      return;
    }

    setIsCopied(true);
    if (copyResetRef.current) {
      window.clearTimeout(copyResetRef.current);
    }
    copyResetRef.current = window.setTimeout(() => {
      setIsCopied(false);
      copyResetRef.current = null;
    }, 1400);
  };

  useEffect(() => {
    if (barcodeType === "QR") {
      createQrSvg(card.number, "#111111", "#ffffff")
        .then(setQrMarkup)
        .catch(() => setQrMarkup(""));
      return;
    }

    const clearCode = () => {
      if (svgRef.current) {
        svgRef.current.textContent = "";
      }
      if (zoomSvgRef.current) {
        zoomSvgRef.current.textContent = "";
      }
    };

    if (!isLinearBarcodeType(barcodeType) || !isCodeAvailable) {
      clearCode();
      return;
    }

    try {
      if (svgRef.current) {
        renderLinearBarcode(svgRef.current, renderableNumber, barcodeType, {
          width: 2,
          height: 108,
          lineColor: "#111111"
        });
      }

      if (zoomSvgRef.current) {
        renderLinearBarcode(zoomSvgRef.current, renderableNumber, barcodeType, {
          width: 3,
          height: 188,
          lineColor: "#111111"
        });
      }
    } catch {
      clearCode();
    }
  }, [barcodeType, renderableNumber, card.number, isCodeAvailable, isZoomVisible]);

  useEffect(() => {
    if (!isZoomVisible) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeZoom();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isZoomVisible]);

  useEffect(
    () => () => {
      if (copyResetRef.current) {
        window.clearTimeout(copyResetRef.current);
      }
    },
    []
  );

  const hasNotes = card.notes.trim().length > 0;

  return (
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
          <div className={styles.numberRow}>
            <p className={styles.number} style={{ color: palette.subtleText }}>
              {card.number}
            </p>
            <button
              type="button"
              className={`${styles.copyButton} ${isCopied ? styles.copyButtonDone : ""}`}
              onClick={handleCopyNumber}
              aria-label={t.detail.copyNumber}
              title={isCopied ? t.detail.copied : t.detail.copyNumber}
            >
              {isCopied ? (
                <IconCheck size={16} stroke={2.2} aria-hidden="true" />
              ) : (
                <IconCopy size={16} stroke={2} aria-hidden="true" />
              )}
            </button>
          </div>
          <p className={styles.meta} style={{ color: palette.subtleText }}>
            {t.detail.category}: {t.form.categories[category]}
          </p>
        </div>

        <article className={styles.codeTile}>
          <div className={styles.codeHeader}>
            <p className={styles.codeTitle}>{BARCODE_LABELS[barcodeType]}</p>
            <button
              type="button"
              className={styles.zoomButton}
              onClick={() => setZoomState("open")}
              disabled={!canZoom}
              aria-label={t.detail.zoom}
            >
              <IconZoomIn size={16} stroke={2} aria-hidden="true" />
            </button>
          </div>
          <div
            className={`${styles.codeBody} ${canZoom ? styles.codeBodyInteractive : ""}`}
            onClick={() => {
              if (canZoom) {
                setZoomState("open");
              }
            }}
            role={canZoom ? "button" : undefined}
            tabIndex={canZoom ? 0 : undefined}
            onKeyDown={(event) => {
              if (!canZoom) {
                return;
              }
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setZoomState("open");
              }
            }}
          >
            {barcodeType === "QR" ? (
              <div className={styles.qrWrap} dangerouslySetInnerHTML={{ __html: qrMarkup }} />
            ) : isCodeAvailable ? (
              <svg
                ref={svgRef}
                className={styles.svgCode}
                aria-label={`${card.name} ${BARCODE_LABELS[barcodeType]}`}
              />
            ) : (
              <span className={styles.unavailable}>{t.detail.codeUnavailable}</span>
            )}
          </div>
        </article>

        {hasNotes ? (
          <article className={styles.notesBlock}>
            <p className={styles.notesTitle}>{t.detail.notes}</p>
            <p className={styles.notesText}>{card.notes}</p>
          </article>
        ) : null}
      </div>

      {isZoomVisible ? (
        <div
          className={`${styles.zoomOverlay} ${zoomState === "closing" ? styles.zoomOverlayClosing : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={t.detail.zoom}
          onAnimationEnd={(event) => {
            if (event.target !== event.currentTarget) {
              return;
            }
            if (zoomState === "closing") {
              setZoomState("closed");
            }
          }}
        >
          <div
            className={styles.zoomPanel}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <p className={styles.zoomTitle}>{BARCODE_LABELS[barcodeType]}</p>
            <div className={styles.zoomCanvas}>
              {barcodeType === "QR" ? (
                <div className={styles.zoomQrWrap} dangerouslySetInnerHTML={{ __html: qrMarkup }} />
              ) : (
                <svg
                  ref={zoomSvgRef}
                  className={styles.zoomSvgCode}
                  aria-label={`${card.name} ${BARCODE_LABELS[barcodeType]} zoom`}
                />
              )}
            </div>
          </div>
          <button
            type="button"
            className={styles.zoomBackdrop}
            onClick={closeZoom}
            aria-label={t.common.close}
          />
        </div>
      ) : null}
    </section>
  );
};
