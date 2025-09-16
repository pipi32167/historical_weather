/**
 * 错误消息组件
 * 提供统一的错误状态展示和重试功能
 */

import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'inline';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  className = '',
  variant = 'default'
}) => {
  const { t } = useTranslation();
  if (variant === 'inline') {
    return (
      <div className={clsx('flex items-center space-x-2 text-sm text-red-600 dark:text-red-400', className)}>
        <span>⚠️</span>
        <span>{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
          >
            {t('app.retry')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={clsx('bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4', className)}>
      <div className="flex items-start space-x-3">
        <div className="text-red-500 text-xl">⚠️</div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
            {t('errors.loadingFailed')}
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300">
            {message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-800 dark:text-red-200 rounded-md transition-colors"
            >
              {t('errors.retryLoading')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;