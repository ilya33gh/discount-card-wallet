import { ChangeEvent, FormEvent, useId, useRef, useState } from "react";
import { IconDeviceFloppy, IconScan } from "@tabler/icons-react";
import { BarcodeType, CardCreateInput } from "../../types/card";
import {
  BARCODE_TYPES,
  isNumericBarcodeType,
  normalizeBarcodeNumber
} from "../../services/barcode/barcodeService";
import { validateCardInput } from "../../utils/validation";
import {
  CARD_COLOR_OPTIONS,
  DEFAULT_CARD_COLOR,
  getCardColorOption
} from "../../services/cards/cardColors";
import {
  CARD_CATEGORY_OPTIONS,
  DEFAULT_CARD_CATEGORY
} from "../../services/cards/cardCategories";
import { useI18n } from "../../i18n/useI18n";
import { useAppSettings } from "../../settings/AppSettingsContext";
import { scanBarcodeFromFile } from "../../services/scanner/imageScanner";
import styles from "./AddCardForm.module.css";

interface AddCardFormProps {
  initialValues?: CardCreateInput;
  submitLabel: string;
  onSubmit: (input: CardCreateInput) => Promise<void>;
}

const initialState: CardCreateInput = {
  name: "",
  number: "",
  barcodeType: "EAN13",
  cardColor: DEFAULT_CARD_COLOR,
  category: DEFAULT_CARD_CATEGORY,
  notes: "",
  logoDataUrl: null,
  favorite: false
};

