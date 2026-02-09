import { MarketPriceTile } from "@/components/MarketPricePanel";
import { Section, Container } from "@/components/Layout";
import { BentoGrid, BentoCard } from "@/components/Bento";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <main className={styles.page}>
      <Section variant="surface">
        <Container>
          <h1 className={styles.heading}>Dashboard</h1>
          <BentoGrid>
            <MarketPriceTile />
            <BentoCard>
              <h3 className={styles.tileTitle}>Coming Soon</h3>
              <p className={styles.tileText}>
                Additional dashboard features will appear here.
              </p>
            </BentoCard>
            <BentoCard>
              <h3 className={styles.tileTitle}>Notifications</h3>
              <p className={styles.tileText}>
                Price alerts and flex event notifications.
              </p>
            </BentoCard>
          </BentoGrid>
        </Container>
      </Section>
    </main>
  );
}
