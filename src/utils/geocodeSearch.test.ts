/**
 * 地理编码搜索结果处理测试
 *
 * 所有 fixture 均来自 Open-Meteo Geocoding API 的真实响应（2025-xx 抓取），
 * 用于锁定「搜索南京却出现云南的小村庄」这类相关性错误。
 */
import {
  rankGeocodeResults,
  resolveGeocodeLanguage,
  buildPlaceLabel,
  GeocodeCandidate,
} from './geocodeSearch';

// 真实响应：name=南京&language=zh
const NANJING_RESULTS: GeocodeCandidate[] = [
  {
    id: 1799962,
    name: '南京',
    latitude: 32.06167,
    longitude: 118.77778,
    feature_code: 'PPLA',
    country_code: 'CN',
    country: '中国',
    admin1: '江苏',
    admin2: '南京',
    population: 9314685,
  },
  {
    id: 9924292,
    name: '南京',
    latitude: 23.4071,
    longitude: 99.7757,
    feature_code: 'PPL',
    country_code: 'CN',
    country: '中国',
    admin1: '云南',
    admin2: '临沧市',
    population: 0,
  },
  {
    id: 9931976,
    name: '南京',
    latitude: 23.7873,
    longitude: 101.084,
    feature_code: 'PPL',
    country_code: 'CN',
    country: '中国',
    admin1: '云南',
    admin2: '思茅市',
    population: 0,
  },
];

// 真实响应：name=上海&language=zh（含岛屿 ISL 与无人口村庄）
const SHANGHAI_RESULTS: GeocodeCandidate[] = [
  {
    name: '上海',
    latitude: 31.22222,
    longitude: 121.45806,
    feature_code: 'PPLA',
    country_code: 'CN',
    country: '中国',
    admin1: '上海市',
    admin2: '上海市',
    population: 24874500,
  },
  {
    name: '上海',
    latitude: 29.33,
    longitude: 121.058,
    feature_code: 'PPL',
    country_code: 'CN',
    country: '中国',
    admin1: '浙江',
    admin2: '绍兴市',
    population: 0,
  },
  {
    name: '上海',
    latitude: 27.074,
    longitude: 100.107,
    feature_code: 'PPL',
    country_code: 'CN',
    country: '中国',
    admin1: '云南',
    admin2: '丽江市',
    population: 0,
  },
  {
    name: '上海',
    latitude: 30.494,
    longitude: 122.366,
    feature_code: 'ISL',
    country_code: 'CN',
    country: '中国',
    admin1: '浙江',
    population: 0,
  },
];

// 真实响应：name=昆山&language=zh —— 上游只返回村庄，没有昆山市
const KUNSHAN_ONLY_VILLAGES: GeocodeCandidate[] = [
  { name: '昆山', latitude: 26.1, longitude: 117.6, feature_code: 'PPL', admin1: '福建省', country: '中国', population: 0 },
  { name: '昆山', latitude: 28.4, longitude: 118.1, feature_code: 'PPL', admin1: '江西', country: '中国', population: 0 },
  { name: '昆山', latitude: 19.9, longitude: 110.3, feature_code: 'PPL', admin1: '海南', country: '中国', population: 0 },
];

// 真实响应：name=Cambridge&language=en（多个同级大城市，应该都保留）
const CAMBRIDGE_RESULTS: GeocodeCandidate[] = [
  { name: 'Cambridge', latitude: 52.2, longitude: 0.11667, feature_code: 'PPLA2', country: 'United Kingdom', country_code: 'GB', admin1: 'England', population: 145674 },
  { name: 'Cambridge', latitude: 43.3601, longitude: -80.31269, feature_code: 'PPL', country: 'Canada', country_code: 'CA', admin1: 'Ontario', population: 129920 },
  { name: 'Cambridge', latitude: 42.3751, longitude: -71.10561, feature_code: 'PPL', country: 'United States', country_code: 'US', admin1: 'Massachusetts', population: 110402 },
  { name: 'Cambridge', latitude: 38.57179, longitude: -76.07883, feature_code: 'PPLA2', country: 'United States', country_code: 'US', admin1: 'Maryland', population: 12507 },
  { name: 'Cambridge', latitude: 40.28174, longitude: -99.7404, feature_code: 'PPL', country: 'United States', country_code: 'US', admin1: 'Nebraska', population: 1051 },
];

// 真实响应：上海（美国北卡）存在完全重复的两条记录
const DUPLICATED_RESULTS: GeocodeCandidate[] = [
  { name: 'Shanghai', latitude: 34.78322, longitude: -76.6891, feature_code: 'PPL', admin1: 'North Carolina', country: 'United States', population: 0 },
  { name: 'Shanghai', latitude: 34.78322, longitude: -76.6891, feature_code: 'PPL', admin1: 'North Carolina', country: 'United States', population: 0 },
  { name: 'Shanghai', latitude: 31.22222, longitude: 121.45806, feature_code: 'PPLA', admin1: 'Shanghai Municipality', country: 'China', population: 24874500 },
];

// 只有非居民地要素（山/岛等）时不应把结果全部过滤掉
const MOUNTAIN_ONLY: GeocodeCandidate[] = [
  { name: '黄山', latitude: 30.13, longitude: 118.17, feature_code: 'MTS', admin1: '安徽', country: '中国', population: 0 },
  { name: '黄山', latitude: 35.05, longitude: 117.9, feature_code: 'MT', admin1: '山东', country: '中国', population: 0 },
];

