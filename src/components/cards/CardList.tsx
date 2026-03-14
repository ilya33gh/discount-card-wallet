import { Card } from "../../types/card";
import { CardItem } from "./CardItem";
import styles from "./CardList.module.css";

interface CardListProps {
  cards: Card[];
  onOpen: (id: string) => void;
  onFavoriteToggle: (id: string, value: boolean) => void;
  highlightQuery?: string;
}

export const CardList = ({ cards, onOpen, onFavoriteToggle, highlightQuery = "" }: CardListProps) => (
  <ul className={styles.list}>
    {cards.map((card) => (
      <li key={card.id}>
        <CardItem
          card={card}
          onOpen={onOpen}
          onFavoriteToggle={onFavoriteToggle}
          highlightQuery={highlightQuery}
        />
      </li>
    ))}
  </ul>
);
