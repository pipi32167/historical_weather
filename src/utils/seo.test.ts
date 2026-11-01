/**
 * canonical URL 测试
 *
 * 背景（E2E 发现）：public/index.html 里 canonical 与 og:url 是写死的主页地址，
 * App 从不按路由更新 → 所有 /city/* 页面的 canonical 都指向首页，
 * 等于告诉搜索引擎「这些落地页都是首页的重复内容」。
 */
import { canonicalUrl, canonicalPathForLocation } from './seo';

describe('canonicalUrl', () => {
  it('根路径', () => {
    expect(canonicalUrl('/')).toBe('https://historicalweather.org/');
    expect(canonicalUrl('')).toBe('https://historicalweather.org/');
  });

  it('普通路径', () => {
    expect(canonicalUrl('/about')).toBe('https://historicalweather.org/about');
    expect(canonicalUrl('/city/nanjing')).toBe('https://historicalweather.org/city/nanjing');
  });

  it('补齐前导斜杠、去掉尾部斜杠', () => {
    expect(canonicalUrl('city/kunshan')).toBe('https://historicalweather.org/city/kunshan');
    expect(canonicalUrl('/city/kunshan/')).toBe('https://historicalweather.org/city/kunshan');
  });

  it('丢弃 query 与 hash（canonical 只保留路径）', () => {
    expect(canonicalUrl('/city/nanjing?name=南京#top')).toBe(
      'https://historicalweather.org/city/nanjing'
    );
  });

  it('city slug 统一转小写，避免同一页面出现多个 URL', () => {
    expect(canonicalUrl('/city/NanJing')).toBe('https://historicalweather.org/city/nanjing');
  });
});

describe('canonicalPathForLocation', () => {
  it('非城市路由原样返回', () => {
    expect(canonicalPathForLocation('/')).toBe('/');
    expect(canonicalPathForLocation('/about')).toBe('/about');
    expect(canonicalPathForLocation('/city')).toBe('/city');
  });

  it('城市路由在拿到解析结果后使用规范 slug', () => {
    expect(canonicalPathForLocation('/city/320583', '/city/kunshan')).toBe('/city/kunshan');
    expect(canonicalPathForLocation('/city/KunShan', '/city/kunshan')).toBe('/city/kunshan');
  });

  it('没有解析结果时用请求路径本身（小写 + 编码）', () => {
    expect(canonicalPathForLocation('/city/KunShan')).toBe('/city/kunshan');
    expect(canonicalPathForLocation('/city/南京市')).toBe(`/city/${encodeURIComponent('南京市')}`);
  });
});
