import { PriceMarketView } from "@/components/PriceMarketView";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Shuffle Energy</h1>
      <PriceMarketView />
    </main>
  );
}
