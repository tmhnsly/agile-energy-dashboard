import { Skeleton } from '@/components/UI/Skeleton/Skeleton';
import styles from './ShiftSimulator/ShiftSimulator.module.scss';

export const ShiftSimulatorSkeleton = () => (
  <div className={styles.content}>
    <div className={styles.headerGroup}>
      <Skeleton width="10rem" height="1.4rem" radius="small" />
      <Skeleton width="100%" height="0.9rem" radius="small" />
    </div>

    <div className={styles.controlGroup}>
      <Skeleton width="8rem" height="1rem" radius="small" />
      <div className={styles.pillGrid}>
        <Skeleton width="100%" height="2.25rem" radius="pill" />
        <Skeleton width="100%" height="2.25rem" radius="pill" />
        <Skeleton width="100%" height="2.25rem" radius="pill" />
        <Skeleton width="100%" height="2.25rem" radius="pill" />
      </div>
    </div>

    <div className={styles.controlGroup}>
      <Skeleton width="7rem" height="1rem" radius="small" />
      <div className={styles.pillGrid}>
        <Skeleton width="100%" height="2.25rem" radius="pill" />
        <Skeleton width="100%" height="2.25rem" radius="pill" />
        <Skeleton width="100%" height="2.25rem" radius="pill" />
        <Skeleton width="100%" height="2.25rem" radius="pill" />
      </div>
    </div>

    <div className={styles.controlGroup}>
      <Skeleton width="10rem" height="1rem" radius="small" />
      <Skeleton width="100%" height="2.75rem" radius="small" />
    </div>

    <div className={styles.savingRow}>
      <Skeleton width="5rem" height="1.4rem" radius="small" />
      <Skeleton width="8rem" height="1rem" radius="small" />
    </div>
  </div>
);
