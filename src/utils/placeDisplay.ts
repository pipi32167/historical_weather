/**
 * 地名展示（i18n）
 *
 * 问题：离线行政区索引只有中文名。英文界面下当前城市、搜索结果、城市页标题
 * 都会显示中文（「北京市, 中国」「昆山市 Historical Temperature Data」），中英混排。
 *
 * 约定：
 * - `Location` / `OpenMeteoLocation` 里始终保存中文名 + `nameEn` / `admin1En` / `admin2En`
 * - 展示时按当前语言挑一个，语言切换后能立即生效
 * - 手写城市（cityMappings）优先走 i18n 的 `cities.<id>` 翻译（已有 76 条）
 */
import i18n from '../i18n';

export interface LocalizablePlace {
  id?: string | number;
  name: string;
  nameEn?: string;
  admin1?: string;
  admin1En?: string;
  admin2?: string;
  admin2En?: string;
  country?: string;
}

/** 国家名 → countries.* 的 key（枚举之外的国家原样显示） */
const COUNTRY_KEYS: Record<string, string> = {
  china: 'china',
  中国: 'china',
  japan: 'japan',
  日本: 'japan',
  美国: 'usa',
  'united states': 'usa',
  英国: 'uk',
  'united kingdom': 'uk',
  法国: 'france',
  france: 'france',
  澳大利亚: 'australia',
  australia: 'australia',
  新加坡: 'singapore',
  singapore: 'singapore',
};

export function currentLanguage(): string {
  return i18n.language || 'zh-CN';
}

export function isChineseLanguage(language?: string): boolean {
  return (language || currentLanguage()).toLowerCase().startsWith('zh');
}

/** 城市/地点名（手写城市走 i18n，索引城市用中英名字段） */
export function localizedPlaceName(
  place: LocalizablePlace,
  t?: (key: string) => string,
  language?: string
): string {
  if (t && place.id !== undefined) {
    const key = `cities.${place.id}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
  }

  if (isChineseLanguage(language)) return place.name;
  return place.nameEn || place.name;
}

/** 上级行政区（地级 / 省级） */
export function localizedAdmin2(place: LocalizablePlace, language?: string): string | undefined {
  return isChineseLanguage(language) ? place.admin2 : place.admin2En || place.admin2;
}

export function localizedAdmin1(place: LocalizablePlace, language?: string): string | undefined {
  return isChineseLanguage(language) ? place.admin1 : place.admin1En || place.admin1;
}

/** 国家名 */
export function localizedCountry(
  country: string | undefined,
  t?: (key: string) => string,
  language?: string
): string {
  if (!country) return '';

  const key = COUNTRY_KEYS[country.trim().toLowerCase()];
  if (key && t) {
    const translated = t(`countries.${key}`);
    if (translated && !translated.startsWith('countries.')) return translated;
  }
  return country;
}

/**
 * 搜索结果的一行文案：名称, 地级市, 省, 国家（重复项自动去重）
 */
export function localizedPlaceLabel(
  place: LocalizablePlace,
  t?: (key: string) => string,
  language?: string
): string {
  return joinParts([
    localizedPlaceName(place, t, language),
    localizedAdmin2(place, language),
    localizedAdmin1(place, language),
    localizedCountry(place.country, t, language),
  ]);
}

/** 只要上级行政区与国家（搜索结果第二行用，名称已单独展示） */
export function localizedRegionLabel(
  place: LocalizablePlace,
  t?: (key: string) => string,
  language?: string
): string {
  return joinParts([
    localizedAdmin2(place, language),
    localizedAdmin1(place, language),
    localizedCountry(place.country, t, language),
  ]);
}

function joinParts(values: Array<string | undefined>): string {
  const parts: string[] = [];

  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    if (parts.some(part => part.toLowerCase() === trimmed.toLowerCase())) continue;
    parts.push(trimmed);
  }

  return parts.join(', ');
}
