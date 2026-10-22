import React from 'react';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'banner' | 'card' | 'inline';
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Something went wrong',
  message,
  variant = 'banner',
  onRetry,
  className,
}) => {
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-red-600', className)}>
        <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{message}</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'p-6 bg-red-50/60 border border-red-100 rounded-2xl text-center max-w-md mx-auto shadow-sm',
          className
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-red-900 text-base mb-1">{title}</h4>
        <p className="text-sm text-red-700 mb-4">{message}</p>
        {onRetry && (
          <Button
            size="sm"
            variant="danger"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 bg-red-50/80 border border-red-200 rounded-xl flex items-start gap-3',
        className
      )}
      role="alert"
    >
      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-semibold text-sm text-red-900 mb-0.5">{title}</h5>}
        <p className="text-sm text-red-700">{message}</p>
      </div>
      {onRetry && (
        <Button
          size="xs"
          variant="danger"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3 h-3" />}
        >
          Retry
        </Button>
      )}
    </div>
  );
};
