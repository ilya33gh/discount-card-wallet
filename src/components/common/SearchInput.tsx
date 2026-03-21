import { IconSearch } from "@tabler/icons-react";
import styles from "./SearchInput.module.css";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export const SearchInput = ({ value, onChange, placeholder }: SearchInputProps) => (
  <label className={styles.wrap}>
    <IconSearch size={20} stroke={2} className={styles.icon} aria-hidden="true" />
    <input
      type="search"
      placeholder={placeholder}
      className={styles.input}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      autoCapitalize="off"
      autoCorrect="off"
      aria-label={placeholder}
    />
  </label>
);
