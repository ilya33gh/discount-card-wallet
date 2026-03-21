import { useEffect, useRef } from "react";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import { useCard } from "../hooks/useCards";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { CardViewer } from "../components/cards/CardViewer";
import { CardDetailSkeleton } from "../components/common/Skeleton";
import { cardService } from "../services/cards/cardService";
import { useI18n } from "../i18n/useI18n";
import styles from "./CardDetailPage.module.css";

const CardDetailPage = () => {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const card = useCard(id);
  const trackedCardRef = useRef<string | null>(null);

  useEffect(() => {
    if (!card || trackedCardRef.current === card.id) {
      return;
    }
    trackedCardRef.current = card.id;
    void cardService.trackUsage(card.id);
  }, [card]);

  if (card === undefined) {
    return (
      <section className={styles.page}>
        <p className={styles.status}>{t.home.loadingCards}</p>
        <CardDetailSkeleton />
      </section>
    );
  }

  if (!card) {
    return (
      <section className={styles.page}>
        <ScreenHeader title={t.detail.cardNotFound} backTo="/" backLabel={t.common.back} />
        <p className={styles.status}>{t.detail.cardNotFoundText}</p>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <ScreenHeader title={t.detail.checkout} backTo="/" backLabel={t.common.back} centerTitle />
      <CardViewer card={card} />
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => navigate(`/cards/${card.id}/edit`)}
        >
          <IconEdit size={20} stroke={2} aria-hidden="true" />
          {t.common.edit}
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.deleteButton}`}
          onClick={async () => {
            if (!window.confirm(t.detail.deleteConfirm.replace("{name}", card.name))) {
              return;
            }
            await cardService.deleteCard(card.id);
            navigate("/");
          }}
        >
          <IconTrash size={20} stroke={2} aria-hidden="true" />
          {t.common.delete}
        </button>
      </div>
    </section>
  );
};

export default CardDetailPage;
