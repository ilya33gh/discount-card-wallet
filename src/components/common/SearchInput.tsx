import styles from "./SearchInput.module.css";
import searchIcon from "../../assets/icons/search.svg";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export const SearchInput = ({ value, onChange, placeholder }: SearchInputProps) => (
  <label className={styles.wrap}>
    <img src={searchIcon} className={styles.icon} aria-hidden="true" alt="" />
    <input
      type="search"
      placeholder={placeholder}
      className={styles.input}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      autoCapitalize="off"
      autoCorrect="off"
    />
  </label>
);
