/**
 * Error suppressor utility to handle common runtime.lastError messages
 * that occur when browser extensions try to communicate with web pages
 */

export const initializeErrorSuppressor = (): void => {
  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  // Override console.error to filter out runtime.lastError messages
  console.error = (...args: any[]) => {
    const message = args[0];
    
    // Check if this is a runtime.lastError message
    if (typeof message === 'string') {
      const suppressedPatterns = [
        'Unchecked runtime.lastError',
        'The message port closed before a response was received',
        'runtime.lastError',
        'message port closed',
        'Extension context invalidated',
        'cannot contain a nested',
        'cannot be a descendant of',
        'This will cause a hydration error'
      ];
      
      // Don't log if it matches any suppressed pattern
      if (suppressedPatterns.some(pattern => message.includes(pattern))) {
        return;
      }
    }
    
    // Log other errors normally
    originalConsoleError.apply(console, args);
  };

  // Override console.warn for similar messages
  console.warn = (...args: any[]) => {
    const message = args[0];
    
    if (typeof message === 'string') {
      const suppressedPatterns = [
        'runtime.lastError',
        'Extension context'
      ];
      
      if (suppressedPatterns.some(pattern => message.includes(pattern))) {
        return;
      }
    }
    
    originalConsoleWarn.apply(console, args);
  };

  // Add global error event listener to catch unhandled runtime errors
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    
    // Suppress runtime.lastError related errors
    if (message.includes('runtime.lastError') || 
        message.includes('message port closed')) {
      event.preventDefault();
      return false;
    }
  });

  // Add unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || event.reason || '';
    
    if (typeof reason === 'string' && 
        (reason.includes('runtime.lastError') || 
         reason.includes('message port closed'))) {
      event.preventDefault();
      return false;
    }
  });

  // For development only - restore original methods when needed
  if (process.env.NODE_ENV === 'development') {
    (window as any).__restoreConsole = () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }
};

export default initializeErrorSuppressor;