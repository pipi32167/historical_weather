import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applyCanonical } from '../utils/seo';

/**
 * 按路由维护 canonical / og:url / twitter:url。
 *
 * 城市页（/city/*）由 CityPage 自己负责：它要异步解析 slug（/city/320583 → /city/kunshan），
 * 这里跳过以免父组件的 effect 覆盖子页面算好的规范地址。
 */
export function useCanonicalSeo(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith('/city/')) return;
    applyCanonical(pathname);
  }, [pathname]);
}
