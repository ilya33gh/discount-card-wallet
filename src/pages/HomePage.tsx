import { useCallback, useEffect, useState } from "react";
import { IconCards, IconPlus, IconSettings } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { CardCategoryFilter, CardSortMode, useCards } from "../hooks/useCards";
import { cardService } from "../services/cards/cardService";
import { CARD_CATEGORY_OPTIONS } from "../services/cards/cardCategories";
import { SearchInput } from "../components/common/SearchInput";
import { EmptyState } from "../components/common/EmptyState";
import { CardList } from "../components/cards/CardList";
import { CardListSkeleton } from "../components/common/Skeleton";
import { useI18n } from "../i18n/useI18n";
import { safeStorage } from "../utils/safeStorage";
import styles from "./HomePage.module.css";

const SORT_MODE_KEY = "dcw.home.sort_mode";

const getInitialSortMode = (): CardSortMode => {
  const saved = safeStorage.getItem(SORT_MODE_KEY);
  return saved === "alphabetical" || saved === "usage" || saved === "date_added"
    ? saved
    : "date_added";
};

const HomePage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CardCategoryFilter>("all");
  const [sortMode, setSortMode] = useState<CardSortMode>(getInitialSortMode);
  const { cards, favoriteCards, isLoading } = useCards(searchTerm, categoryFilter, sortMode);

  useEffect(() => {
    safeStorage.setItem(SORT_MODE_KEY, sortMode);
  }, [sortMode]);

  const onFavoriteToggle = useCallback(async (id: string, value: boolean) => {
    await cardService.setFavorite(id, value);
  }, []);

  const regularCards =
    favoriteCards.length > 0 ? cards.filter((card) => !card.favorite) : cards;

  return (
    <section className={styles.page}>
      <header className={styles.topRow}>
        <h1 className={styles.heading}>
          <span className={styles.brandIcon} aria-hidden="true">
            <IconCards size={24} stroke={2.1} />
          </span>
          <span>cardify</span>
        </h1>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.headerButton} ${styles.headerButtonAccent}`}
            onClick={() => navigate("/cards/new")}
            aria-label={t.home.addCard}
          >
            <IconPlus size={24} stroke={2.2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.headerButton}
            onClick={() => navigate("/settings")}
            aria-label={t.common.settings}
          >
            <IconSettings size={20} stroke={2} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className={styles.searchWrap}>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t.home.searchPlaceholder}
        />
        <nav className={styles.categoryNav} aria-label={t.form.category}>
          <button
            type="button"
            className={`${styles.categoryChip} ${categoryFilter === "all" ? styles.categoryChipActive : ""}`}
            onClick={() => setCategoryFilter("all")}
          >
            {t.home.categoriesAll}
          </button>
          {CARD_CATEGORY_OPTIONS.map((category) => (
            <button
              key={category}
              type="button"
              className={`${styles.categoryChip} ${categoryFilter === category ? styles.categoryChipActive : ""}`}
              onClick={() => setCategoryFilter(category)}
            >
              {t.form.categories[category]}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <section className={styles.block} aria-live="polite">
          <p className={styles.loader}>{t.home.loadingCards}</p>
          <CardListSkeleton />
        </section>
      ) : null}

      {!isLoading && cards.length === 0 ? <EmptyState message={t.home.empty} /> : null}

      {!isLoading && cards.length > 0 ? (
        <>
          {favoriteCards.length > 0 ? (
            <section className={styles.block}>
              <h2 className={styles.sectionTitle}>{t.home.favorites}</h2>
              <CardList
                cards={favoriteCards}
                onOpen={(id) => navigate(`/cards/${id}`)}
                onFavoriteToggle={onFavoriteToggle}
                highlightQuery={searchTerm}
              />
            </section>
          ) : null}

          <section className={styles.block}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {favoriteCards.length > 0 ? t.home.allCards : t.home.cards}
              </h2>
              <select
                className={styles.sortSelect}
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as CardSortMode)}
                aria-label={t.home.sortBy}
              >
                <option value="date_added">{t.home.sortDateAdded}</option>
                <option value="alphabetical">{t.home.sortAlphabetical}</option>
                <option value="usage">{t.home.sortUsage}</option>
              </select>
            </div>
            <CardList
              cards={regularCards}
              onOpen={(id) => navigate(`/cards/${id}`)}
              onFavoriteToggle={onFavoriteToggle}
              highlightQuery={searchTerm}
            />
          </section>
        </>
      ) : null}
    </section>
  );
};

export default HomePage;
