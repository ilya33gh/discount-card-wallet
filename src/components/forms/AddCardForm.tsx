import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { BarcodeType, CardCreateInput } from "../../types/card";
import {
  BARCODE_TYPES,
  normalizeBarcodeNumber
} from "../../services/barcode/barcodeService";
import { validateCardInput } from "../../utils/validation";
import {
  CARD_COLOR_OPTIONS,
  DEFAULT_CARD_COLOR
} from "../../services/cards/cardColors";
import {
  CARD_CATEGORY_OPTIONS,
  DEFAULT_CARD_CATEGORY
} from "../../services/cards/cardCategories";
import { useI18n } from "../../i18n/useI18n";
import { useAppSettings } from "../../settings/AppSettingsContext";
import { scanBarcodeFromFile } from "../../services/scanner/imageScanner";
import cameraIcon from "../../assets/icons/camera.svg";
import saveIcon from "../../assets/icons/save.svg";
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
    if (normalizedNumber.errorCode === "ean_digits") {
      setErrors({ number: t.validation.eanDigits });
      return;
    }
    if (normalizedNumber.errorCode === "ean_checksum") {
      setErrors({ number: t.validation.eanChecksum });
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

      if (normalized.errorCode === "ean_digits") {
        setScanError(t.validation.eanDigits);
        return;
      }
      if (normalized.errorCode === "ean_checksum") {
        setScanError(t.validation.eanChecksum);
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

      <label className={styles.field}>
        <span className={styles.label}>{t.form.storeName}</span>
        <input
          className={styles.input}
          type="text"
          value={values.name}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, name: event.target.value }))
          }
          aria-required="true"
        />
        {errors.name ? <span className={styles.error}>{errors.name}</span> : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>{t.form.cardNumber}</span>
        <input
          className={styles.input}
          type="text"
          inputMode="numeric"
          value={values.number}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, number: event.target.value }))
          }
          aria-required="true"
        />
        {errors.number ? <span className={styles.error}>{errors.number}</span> : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>{t.form.barcodeType}</span>
        <select
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

      <label className={styles.field}>
        <span className={styles.label}>{t.form.category}</span>
        <select
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

      <label className={styles.field}>
        <span className={styles.label}>{t.form.notes}</span>
        <textarea
          className={styles.textarea}
          value={values.notes}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, notes: event.target.value }))
          }
          placeholder={t.form.notesPlaceholder}
        />
      </label>

      <div className={styles.field}>
        <span className={styles.label}>{t.form.color}</span>
        <div className={styles.colorGrid}>
          {CARD_COLOR_OPTIONS.map((color) => {
            const isActive = values.cardColor === color.id;
            return (
              <button
                type="button"
                key={color.id}
                className={`${styles.colorButton} ${isActive ? styles.colorButtonActive : ""}`}
                style={{ background: color[resolvedTheme].surface }}
                aria-label={t.form.colors[color.id]}
                onClick={() => setValues((prev) => ({ ...prev, cardColor: color.id }))}
              />
            );
          })}
        </div>
      </div>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={Boolean(values.favorite)}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, favorite: event.target.checked }))
          }
        />
        {t.form.favorite}
      </label>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.buttonSecondary}
          onClick={() => scanInputRef.current?.click()}
        >
          <img src={cameraIcon} className={styles.buttonIcon} aria-hidden="true" alt="" />
          {t.form.scan}
        </button>
        <button type="submit" className={styles.button} disabled={isSaving}>
          <img src={saveIcon} className={styles.buttonIcon} aria-hidden="true" alt="" />
          {isSaving ? t.form.saving : submitLabel}
        </button>
      </div>
      {scanError ? <p className={styles.scanError}>{scanError}</p> : null}
      {submitError ? <p className={styles.submitError}>{submitError}</p> : null}
    </form>
  );
};
