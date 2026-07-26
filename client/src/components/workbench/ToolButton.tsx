import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ToolButtonProps {
  variant?: 'execute' | 'swap' | 'copy' | 'clear' | 'download';
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}

const ToolButton = ({
  variant = 'execute',
  onClick,
  children,
  disabled,
}: ToolButtonProps) => {
  const isExecute = variant === 'execute';
  return (
    <Button
      size="sm"
      variant={isExecute ? 'default' : 'outline'}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
};

export default ToolButton;
