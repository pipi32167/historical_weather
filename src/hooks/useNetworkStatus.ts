import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('网络连接已恢复');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('网络连接已断开');
    };

    // 检测网络连接状态
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 检测网络连接速度（如果支持）
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateConnectionSpeed = () => {
        if (connection) {
          // 检测慢速连接：2G 或更慢
          const slowConnectionTypes = ['slow-2g', '2g'];
          setIsSlowConnection(
            slowConnectionTypes.includes(connection.effectiveType) ||
            connection.downlink < 1 // 下行速度小于 1 Mbps
          );
        }
      };

      updateConnectionSpeed();
      connection.addEventListener('change', updateConnectionSpeed);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', updateConnectionSpeed);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isSlowConnection };
};