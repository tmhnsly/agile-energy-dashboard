import { MarketPriceTile } from "@/components/Features/MarketPriceTile";
import { Section, Container, BentoGrid, BentoTile } from "@/components/Layout";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <main className={styles.page}>
      <Section variant="surface">
        <Container>
          <h1 className={styles.heading}>Dashboard</h1>
          <BentoGrid>
            <MarketPriceTile />
            <BentoTile>
              <h3 className={styles.tileTitle}>Coming Soon</h3>
              <p className={styles.tileText}>
                Additional dashboard features will appear here.
              </p>
            </BentoTile>
            <BentoTile>
              <h3 className={styles.tileTitle}>Notifications</h3>
              <p className={styles.tileText}>
                Price alerts and flex event notifications.
              </p>
            </BentoTile>
          </BentoGrid>
        </Container>
      </Section>
    </main>
  );
}
