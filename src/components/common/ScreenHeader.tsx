import { Link } from "react-router-dom";
import styles from "./ScreenHeader.module.css";
import backIcon from "../../assets/icons/back.svg";

interface ScreenHeaderProps {
  title: string;
  backTo?: string;
  backLabel?: string;
  actions?: { label: string; to: string; iconSrc?: string }[];
  sticky?: boolean;
  centerTitle?: boolean;
}

export const ScreenHeader = ({
  title,
  backTo,
  backLabel = "Back",
  actions,
  sticky = false,
  centerTitle = false
}: ScreenHeaderProps) => (
  <header
    className={`${styles.header} ${sticky ? styles.sticky : ""} ${centerTitle ? styles.centered : ""}`}
  >
    <div className={styles.left}>
      {backTo ? (
        <Link to={backTo} className={styles.button}>
          <span className={styles.buttonInner}>
            <img src={backIcon} className={styles.icon} aria-hidden="true" alt="" />
            {backLabel}
          </span>
        </Link>
      ) : null}
    </div>
    <h1 className={styles.title}>{title}</h1>
    <div className={styles.right}>
      {actions?.map((action) => (
        <Link key={action.to} to={action.to} className={styles.button}>
          {action.iconSrc ? (
            <img src={action.iconSrc} className={styles.actionIcon} aria-hidden="true" alt="" />
          ) : null}
          {action.label}
        </Link>
      ))}
    </div>
  </header>
);
