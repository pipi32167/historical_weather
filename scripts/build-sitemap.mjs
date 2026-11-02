#!/usr/bin/env node
/**
 * 生成 public/sitemap.xml
 *
 * 覆盖范围：
 * - 静态页：/、/about
 * - cityMappings 里的手写城市（slug 直接从源文件解析，避免和代码漂移）
 * - 离线行政区索引里的全部省/地级/区县（3237 条 → /city/{slug}）
 *
 * slug 规则必须与 src/utils/citySlug.ts 一致：简称拼音；同音地名里 adcode 最小的
 * 占裸 slug，其余加 `-adcode` 后缀。src/utils/sitemap.test.ts 会校验 sitemap 里
 * 每个 /city/ 地址都能被 resolveCitySlug 解析，两个实现一旦漂移测试就会失败。
 *
 * 运行：npm run sitemap
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'src/data/chinaDistricts.json');
const MAPPINGS_FILE = path.join(ROOT, 'src/data/cityMappings.ts');
const OUT_FILE = path.join(ROOT, 'public/sitemap.xml');

/**
 * 站点主域名。
 * 以线上实际服务的域名为准（historicaltemperature.org 可解析并已在 Vercel 部署；
 * 仓库里曾出现过 historicalweather.org 的写法，而该域名未注册）。
 * 运行时 canonical 由 window.location.origin 推导，不依赖这里；
 * 如需为其他域名生成 sitemap：SITE_ORIGIN=https://example.com npm run sitemap
 */
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://historicaltemperature.org';

/** 与 citySlug.ts 一致的同音 slug 规则 */
function assignSlugs(rows) {
  const groups = new Map();

  for (const row of rows) {
    const [name, adcode, , , , , , pinyin] = row;
    const slug = (pinyin || '').replace(/\s+/g, '').toLowerCase();
    if (!slug) continue;
    const group = groups.get(slug);
    if (group) group.push({ adcode, name });
    else groups.set(slug, [{ adcode, name }]);
  }

  const slugs = new Map();

  for (const [slug, group] of groups) {
    const sorted = [...group].sort((a, b) => a.adcode - b.adcode);
    sorted.forEach((place, index) => {
      slugs.set(place.adcode, index === 0 ? slug : `${slug}-${place.adcode}`);
    });
  }

  return slugs;
}

/** 从 cityMappings.ts 解析手写城市 id（避免维护第二份清单） */
async function readMappedCityIds() {
  const source = await readFile(MAPPINGS_FILE, 'utf8');
  const ids = new Set();

  for (const match of source.matchAll(/^\s{2}'([a-z0-9]+)':\s*\{/gm)) {
    const id = match[1];
    if (id === 'current-location') continue;
    ids.add(id);
  }

  return [...ids];
}

function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function main() {
  const data = JSON.parse(await readFile(DATA_FILE, 'utf8'));
  const slugs = assignSlugs(data.r);
  const mappedIds = await readMappedCityIds();
  const lastmod = new Date().toISOString().slice(0, 10);

  const urls = new Map();

  const addUrl = (loc, changefreq, priority) => {
    if (!urls.has(loc)) urls.set(loc, { changefreq, priority });
  };

  addUrl(`${SITE_ORIGIN}/`, 'daily', '1.0');
  addUrl(`${SITE_ORIGIN}/about`, 'monthly', '0.6');

  for (const id of mappedIds) {
    addUrl(`${SITE_ORIGIN}/city/${id}`, 'weekly', '0.8');
  }

  for (const slug of slugs.values()) {
    addUrl(`${SITE_ORIGIN}/city/${slug}`, 'weekly', '0.6');
  }

  const entries = [...urls.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      ([loc, meta]) =>
        `  <url><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>${meta.changefreq}</changefreq><priority>${meta.priority}</priority></url>`
    ),
    '</urlset>',
    '',
  ].join('\n');

  await writeFile(OUT_FILE, xml, 'utf8');

  const sizeKb = (Buffer.byteLength(xml) / 1024).toFixed(0);
  console.log(`✅ 已写入 public/sitemap.xml：${entries.length} 个 URL（${sizeKb} KB）`);
  console.log(`   手写城市 ${mappedIds.length} 个 / 行政区 ${slugs.size} 个 / 域名 ${SITE_ORIGIN}`);
}

main().catch(error => {
  console.error('❌ 生成 sitemap 失败:', error);
  process.exit(1);
});
