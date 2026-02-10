import { DashboardShell } from "@/components/Features/DashboardShell/DashboardShell";
import { Section, Container } from "@/components/Layout";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <main className={styles.page}>
      <Section variant="surface">
        <Container>
          <h1 className={styles.heading}>Dashboard</h1>
          <DashboardShell />
        </Container>
      </Section>
    </main>
  );
}
