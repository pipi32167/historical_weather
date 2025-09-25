/**
 * Rate Limiting Loader Component
 * Shows special loading state when API rate limits are hit
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from './LoadingSpinner';

interface RateLimitingLoaderProps {
  isRateLimited: boolean;
  message: string | null;
  className?: string;
}

const RateLimitingLoader: React.FC<RateLimitingLoaderProps> = ({
  isRateLimited,
  message,
  className = ''
}) => {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState<number>(0);

  // Extract seconds from rate limit message if available
  useEffect(() => {
    if (message) {
      const match = message.match(/(\d+)\s*秒/);
      if (match) {
        setCountdown(parseInt(match[1], 10));
      }
    }
  }, [message]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!isRateLimited) {
    return (
      <div className={`flex items-center justify-center space-x-3 ${className}`}>
        <LoadingSpinner size="medium" color="primary" />
        <span className="text-gray-600 dark:text-gray-300">
          {t('app.loading')}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center w-8 h-8 bg-amber-100 dark:bg-amber-800 rounded-full">
            <div className="w-4 h-4 border-2 border-amber-600 dark:border-amber-300 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
            🚦 {t('errors.rateLimitExceeded')}
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
            {message || t('errors.rateLimitWaiting', { seconds: countdown || 60 })}
          </p>
          {countdown > 0 && (
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-amber-200 dark:bg-amber-800 rounded-full h-2">
                <div 
                  className="bg-amber-500 dark:bg-amber-400 h-2 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${Math.max(0, (60 - countdown) / 60 * 100)}%` }}
                />
              </div>
              <span className="text-sm font-mono text-amber-800 dark:text-amber-200 min-w-[3rem] text-right">
                {countdown}s
              </span>
            </div>
          )}
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            请耐心等待，系统将自动重试
          </p>
        </div>
      </div>
    </div>
  );
};

export default RateLimitingLoader;