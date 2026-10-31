/**
 * 城市页 slug 解析
 *
 * /city/:city 原来只认 cityMappings 里手写的 ~30 个城市，离线索引里的 3237 个
 * 行政区无法直达（/city/kunshan 直接 404），也就没有对应的 SEO 落地页。
 *
 * 解析优先级：
 * 1. cityMappings（手写城市，带英文名与多语言翻译）——URL 保持原样，不破坏已有收录
 * 2. 行政区索引：slug = 简称拼音（kunshan / guangdong）；同音冲突时 adcode 最小者占裸 slug，
 *    其余加 `-adcode` 后缀（suzhou → 苏州市，suzhou-341300 → 宿州市）
 * 3. 纯 6 位 adcode（/city/320583）也能访问，canonical 指向规范 slug
 *
 * 注意：本模块会引入 170KB 的行政区数据，调用方必须动态 import（`await import(...)`），
 * 不要静态引入到主包。
 */
import { getCityByName } from '../data/cityMappings';
import type { Location } from '../types/weather';
import { listChinaPlaces } from './chinaPlaceIndex';
import type { ChinaPlace } from './chinaPlaceIndex';

export type CitySource = 'mapping' | 'china-districts';

export interface ResolvedCity {
  location: Location;
  /** 规范 slug，如 kunshan / suzhou-341300 */
  slug: string;
  /** 规范路径，如 /city/kunshan */
  canonicalPath: string;
  source: CitySource;
}

let slugIndex: Map<string, ChinaPlace> | null = null;
let adcodeIndex: Map<number, ChinaPlace> | null = null;
let canonicalSlugByAdcode: Map<number, string> | null = null;

/** slug 用简称拼音，去掉空格与非法字符 */
export function slugForPlace(place: ChinaPlace): string {
  return place.pinyin.replace(/\s+/g, '').toLowerCase();
}

/** 同音地名里 adcode 最小的占裸 slug，其余加 -adcode 后缀 */
function buildIndexes(): void {
  if (slugIndex && adcodeIndex && canonicalSlugByAdcode) return;

  const places = listChinaPlaces();
  const grouped = new Map<string, ChinaPlace[]>();

  for (const place of places) {
    const slug = slugForPlace(place);
    const group = grouped.get(slug);
    if (group) group.push(place);
    else grouped.set(slug, [place]);
  }

  slugIndex = new Map();
  adcodeIndex = new Map();
  canonicalSlugByAdcode = new Map();

  // 避免遍历 Map（tsconfig target=es5 不支持 downlevelIteration）
  grouped.forEach((group, slug) => {
    const sorted = [...group].sort((a, b) => a.adcode - b.adcode);

    sorted.forEach((place, position) => {
      const canonicalSlug = position === 0 ? slug : `${slug}-${place.adcode}`;
      slugIndex!.set(canonicalSlug, place);
      adcodeIndex!.set(place.adcode, place);
      canonicalSlugByAdcode!.set(place.adcode, canonicalSlug);
    });
  });
}

function locationFromPlace(place: ChinaPlace): Location {
  return {
    id: `cn-${place.adcode}`,
    name: place.name,
    nameEn: place.englishName,
    latitude: place.latitude,
    longitude: place.longitude,
    country: 'China',
    timezone: 'Asia/Shanghai',
    admin1: place.province,
    admin1En: place.provinceEn,
    admin2: place.city,
    admin2En: place.cityEn,
  };
}

/** 解析 /city/:city 的参数 */
export function resolveCitySlug(input: string): ResolvedCity | null {
  const raw = decodeURIComponent((input || '').trim());
  if (!raw) return null;

  const mappingCity = getCityByName(raw);
  if (mappingCity) {
    const slug = raw.toLowerCase();
    return { location: mappingCity, slug, canonicalPath: `/city/${slug}`, source: 'mapping' };
  }

  buildIndexes();

  const bySlug = slugIndex!.get(raw.toLowerCase());
  if (bySlug) {
    const slug = canonicalSlugByAdcode!.get(bySlug.adcode)!;
    return {
      location: locationFromPlace(bySlug),
      slug,
      canonicalPath: `/city/${slug}`,
      source: 'china-districts',
    };
  }

  // 纯 adcode（6 位数字）
  if (/^\d{6}$/.test(raw)) {
    const byAdcode = adcodeIndex!.get(Number(raw));
    if (byAdcode) {
      const slug = canonicalSlugByAdcode!.get(byAdcode.adcode)!;
      return {
        location: locationFromPlace(byAdcode),
        slug,
        canonicalPath: `/city/${slug}`,
        source: 'china-districts',
      };
    }
  }

  return null;
}

/** adcode → 规范路径（搜索结果点进去时用） */
export function cityPathForAdcode(adcode: number): string | null {
  buildIndexes();
  const slug = canonicalSlugByAdcode!.get(adcode);
  return slug ? `/city/${slug}` : null;
}

/** adcode → 规范 slug */
export function canonicalSlugForAdcode(adcode: number): string | null {
  buildIndexes();
  return canonicalSlugByAdcode!.get(adcode) ?? null;
}
