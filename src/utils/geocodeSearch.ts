/**
 * 地理编码搜索结果处理
 *
 * 背景：Open-Meteo 的地理编码接口直接透传 GeoNames 数据，返回结果**不做相关性排序**。
 * GeoNames 里存在大量与大城市同名的 0 人口小村庄（要素码 PPL/PPLA4/PPLL），
 * 因此搜索「南京」时会连同云南临沧、思茅的两个同名村庄一起返回，
 * 用户看到「南京, 云南, 中国」会认为搜索结果错了。
 *
 * 这里负责三件事，都是纯函数，便于测试：
 * 1. rankGeocodeResults：去重 → 过滤非居民地要素 → 剔除无关紧要的同名小地名 → 按相关性排序
 * 2. resolveGeocodeLanguage：搜索语言跟随查询词语种（上游的语言参数同时决定了索引）
 * 3. buildPlaceLabel：生成能区分同名地点的展示文案（补齐 admin2）
 */

export interface GeocodeCandidate {
  id?: number;
  name: string;
  latitude: number;
  longitude: number;
  population?: number;
  /** GeoNames 要素码，如 PPLC/PPLA/PPLA2/PPL/PPLX/MTS/ISL */
  feature_code?: string;
  country?: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
}

/** 人口达到此值即视为「重要城市」 */
const SIGNIFICANT_POPULATION = 100_000;

/** 国家级/省级/地级行政中心，即使没有人口数据也视为重要城市 */
const ADMIN_SEAT_FEATURE_CODES = new Set(['PPLC', 'PPLA', 'PPLA2']);

/** 排序用的要素等级，数字越小越重要 */
const FEATURE_RANK: Record<string, number> = {
  PPLC: 0,
  PPLA: 1,
  PPLA2: 2,
  PPLA3: 3,
  PPLA4: 4,
  PPL: 5,
};

/** 居民地 / 行政区要素（PPL* / ADM*），山脉、岛屿、河流等不属于可查询天气的地点 */
function isPopulatedPlace(featureCode?: string): boolean {
  if (!featureCode) return true; // 上游未给出要素码时不做判断
  return featureCode.startsWith('PPL') || featureCode.startsWith('ADM');
}

function isSignificant(place: GeocodeCandidate): boolean {
  if (place.feature_code && ADMIN_SEAT_FEATURE_CODES.has(place.feature_code)) return true;
  return (place.population ?? 0) >= SIGNIFICANT_POPULATION;
}

function featureRank(place: GeocodeCandidate): number {
  if (!place.feature_code) return 6;
  return FEATURE_RANK[place.feature_code] ?? 6;
}

/** 归一化地名，用于比较（忽略大小写与重音符号） */
function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function dedupeKey(place: GeocodeCandidate): string {
  return `${normalizeName(place.name)}@${place.latitude.toFixed(3)},${place.longitude.toFixed(3)}`;
}

/**
 * 对比排序：人口多的优先，同人口时完全同名优先，最后按要素等级。
 *
 * 人口是第一优先级（而不是同名）：上游会根据 language 参数本地化地名，
 * 中文界面搜索「Cambridge」时英国剑桥会被显示成「劍橋」，若同名优先则会被
 * 1 万人口的同名小镇排到前面。
 */
function compareByRelevance(query: string) {
  const normalizedQuery = normalizeName(query);

  return (a: GeocodeCandidate, b: GeocodeCandidate): number => {
    const populationDiff = (b.population ?? 0) - (a.population ?? 0);
    if (populationDiff !== 0) return populationDiff;

    const aExact = normalizeName(a.name) === normalizedQuery ? 0 : 1;
    const bExact = normalizeName(b.name) === normalizedQuery ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;

    return featureRank(a) - featureRank(b);
  };
}

/**
 * 对上游地理编码结果做相关性排序与清洗。
 *
 * 过滤规则刻意保守：
 * - 只要结果里存在「重要城市」（人口 ≥ 10 万或是国家/省/地级行政中心），
 *   就丢掉其余同名小地名（这正是「南京 → 云南小村庄」的根因）；
 * - 如果全部结果都是小地名（例如上游对「昆山」只返回村庄），则原样保留，
 *   绝不让搜索结果变空；
 * - 如果过滤后没有任何居民地要素，则回退到原始结果。
 */
export function rankGeocodeResults<T extends GeocodeCandidate>(
  query: string,
  results: T[],
  limit?: number
): T[] {
  if (!Array.isArray(results) || results.length === 0) return [];

  const seen = new Set<string>();
  const deduped = results.filter(place => {
    if (!place || typeof place.name !== 'string') return false;
    const key = dedupeKey(place);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const populated = deduped.filter(place => isPopulatedPlace(place.feature_code));
  const candidates = populated.length > 0 ? populated : deduped;

  const hasSignificantMatch = candidates.some(isSignificant);
  const filtered = hasSignificantMatch ? candidates.filter(isSignificant) : candidates;

  const sorted = filtered.sort(compareByRelevance(query));

  return typeof limit === 'number' && limit > 0 ? sorted.slice(0, limit) : sorted;
}

/** CJK（汉字/假名/谚文）字符 */
const CJK_PATTERN = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

/**
 * 决定请求上游时使用的 language 参数。
 *
 * 上游的 language 参数不只影响返回文案的语言，还决定了搜索索引：
 * `name=南京&language=en` 返回 0 条结果，因此不能直接用界面语言。
 * 中文查询一律用 zh；拉丁字母查询沿用界面语言（中文界面用 zh 可获得本地化地名）。
 */
export function resolveGeocodeLanguage(query: string, uiLanguage: string): string {
  if (CJK_PATTERN.test(query)) return 'zh';
  return uiLanguage.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

/**
 * 生成搜索结果展示文案：name, admin2, admin1, country（重复项自动去重）。
 * 补上 admin2 是为了让「黄山, 丽江市, 云南, 中国」和「黄山, 安徽, 中国」可区分。
 */
export function buildPlaceLabel(place: {
  name?: string;
  admin2?: string;
  admin1?: string;
  country?: string;
}): string {
  const parts: string[] = [];

  const push = (value?: string) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    const exists = parts.some(part => part.toLowerCase() === trimmed.toLowerCase());
    if (!exists) parts.push(trimmed);
  };

  push(place.name);
  push(place.admin2);
  push(place.admin1);
  push(place.country);

  return parts.join(', ');
}
