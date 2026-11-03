/**
 * sitemap 一致性测试
 *
 * scripts/build-sitemap.mjs 为了能在 node 里跑，自带一份 slug 规则实现；
 * 这里校验它与运行时 src/utils/citySlug.ts 完全一致——两边一旦漂移，
 * sitemap 里就会出现 404 地址。
 */
import fs from 'fs';
import path from 'path';
import { resolveCitySlug } from './citySlug';
import { SITE_ORIGIN } from './seo';

const ROOT = path.resolve(__dirname, '../..');
const sitemapXml = fs.readFileSync(path.join(ROOT, 'public/sitemap.xml'), 'utf8');
const robotsTxt = fs.readFileSync(path.join(ROOT, 'public/robots.txt'), 'utf8');

const locs = Array.from(sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)).map(match => match[1]);
const cityPaths = locs.filter(loc => loc.includes('/city/'));

describe('public/sitemap.xml', () => {
  it('覆盖全部行政区 + 手写城市', () => {
    expect(locs.length).toBeGreaterThan(3200);
    expect(cityPaths.length).toBeGreaterThan(3200);
  });

  it('URL 不重复且都是 https', () => {
    expect(new Set(locs).size).toBe(locs.length);
    expect(locs.every(loc => loc.startsWith('https://'))).toBe(true);
  });

  it('域名统一为线上实际域名 historicaltemperature.org（与 canonical / robots 一致）', () => {
    const origin = 'https://historicaltemperature.org';
    expect(locs.every(loc => loc.startsWith(`${origin}/`))).toBe(true);
    // historicalweather.org 未注册，任何地方都不应再出现
    expect(sitemapXml.includes('historicalweather.org')).toBe(false);
    expect(robotsTxt).toContain(`Sitemap: ${origin}/sitemap.xml`);
    expect(robotsTxt.includes('historicalweather.org')).toBe(false);
    expect(SITE_ORIGIN).toBe(origin);
  });

  it('包含首页、关于页与关键城市', () => {
    expect(locs).toContain('https://historicaltemperature.org/');
    expect(locs).toContain('https://historicaltemperature.org/about');
    expect(locs).toContain('https://historicaltemperature.org/city/nanjing');
    expect(locs).toContain('https://historicaltemperature.org/city/kunshan');
    expect(locs).toContain('https://historicaltemperature.org/city/guangdong');
    // 同音地名：苏州市占裸 slug，宿州市带 adcode
    expect(locs).toContain('https://historicaltemperature.org/city/suzhou');
    expect(locs).toContain('https://historicaltemperature.org/city/suzhou-341300');
  });

  it('每个城市地址都能被运行时解析（slug 规则无漂移）', () => {
    const broken: string[] = [];

    for (const loc of cityPaths) {
      const slug = decodeURIComponent(loc.split('/city/')[1]);
      if (!resolveCitySlug(slug)) broken.push(slug);
    }

    expect(broken.slice(0, 10)).toEqual([]);
  });

  it('不包含无效的手写城市占位（current-location）', () => {
    expect(locs.some(loc => loc.endsWith('/city/current-location'))).toBe(false);
  });
});
