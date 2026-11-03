/**
 * 站点 SEO 元信息
 *
 * 背景：public/index.html 里 canonical / og:url 是写死的主页地址，
 * 只有 JS 动态改 title/description，canonical 从不更新。
 * 结果所有 /city/* 页面的 canonical 都指向首页 —— 搜索引擎会把落地页
 * 当成首页的重复内容，等于放弃这些页面的收录。
 *
 * 这里只做纯逻辑（便于测试），DOM 写入放在 applyCanonical。
 */

/** 兜底站点域名（运行时优先用 window.location.origin，见 resolveOrigin） */
export const SITE_ORIGIN = 'https://historicaltemperature.org';

/**
 * 当前实际服务的 origin。
 *
 * canonical 必须与真实访问的域名一致：仓库里曾经出现过 index.html 写
 * historicalweather.org、robots/sitemap 写 historicaltemperature.org 的不一致，
 * 而 historicalweather.org 当时并未注册（NXDOMAIN）—— 那样会让搜索引擎
 * 收到指向不存在域名的 canonical。所以运行时以 location.origin 为准。
 */
export function resolveOrigin(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location?.origin;
    if (origin && /^https?:\/\//.test(origin)) return origin;
  }
  return SITE_ORIGIN;
}

/** 把任意路径规范成 absolute canonical URL */
export function canonicalUrl(pathname: string, origin: string = resolveOrigin()): string {
  const path = normalizePath(pathname);
  return path === '/' ? `${origin}/` : `${origin}${path}`;
}

/**
 * 计算某个路由的规范路径。
 *
 * @param pathname 当前 location.pathname
 * @param resolvedCityPath 城市页解析出的规范 slug 路径（如 /city/kunshan）
 */
export function canonicalPathForLocation(pathname: string, resolvedCityPath?: string): string {
  const path = normalizePath(pathname);
  if (!path.startsWith('/city/')) return path;
  return resolvedCityPath ? normalizePath(resolvedCityPath) : path;
}

function normalizePath(pathname: string): string {
  let path = (pathname || '/').split('?')[0].split('#')[0];
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 1) path = path.replace(/\/+$/, '');
  if (path === '') path = '/';

  // 城市 slug 统一小写；中文等非 ASCII 字符做百分号编码
  if (path.startsWith('/city/')) {
    const slug = path.slice('/city/'.length);
    path = `/city/${encodeURIComponent(decodeURIComponent(slug).toLowerCase())}`;
  }

  return path;
}

/** 写入 <link rel=canonical> 与 og:url / twitter:url */
export function applyCanonical(pathname: string, resolvedCityPath?: string): string {
  const path = canonicalPathForLocation(pathname, resolvedCityPath);
  const url = canonicalUrl(path);

  setLinkTag('canonical', url);
  setMetaContent('property', 'og:url', url);
  setMetaContent('name', 'twitter:url', url);

  return url;
}

function setLinkTag(rel: string, href: string): void {
  let link = document.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setMetaContent(attribute: 'name' | 'property', key: string, content: string): void {
  let meta = document.querySelector(`meta[${attribute}="${key}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}
