/**
 * geocodeCity 集成测试（mock fetch，不访问网络）
 *
 * 覆盖两条路径：
 * 1. 国内省/市/区县 → 离线行政区索引命中，不发任何请求
 * 2. 街道/村/英文等索引覆盖不到的查询 → 回退 Open-Meteo，并做相关性过滤
 */
import { openMeteoService } from './openMeteoWeather';

// 上游真实响应结构（name=宏村&language=zh）
const HONGCUN_UPSTREAM = {
  results: [
    {
      id: 1799962,
      name: '宏村',
      latitude: 29.9,
      longitude: 117.98,
      feature_code: 'PPLA2',
      country_code: 'CN',
      country: '中国',
      admin1: '安徽',
      admin2: '黄山市',
      timezone: 'Asia/Shanghai',
      population: 120000,
    },
    {
      id: 9924292,
      name: '宏村',
      latitude: 23.4071,
      longitude: 99.7757,
      feature_code: 'PPL',
      country_code: 'CN',
      country: '中国',
      admin1: '云南',
      admin2: '临沧市',
      timezone: 'Asia/Shanghai',
    },
  ],
};

function mockFetchOnce(payload: unknown) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => payload,
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe('openMeteoService.geocodeCity - 国内行政区走离线索引', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it('搜「南京」直接命中南京市，不发网络请求', async () => {
    const fetchMock = mockFetchOnce(HONGCUN_UPSTREAM);

    const results = await openMeteoService.geocodeCity('南京', 'zh', 8);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('南京市');
    expect(results[0].admin1).toBe('江苏省');
    expect(results[0].country_code).toBe('CN');
    expect(results[0].id).toBe(320100);
  });

  it('搜「昆山」命中昆山市（Open-Meteo 只能给到同名村庄）', async () => {
    const fetchMock = mockFetchOnce(HONGCUN_UPSTREAM);

    const results = await openMeteoService.geocodeCity('昆山', 'zh', 8);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(results[0].name).toBe('昆山市');
    expect(results[0].admin2).toBe('苏州市');
  });

  it('结果同时带中英文名，供英文界面展示', async () => {
    mockFetchOnce(HONGCUN_UPSTREAM);

    const results = await openMeteoService.geocodeCity('昆山', 'en', 8);

    expect(results[0]).toMatchObject({
      name: '昆山市',
      nameEn: 'Kunshan',
      admin1: '江苏省',
      admin1En: 'Jiangsu',
      admin2: '苏州市',
      admin2En: 'Suzhou',
      country: 'China',
      country_code: 'CN',
    });
  });

  it('索引覆盖不到的查询回退远程，并带语言与放大后的 count', async () => {
    const fetchMock = mockFetchOnce(HONGCUN_UPSTREAM);

    const results = await openMeteoService.geocodeCity('宏村', 'zh', 8);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = String(fetchMock.mock.calls[0][0]);
    expect(requestedUrl).toContain('language=zh');
    expect(requestedUrl).toContain('count=24');
    // 远程结果同样经过相关性过滤：云南的 0 人口村庄被剔除
    expect(results).toHaveLength(1);
    expect(results[0].admin1).toBe('安徽');
  });

  it('拼音/英文查询也走离线索引：Shanghai → 上海市', async () => {
    const fetchMock = mockFetchOnce(HONGCUN_UPSTREAM);

    const results = await openMeteoService.geocodeCity('Shanghai', 'en', 8);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(results[0].name).toBe('上海市');
    expect(results[0].country).toBe('China');
  });

  it('国外城市不被离线索引拦截，仍走远程', async () => {
    const fetchMock = mockFetchOnce({ results: [] });

    await openMeteoService.geocodeCity('Tokyo', 'en', 8);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('language=en');
  });

  it('远程路径相同查询命中缓存，不重复请求上游', async () => {
    const fetchMock = mockFetchOnce(HONGCUN_UPSTREAM);

    await openMeteoService.geocodeCity('宏村', 'zh', 8);
    await openMeteoService.geocodeCity('宏村', 'zh', 8);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('空查询直接返回空数组，不发请求', async () => {
    const fetchMock = mockFetchOnce({ results: [] });

    await expect(openMeteoService.geocodeCity('   ', 'zh', 8)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