export const AddCardForm = ({
  initialValues = initialState,
  submitLabel,
  onSubmit
}: AddCardFormProps) => {
  const { t } = useI18n();
  const { resolvedTheme } = useAppSettings();
  const [values, setValues] = useState<CardCreateInput>({
    ...initialState,
    ...initialValues
  });
  const [errors, setErrors] = useState<{ name?: string; number?: string }>({});
  const [scanError, setScanError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const scanInputRef = useRef<HTMLInputElement | null>(null);
  const idPrefix = useId();

  const previewPalette = getCardColorOption(values.cardColor ?? DEFAULT_CARD_COLOR, resolvedTheme);
  const previewName = values.name.trim() || t.form.previewName;
  const previewNumber = values.number.trim() || t.form.previewNumber;
  const isNumericInput = isNumericBarcodeType(values.barcodeType);

  const getNumberErrorByCode = (
    errorCode: ReturnType<typeof normalizeBarcodeNumber>["errorCode"]
  ): string | null => {
    switch (errorCode) {
      case "ean_digits":
        return t.validation.eanDigits;
      case "ean_checksum":
        return t.validation.eanChecksum;
      case "ean8_digits":
        return t.validation.ean8Digits;
      case "ean8_checksum":
        return t.validation.ean8Checksum;
      case "upc_digits":
        return t.validation.upcDigits;
      case "upc_checksum":
        return t.validation.upcChecksum;
      case "itf14_digits":
        return t.validation.itf14Digits;
      case "itf14_checksum":
        return t.validation.itf14Checksum;
      default:
        return null;
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const result = validateCardInput(
      values.name,
      values.number,
      values.barcodeType as BarcodeType,
      t.validation
    );
    setErrors(result.errors);
    if (!result.isValid || isSaving) {
      return;
    }

    const normalizedNumber = normalizeBarcodeNumber(values.number, values.barcodeType);
    const errorText = getNumberErrorByCode(normalizedNumber.errorCode);
    if (errorText) {
      setErrors({ number: errorText });
      return;
    }

    try {
      setIsSaving(true);
      await onSubmit({
        ...values,
        number: normalizedNumber.value
      });
    } catch {
      setSubmitError(t.form.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleScanFromFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const detected = await scanBarcodeFromFile(file);
      const normalized = normalizeBarcodeNumber(detected.number, detected.barcodeType);

      const errorText = getNumberErrorByCode(normalized.errorCode);
      if (errorText) {
        setScanError(errorText);
        return;
      }

      setValues((prev) => ({
        ...prev,
        number: normalized.value,
        barcodeType: detected.barcodeType
      }));
      setErrors((prev) => ({ ...prev, number: undefined }));
      setScanError(null);
    } catch {
      setScanError(t.scanner.readFailed);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <input
        ref={scanInputRef}
        className={styles.hiddenInput}
        type="file"
        accept="image/*"
        onChange={handleScanFromFile}
        tabIndex={-1}
        aria-hidden="true"
      />

      <section className={styles.preview} aria-label={t.form.preview}>
        <p className={styles.previewLabel}>{t.form.preview}</p>
        <div
          className={styles.previewCard}
          style={{
            background: previewPalette.surface,
            borderColor: previewPalette.border,
            color: previewPalette.text
          }}
        >
          <p className={styles.previewName}>{previewName}</p>
          <p className={styles.previewNumber} style={{ color: previewPalette.subtleText }}>
            {previewNumber}
          </p>
          <p className={styles.previewMeta} style={{ color: previewPalette.subtleText }}>
            {t.form.categories[values.category ?? DEFAULT_CARD_CATEGORY]} / {values.barcodeType}
          </p>
        </div>
      </section>

      <label className={styles.field} htmlFor={`${idPrefix}-name`}>
        <span className={styles.label}>{t.form.storeName}</span>
        <input
          id={`${idPrefix}-name`}
          className={styles.input}
          type="text"
          value={values.name}
          onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
          aria-required="true"
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name ? <span className={styles.error}>{errors.name}</span> : null}
      </label>

      <label className={styles.field} htmlFor={`${idPrefix}-number`}>
        <span className={styles.label}>{t.form.cardNumber}</span>
        <input
          id={`${idPrefix}-number`}
          className={styles.input}
          type="text"
          inputMode={isNumericInput ? "numeric" : "text"}
          value={values.number}
          onChange={(event) => setValues((prev) => ({ ...prev, number: event.target.value }))}
          aria-required="true"
          aria-invalid={Boolean(errors.number)}
        />
        {errors.number ? <span className={styles.error}>{errors.number}</span> : null}
      </label>

      <div className={styles.fieldGrid}>
        <label className={styles.field} htmlFor={`${idPrefix}-barcode`}>
          <span className={styles.label}>{t.form.barcodeType}</span>
          <select
            id={`${idPrefix}-barcode`}
            className={styles.select}
            value={values.barcodeType}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                barcodeType: event.target.value as BarcodeType
              }))
            }
          >
            {BARCODE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field} htmlFor={`${idPrefix}-category`}>
          <span className={styles.label}>{t.form.category}</span>
          <select
            id={`${idPrefix}-category`}
            className={styles.select}
            value={values.category ?? DEFAULT_CARD_CATEGORY}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                category: event.target.value as CardCreateInput["category"]
              }))
            }
          >
            {CARD_CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {t.form.categories[category]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={styles.field} htmlFor={`${idPrefix}-notes`}>
        <span className={styles.label}>{t.form.notes}</span>
        <textarea
          id={`${idPrefix}-notes`}
          className={styles.textarea}
          value={values.notes}
          onChange={(event) => setValues((prev) => ({ ...prev, notes: event.target.value }))}
          placeholder={t.form.notesPlaceholder}
        />
      </label>

      <div className={styles.field}>
        <span className={styles.label}>{t.form.color}</span>
        <div className={styles.colorGrid} role="radiogroup" aria-label={t.form.color}>
          {CARD_COLOR_OPTIONS.map((color) => {
            const isActive = values.cardColor === color.id;
            const swatch = color[resolvedTheme];
            return (
              <button
                type="button"
                key={color.id}
                className={`${styles.colorButton} ${isActive ? styles.colorButtonActive : ""}`}
                aria-label={t.form.colors[color.id]}
                aria-pressed={isActive}
                onClick={() => setValues((prev) => ({ ...prev, cardColor: color.id }))}
              >
                <span
                  className={styles.colorSwatch}
                  style={{
                    background: swatch.surface,
                    borderColor: swatch.border
                  }}
                  aria-hidden="true"
                />
                <span>{t.form.colors[color.id]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={Boolean(values.favorite)}
          onChange={(event) => setValues((prev) => ({ ...prev, favorite: event.target.checked }))}
        />
        <span>{t.form.favorite}</span>
      </label>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.buttonSecondary}
          onClick={() => scanInputRef.current?.click()}
        >
          <IconScan size={20} stroke={2} aria-hidden="true" />
          {t.form.scan}
        </button>
        <button type="submit" className={styles.button} disabled={isSaving}>
          <IconDeviceFloppy size={20} stroke={2} aria-hidden="true" />
          {isSaving ? t.form.saving : submitLabel}
        </button>
      </div>

      {scanError ? (
        <p className={styles.scanError} role="alert">
          {scanError}
        </p>
      ) : null}
      {submitError ? (
        <p className={styles.submitError} role="alert">
          {submitError}
        </p>
      ) : null}
    </form>
  );
};
