import styles from "./Skeleton.module.css";

export const CardListSkeleton = () => (
  <div className={`${styles.cardList} ${styles.pulse}`}>
    <div className={styles.row} />
    <div className={styles.row} />
    <div className={styles.row} />
  </div>
);

export const CardDetailSkeleton = () => (
  <div className={`${styles.detail} ${styles.pulse}`} />
);
