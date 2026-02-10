'use client';

import { useRouter } from 'next/navigation';

export interface BackButtonProps {
  label?: string;
  className?: string;
}

export const BackButton = ({ label = 'Go back', className }: BackButtonProps) => {
  const router = useRouter();

  return (
    <button type="button" className={className} onClick={() => router.back()}>
      {label}
    </button>
  );
};
