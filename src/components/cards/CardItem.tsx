import { CSSProperties, memo } from "react";
import { IconStarFilled } from "@tabler/icons-react";
import { Card } from "../../types/card";
import { useI18n } from "../../i18n/useI18n";
import { getCardColorOption } from "../../services/cards/cardColors";
import { normalizeCardCategory } from "../../services/cards/cardCategories";
import { useAppSettings } from "../../settings/AppSettingsContext";
import styles from "./CardItem.module.css";

interface CardItemProps {
  card: Card;
  onOpen: (id: string) => void;
  onFavoriteToggle: (id: string, value: boolean) => void;
  highlightQuery?: string;
}

export const CardItem = memo(
  ({ card, onOpen, onFavoriteToggle, highlightQuery = "" }: CardItemProps) => {
    const { t } = useI18n();
    const { resolvedTheme } = useAppSettings();
    const palette = getCardColorOption(card.cardColor, resolvedTheme);
    const category = normalizeCardCategory(card.category);
    const query = highlightQuery.trim().toLowerCase();

    const renderHighlighted = (text: string) => {
      if (!query) {
        return text;
      }

      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matcher = new RegExp(`(${escapedQuery})`, "ig");
      const parts = text.split(matcher);

      if (parts.length === 1) {
        return text;
      }

      return parts.map((part, index) =>
        part.toLowerCase() === query ? (
          <mark key={`${part}-${index}`} className={styles.match}>
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      );
    };

    return (
      <article
        className={styles.item}
        style={
          {
            "--card-surface": palette.surface,
            "--card-border": palette.border,
            "--card-text": palette.text,
            "--card-subtle": palette.subtleText
          } as CSSProperties
        }
      >
        <button type="button" className={styles.mainButton} onClick={() => onOpen(card.id)}>
          <h2 className={styles.title}>{renderHighlighted(card.name)}</h2>
          <p className={styles.favoriteTag}>{card.favorite ? t.home.favoriteLabel : ""}</p>
          <p className={styles.number}>{renderHighlighted(card.number)}</p>
          <p className={styles.type}>
            {t.form.categories[category]} / {card.barcodeType}
          </p>
        </button>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.iconButton} ${card.favorite ? styles.iconButtonActive : ""}`}
            onClick={() => onFavoriteToggle(card.id, !card.favorite)}
            aria-label={card.favorite ? t.detail.unfavorite : t.detail.favorite}
          >
            <IconStarFilled size={20} className={styles.starIcon} aria-hidden="true" />
          </button>
        </div>
      </article>
    );
  },
  (prev, next) =>
    prev.card.id === next.card.id &&
    prev.card.name === next.card.name &&
    prev.card.number === next.card.number &&
    prev.card.favorite === next.card.favorite &&
    prev.card.barcodeType === next.card.barcodeType &&
    prev.card.cardColor === next.card.cardColor &&
    prev.highlightQuery === next.highlightQuery
);
