/**
 * geocodeCity 集成测试（mock fetch，不访问网络）
 *
 * 回归目标：搜索「南京」时不能把云南的同名 0 人口村庄当成匹配项返回，
 * 且中文查询在英文界面下也必须用 zh 索引请求上游。
 */
import { openMeteoService } from './openMeteoWeather';

// 上游真实响应结构（name=南京&language=zh）
const NANJING_UPSTREAM = {
  results: [
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
      timezone: 'Asia/Shanghai',
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
      timezone: 'Asia/Shanghai',
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

describe('openMeteoService.geocodeCity', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it('中文查询在英文界面下仍以 language=zh 请求上游', async () => {
    const fetchMock = mockFetchOnce(NANJING_UPSTREAM);

    await openMeteoService.geocodeCity('南京', 'en', 8);

    const requestedUrl = String(fetchMock.mock.calls[0][0]);
    expect(requestedUrl).toContain('language=zh');
    expect(requestedUrl).toContain('name=%E5%8D%97%E4%BA%AC');
    // 需要多取原始结果，才能保证过滤后仍有足够的候选项
    expect(requestedUrl).toMatch(/count=2[0-9]|count=30/);
  });

  it('剔除云南同名村庄，只返回江苏南京', async () => {
    mockFetchOnce(NANJING_UPSTREAM);

    const results = await openMeteoService.geocodeCity('南京', 'zh', 8);

    expect(results).toHaveLength(1);
    expect(results[0].admin1).toBe('江苏');
  });

  it('相同查询命中缓存，不重复请求上游', async () => {
    const fetchMock = mockFetchOnce(NANJING_UPSTREAM);

    await openMeteoService.geocodeCity('南京', 'zh', 8);
    await openMeteoService.geocodeCity('南京', 'zh', 8);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('空查询直接返回空数组，不发请求', async () => {
    const fetchMock = mockFetchOnce({ results: [] });

    await expect(openMeteoService.geocodeCity('   ', 'zh', 8)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