describe('rankGeocodeResults - 同名小村庄不应污染大城市搜索结果', () => {
  it('搜索「南京」只保留江苏南京，剔除云南同名村庄', () => {
    const ranked = rankGeocodeResults('南京', NANJING_RESULTS);

    expect(ranked).toHaveLength(1);
    expect(ranked[0].admin1).toBe('江苏');
    expect(ranked[0].population).toBe(9314685);
  });

  it('搜索「上海」剔除同名村庄和岛屿要素', () => {
    const ranked = rankGeocodeResults('上海', SHANGHAI_RESULTS);

    expect(ranked).toHaveLength(1);
    expect(ranked[0].admin1).toBe('上海市');
    expect(ranked.some(r => r.feature_code === 'ISL')).toBe(false);
  });

  it('上游只有村庄时不做过滤（不能把结果清空）', () => {
    const ranked = rankGeocodeResults('昆山', KUNSHAN_ONLY_VILLAGES);

    expect(ranked).toHaveLength(KUNSHAN_ONLY_VILLAGES.length);
  });

  it('存在多个重要城市时全部保留，并按人口降序', () => {
    const ranked = rankGeocodeResults('Cambridge', CAMBRIDGE_RESULTS);

    expect(ranked.map(r => r.country_code)).toEqual(['GB', 'CA', 'US', 'US']);
    expect(ranked.map(r => r.population)).toEqual([145674, 129920, 110402, 12507]);
  });

  it('完全重复的记录只保留一条', () => {
    const ranked = rankGeocodeResults('Shanghai', DUPLICATED_RESULTS);

    expect(ranked).toHaveLength(1);
    expect(ranked[0].country).toBe('China');
  });

  it('只有山/岛等非居民地要素时回退到原始结果，而不是返回空列表', () => {
    const ranked = rankGeocodeResults('黄山', MOUNTAIN_ONLY);

    expect(ranked).toHaveLength(MOUNTAIN_ONLY.length);
  });

  it('按 limit 截断结果', () => {
    const ranked = rankGeocodeResults('Cambridge', CAMBRIDGE_RESULTS, 2);

    expect(ranked).toHaveLength(2);
  });

  it('人口相同时完全同名优先（「西安」优先于「西安村」）', () => {
    const results: GeocodeCandidate[] = [
      { name: '西安村', latitude: 27.0, longitude: 119.5, feature_code: 'PPL', admin1: '福建省', country: '中国', population: 0 },
      { name: '西安', latitude: 28.4, longitude: 111.0, feature_code: 'PPL', admin1: '湖南', country: '中国', population: 0 },
    ];

    expect(rankGeocodeResults('西安', results)[0].name).toBe('西安');
  });

  it('上游本地化的地名不能把人口更多的城市挤下去（中文界面搜 Cambridge）', () => {
    const results: GeocodeCandidate[] = [
      { name: 'Cambridge', latitude: 40.28, longitude: -99.74, feature_code: 'PPLA2', admin1: '俄亥俄州', country: '美国', population: 10402 },
      { name: '劍橋', latitude: 52.2, longitude: 0.11667, feature_code: 'PPLA2', admin1: '英格兰', country: '英国', population: 145674 },
    ];

    const ranked = rankGeocodeResults('Cambridge', results);

    expect(ranked[0].population).toBe(145674);
    expect(ranked[0].name).toBe('劍橋');
  });

  it('不修改传入的数组', () => {
    const input = [...NANJING_RESULTS];
    rankGeocodeResults('南京', input);

    expect(input).toEqual(NANJING_RESULTS);
  });
});

describe('resolveGeocodeLanguage - 搜索语言必须跟着查询词，而不是界面语言', () => {
  it('英文界面搜索中文名仍需用 zh 查询（否则上游返回空）', () => {
    expect(resolveGeocodeLanguage('南京', 'en')).toBe('zh');
    expect(resolveGeocodeLanguage('南京', 'en-US')).toBe('zh');
  });

  it('中文界面搜索英文名用 zh，可以拿到本地化地名', () => {
    expect(resolveGeocodeLanguage('Munich', 'zh')).toBe('zh');
    expect(resolveGeocodeLanguage('Munich', 'zh-CN')).toBe('zh');
  });

  it('英文界面搜索英文名用 en', () => {
    expect(resolveGeocodeLanguage('Munich', 'en')).toBe('en');
  });
});

describe('buildPlaceLabel - 展示名必须能区分同名地点', () => {
  it('包含地级市（admin2），避免「南京, 云南, 中国」这种误导', () => {
    expect(
      buildPlaceLabel({
        name: '黄山',
        admin2: '丽江市',
        admin1: '云南',
        country: '中国',
      })
    ).toBe('黄山, 丽江市, 云南, 中国');
  });

  it('重复的行政名只出现一次', () => {
    expect(
      buildPlaceLabel({ name: '上海', admin2: '上海市', admin1: '上海市', country: '中国' })
    ).toBe('上海, 上海市, 中国');
  });

  it('城市名与上级同名时去重', () => {
    expect(
      buildPlaceLabel({ name: '南京', admin2: '南京', admin1: '江苏', country: '中国' })
    ).toBe('南京, 江苏, 中国');
  });

  it('缺失字段不会产生多余分隔符', () => {
    expect(buildPlaceLabel({ name: 'Sydney', country: 'Australia' })).toBe('Sydney, Australia');
    expect(buildPlaceLabel({ name: 'Sydney' })).toBe('Sydney');
  });
});
