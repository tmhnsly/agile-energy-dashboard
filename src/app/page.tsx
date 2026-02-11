import dynamic from "next/dynamic";
import { Section, Container } from "@/components/Layout";
import styles from "./page.module.scss";

const DashboardShell = dynamic(
  () =>
    import("@/components/Features/DashboardShell/DashboardShell").then((m) => ({
      default: m.DashboardShell,
    }))
);

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
