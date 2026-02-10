import { memo } from 'react';
import { Button } from '@/components/UI/Button/Button';

export interface ClearSelectionButtonProps {
  disabled: boolean;
  onClick: () => void;
}

export const ClearSelectionButton = memo(function ClearSelectionButton({
  disabled,
  onClick,
}: ClearSelectionButtonProps) {
  return (
    <Button
      label="Clear selection"
      variant="outline"
      color="mono"
      size="small"
      disabled={disabled}
      onClick={onClick}
    />
  );
});
