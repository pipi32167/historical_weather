import { useState, useEffect, useCallback, useRef } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  timestamp: number | null;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 300000, // 5 minutes
  watch: false,
};

export const useGeolocation = (options: GeolocationOptions = {}): GeolocationState & {
  getCurrentPosition: () => void;
  clearError: () => void;
} => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
    timestamp: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const optionsRef = useRef({ ...DEFAULT_OPTIONS, ...options });

  // 更新选项而不触发重新渲染
  useEffect(() => {
    optionsRef.current = { ...DEFAULT_OPTIONS, ...options };
  }, [options]);

  // 清理函数
  const cleanup = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // 成功回调
  const onSuccess = useCallback((position: GeolocationPosition) => {
    if (!mountedRef.current) return;

    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      loading: false,
      timestamp: position.timestamp,
    });
  }, []);

  // 错误回调
  const onError = useCallback((error: GeolocationPositionError) => {
    if (!mountedRef.current) return;

    let errorMessage = '获取位置失败';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = '用户拒绝了位置权限请求';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = '位置信息不可用';
        break;
      case error.TIMEOUT:
        errorMessage = '获取位置超时';
        break;
      default:
        errorMessage = `获取位置失败: ${error.message}`;
        break;
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      loading: false,
    }));
  }, []);

  // 获取当前位置
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: '浏览器不支持地理位置功能',
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const opts = optionsRef.current;
    
    if (opts.watch) {
      cleanup(); // 清理之前的监听
      watchIdRef.current = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        {
          enableHighAccuracy: opts.enableHighAccuracy,
          timeout: opts.timeout,
          maximumAge: opts.maximumAge,
        }
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        {
          enableHighAccuracy: opts.enableHighAccuracy,
          timeout: opts.timeout,
          maximumAge: opts.maximumAge,
        }
      );
    }
  }, [onSuccess, onError, cleanup]);

  // 清除错误
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    getCurrentPosition,
    clearError,
  };
};