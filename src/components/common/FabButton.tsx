import { ButtonHTMLAttributes } from "react";
import styles from "./FabButton.module.css";

type FabButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const FabButton = (props: FabButtonProps) => (
  <button {...props} className={styles.fab}>
    +
  </button>
);
