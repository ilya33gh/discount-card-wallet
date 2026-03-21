import { useNavigate } from "react-router-dom";
import { AddCardForm } from "../components/forms/AddCardForm";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { cardService } from "../services/cards/cardService";
import { useI18n } from "../i18n/useI18n";
import styles from "./FormPage.module.css";

const AddCardPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <section className={styles.page}>
      <ScreenHeader title={t.form.addTitle} backTo="/" backLabel={t.common.back} />
      <section className={styles.content}>
        <AddCardForm
          submitLabel={t.form.save}
          onSubmit={async (input) => {
            const card = await cardService.createCard(input);
            navigate(`/cards/${card.id}`);
          }}
        />
      </section>
    </section>
  );
};

export default AddCardPage;
