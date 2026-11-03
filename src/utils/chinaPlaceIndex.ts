/**
 * 中国行政区划离线索引（省 / 地级市 / 区县）
 *
 * 为什么需要它：Open-Meteo 的地理编码直接透传 GeoNames，对国内地名支持很差——
 * 搜「南京」会带回云南的两个同名 0 人口村庄，搜「昆山」只有 8 个同名村庄、
 * 根本找不到昆山市。国内行政区名称是确定数据，没必要依赖外部 API：
 * 本地命中零延迟、零配额、零 key、不依赖跨境网络。
 *
 * 数据来源：scripts/build-china-districts.mjs 生成（阿里 DataV 行政区划 GeoJSON，
 * 已从 GCJ-02 转成 WGS-84）。区划每年会调整，需要时重新生成即可。
 *
 * 注意：索引里只有行政区，没有街道/村/景区/拼音/英文，
 * 这些查询必须回退到远程地理编码（见 openMeteoWeather.geocodeCity）。
 */
import rawDistricts from '../data/chinaDistricts.json';
import { shortPlaceName } from './chinaNameUtils';
import { englishPlaceName } from './placeNamesEn';

/** 1 = 省/直辖市/特区，2 = 地级市/州/盟/地区，3 = 区/县/县级市/旗 */
export type ChinaPlaceLevel = 1 | 2 | 3;

export interface ChinaPlace {
  /** 行政区全名，如「昆山市」 */
  name: string;
  /** 国家统计局行政区划代码，可作稳定 id */
  adcode: number;
  level: ChinaPlaceLevel;
  /** WGS-84 纬度 */
  latitude: number;
  /** WGS-84 经度 */
  longitude: number;
  /** 省级名称，如「江苏省」 */
  province: string;
  /** 地级名称，如「苏州市」；直辖市为市名本身 */
  city: string;
  /** 简称拼音（带空格分音节），如「kun shan」 */
  pinyin: string;
  /** 自治州/自治县的常用简称拼音，如延边朝鲜族自治州 →「yan bian」 */
  alias?: string;
  /** 英文写法（英文界面用），如昆山市 → Kunshan */
  englishName: string;
  /** 省级英文名，如江苏省 → Jiangsu */
  provinceEn: string;
  /** 地级英文名，如苏州市 → Suzhou */
  cityEn: string;
}

/** 生成脚本写出的紧凑格式：n = 名称表，r = [名称, adcode, 层级, 纬度, 经度, 省下标, 市下标, 拼音, 简称拼音?] */
interface ChinaDistrictsFile {
  v: number;
  n: string[];
  r: Array<[string, number, ChinaPlaceLevel, number, number, number, number, string, string?]>;
}

const DATA = rawDistricts as ChinaDistrictsFile;

const PLACES: ChinaPlace[] = DATA.r.map(
  ([name, adcode, level, latitude, longitude, provinceId, cityId, pinyin, alias]) => ({
    name,
    adcode,
    level,
    latitude,
    longitude,
    province: DATA.n[provinceId],
    city: DATA.n[cityId],
    pinyin,
    alias,
    englishName: englishPlaceName(name, pinyin, alias),
    provinceEn: '',
    cityEn: '',
  })
);

/** 中文地名 → 英文名（把 admin1/admin2 也翻成英文用） */
const ENGLISH_NAME_BY_CHINESE = new Map<string, string>();
for (const place of PLACES) {
  if (!ENGLISH_NAME_BY_CHINESE.has(place.name)) {
    ENGLISH_NAME_BY_CHINESE.set(place.name, place.englishName);
  }
}
for (const place of PLACES) {
  place.provinceEn = ENGLISH_NAME_BY_CHINESE.get(place.province) || place.province;
  place.cityEn = ENGLISH_NAME_BY_CHINESE.get(place.city) || place.city;
}

/** 用中文地名查英文名（查不到返回空） */
export function englishNameOf(chineseName: string): string {
  return ENGLISH_NAME_BY_CHINESE.get(chineseName) || '';
}

/** 去掉空白、撇号、连字符并把 ü 统一成 v（Xi'an / xi an / Xian → xian） */
function normalizeLatin(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/ü/g, 'v')
    .replace(/[\s'\u2019\-.·]/g, '');
}

/** 全拼（无空格） */
function flatPinyin(place: ChinaPlace): string {
  return normalizeLatin(place.pinyin);
}

/** 每音节首字母，如 nan jing → nj */
function initialsOf(place: ChinaPlace): string {
  return place.pinyin
    .split(' ')
    .filter(Boolean)
    .map(syllable => normalizeLatin(syllable).charAt(0))
    .join('');
}

export { shortPlaceName };

/** 去掉所有空白（「杭 州」→「杭州」） */
function normalizeQuery(query: string): string {
  return (query || '').replace(/\s+/g, '');
}

/** 匹配层级越低越优先，同级按 adcode 稳定排序 */
function comparePlaces(a: ChinaPlace, b: ChinaPlace): number {
  if (a.level !== b.level) return a.level - b.level;
  return a.adcode - b.adcode;
}

/**
 * 按名称搜索国内行政区。
 *
 * 匹配顺序：中文全名精确 → 中文简称精确 → 中文前缀 → 中文包含 → 全拼精确（含自治州简称）→ 拼音首字母 → 全拼前缀。
 * 同一层级内「省/地级市」优先于「区县」，因此搜「朝阳」先给朝阳市，再给朝阳区。
 * 搜不到就返回空数组，由调用方回退到远程地理编码。
 */
export function searchChinaPlaces(query: string, limit: number = 8): ChinaPlace[] {
  const normalized = normalizeQuery(query);
  if (!normalized || limit <= 0) return [];

  const latin = normalizeLatin(query);
  const hasLatin = /^[a-zv]+$/.test(latin);

  const matchers: Array<(place: ChinaPlace) => boolean> = [
    place => place.name === normalized,
    place => shortPlaceName(place.name) === normalized,
    place => place.name.startsWith(normalized) || shortPlaceName(place.name).startsWith(normalized),
    place => place.name.includes(normalized) || shortPlaceName(place.name).includes(normalized),
  ];

  if (hasLatin) {
    matchers.push(
      // 全拼精确（含自治州简称，如 yanbian → 延边朝鲜族自治州）
      place => flatPinyin(place) === latin || (place.alias !== undefined && normalizeLatin(place.alias) === latin),
      place => latin.length >= 2 && initialsOf(place) === latin,
      place => latin.length >= 2 && flatPinyin(place).startsWith(latin)
    );
  }

  const seen = new Set<number>();
  const results: ChinaPlace[] = [];

  for (const matcher of matchers) {
    const tierMatches = PLACES.filter(place => matcher(place) && !seen.has(place.adcode)).sort(
      comparePlaces
    );

    for (const place of tierMatches) {
      if (seen.has(place.adcode)) continue;
      seen.add(place.adcode);
      results.push(place);
      if (results.length >= limit) return results;
    }
  }

  return results;
}

/** 全部行政区（用于数据校验、生成站点地图等场景） */
export function listChinaPlaces(): ChinaPlace[] {
  return [...PLACES];
}

/** 索引条目总数 */
export function chinaDistrictsCount(): number {
  return PLACES.length;
}
