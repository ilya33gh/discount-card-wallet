import { ReactNode } from "react";
import { IconChevronLeft } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import styles from "./ScreenHeader.module.css";

interface ScreenHeaderProps {
  title: string;
  backTo?: string;
  backLabel?: string;
  actions?: { label: string; to: string; icon?: ReactNode }[];
  sticky?: boolean;
  centerTitle?: boolean;
}

export const ScreenHeader = ({
  title,
  backTo,
  backLabel = "Back",
  actions
}: ScreenHeaderProps) => (
  <header className={styles.header}>
    <div className={styles.left}>
      {backTo ? (
        <Link to={backTo} className={styles.button}>
          <IconChevronLeft size={20} className={styles.icon} aria-hidden="true" />
          <span>{backLabel}</span>
        </Link>
      ) : null}
    </div>
    <h1 className={styles.title}>{title}</h1>
    <div className={styles.right}>
      {actions?.map((action) => (
        <Link key={action.to} to={action.to} className={styles.button}>
          {action.icon ? <span className={styles.actionIcon}>{action.icon}</span> : null}
          <span>{action.label}</span>
        </Link>
      ))}
    </div>
  </header>
);
