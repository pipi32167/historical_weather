/**
 * 城市页 slug 解析测试
 *
 * 背景（E2E 发现）：/city/:city 只认 cityMappings 里手写的 ~30 个城市，
 * 离线索引里的 3237 个行政区都无法直达（/city/kunshan → 404），
 * 白白浪费了这股做 SEO 落地页的数据。
 *
 * 规则：
 * - 先查 cityMappings（手写城市，带英文名与翻译），保持原有 URL 不变；
 * - 再查行政区索引：slug 用简称拼音；同音冲突时 adcode 最小的占裸 slug，其余加 `-adcode` 后缀；
 * - 纯 adcode（6 位数字）也能访问，canonical 指向规范 slug。
 */
import { resolveCitySlug, cityPathForAdcode, slugForPlace, canonicalSlugForAdcode } from './citySlug';
import { listChinaPlaces } from './chinaPlaceIndex';

describe('resolveCitySlug - 手写城市优先', () => {
  it('已有的 /city/nanjing 保持原样（英文名 + 翻译）', () => {
    const resolved = resolveCitySlug('nanjing');

    expect(resolved).not.toBeNull();
    expect(resolved!.source).toBe('mapping');
    expect(resolved!.location.id).toBe('nanjing');
    expect(resolved!.location.name).toBe('Nanjing');
    expect(resolved!.canonicalPath).toBe('/city/nanjing');
  });

  it('大小写不敏感', () => {
    expect(resolveCitySlug('NanJing')!.location.id).toBe('nanjing');
  });
});

describe('resolveCitySlug - 行政区索引', () => {
  it('/city/kunshan 能命中昆山市（E2E 里之前是 404）', () => {
    const resolved = resolveCitySlug('kunshan');

    expect(resolved).not.toBeNull();
    expect(resolved!.source).toBe('china-districts');
    expect(resolved!.location.name).toBe('昆山市');
    // id 必须是规范 slug，否则 locationStore 里的 id 无法反解析回 /city/:slug
    expect(resolved!.location.id).toBe('kunshan');
    expect(resolved!.location.country).toBe('China');
    expect(resolved!.location.admin1).toBe('江苏省');
    expect(resolved!.location.admin2).toBe('苏州市');
    expect(Math.abs(resolved!.location.latitude - 31.384)).toBeLessThan(0.05);
    expect(Math.abs(resolved!.location.longitude - 120.954)).toBeLessThan(0.05);
    expect(resolved!.canonicalPath).toBe('/city/kunshan');
  });

  it('省级也能访问：/city/guangdong → 广东省', () => {
    const resolved = resolveCitySlug('guangdong');

    expect(resolved!.location.name).toBe('广东省');
    expect(resolved!.canonicalPath).toBe('/city/guangdong');
  });

  it('同音地名：adcode 最小的占裸 slug，其余带 adcode 后缀', () => {
    // 苏州市(320500) 与 宿州市(341300) 拼音都是 suzhou
    expect(canonicalSlugForAdcode(320500)).toBe('suzhou');
    expect(canonicalSlugForAdcode(341300)).toBe('suzhou-341300');
    expect(resolveCitySlug('suzhou')!.location.name).toBe('苏州市');
    expect(resolveCitySlug('suzhou-341300')!.location.name).toBe('宿州市');
  });

  it('纯 adcode 可访问，并指向规范 slug', () => {
    const resolved = resolveCitySlug('320583');

    expect(resolved!.location.name).toBe('昆山市');
    expect(resolved!.canonicalPath).toBe('/city/kunshan');
  });

  it('索引里不存在的 slug 返回 null', () => {
    expect(resolveCitySlug('not-a-real-city')).toBeNull();
    expect(resolveCitySlug('')).toBeNull();
    expect(resolveCitySlug('999999')).toBeNull();
  });
});

describe('cityPathForAdcode', () => {
  it('生成规范路径', () => {
    expect(cityPathForAdcode(320583)).toBe('/city/kunshan');
    expect(cityPathForAdcode(110000)).toBe('/city/beijing');
    expect(cityPathForAdcode(123456)).toBeNull();
  });
});

describe('slugForPlace', () => {
  it('用简称拼音，无空格', () => {
    const hangzhou = listChinaPlaces().find(place => place.name === '杭州市')!;

    expect(slugForPlace(hangzhou)).toMatch(/^[a-z0-9-]+$/);
    expect(slugForPlace(hangzhou)).toContain('hangzhou');
  });

  it('拼音里不会出现空格或大写', () => {
    const weird = listChinaPlaces().filter(place => /[\sA-Z]/.test(slugForPlace(place)));

    expect(weird.map(place => place.name)).toEqual([]);
  });
});
