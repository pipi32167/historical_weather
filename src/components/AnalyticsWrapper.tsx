import React, { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';

const AnalyticsWrapper: React.FC = () => {
  useEffect(() => {
    // Check if Chrome runtime is available and properly handle errors
    if (typeof window !== 'undefined' && (window as any).chrome?.runtime) {
      const checkChromeRuntime = () => {
        try {
          // Clear any pending runtime.lastError
          if ((window as any).chrome.runtime.lastError) {
            // Silently consume the error to prevent console warnings
            // Just accessing it clears the error
            void (window as any).chrome.runtime.lastError;
          }
        } catch (e) {
          // Ignore Chrome runtime access errors
        }
      };

      // Check immediately and then periodically
      checkChromeRuntime();
      const interval = setInterval(checkChromeRuntime, 1000);

      return () => {
        clearInterval(interval);
      };
    }
  }, []);

  // Always load Analytics but with error boundary protection
  return <Analytics />;
};

export default AnalyticsWrapper;