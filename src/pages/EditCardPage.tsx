import { useNavigate, useParams } from "react-router-dom";
import { AddCardForm } from "../components/forms/AddCardForm";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { useCard } from "../hooks/useCards";
import { cardService } from "../services/cards/cardService";
import { useI18n } from "../i18n/useI18n";
import styles from "./FormPage.module.css";

const EditCardPage = () => {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const card = useCard(id);

  if (!id) {
    return null;
  }

  if (card === undefined) {
    return <p>{t.common.loading}</p>;
  }

  if (!card) {
    return (
      <section className={styles.page}>
        <ScreenHeader title={t.detail.cardNotFound} backTo="/" backLabel={t.common.back} />
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <ScreenHeader title={t.form.editTitle} backTo={`/cards/${id}`} backLabel={t.common.back} />
      <AddCardForm
        submitLabel={t.form.update}
        initialValues={{
          name: card.name,
          number: card.number,
          barcodeType: card.barcodeType,
          cardColor: card.cardColor,
          category: card.category,
          notes: card.notes,
          favorite: card.favorite
        }}
        onSubmit={async (input) => {
          await cardService.updateCard(id, input);
          navigate(`/cards/${id}`);
        }}
      />
    </section>
  );
};

export default EditCardPage;
