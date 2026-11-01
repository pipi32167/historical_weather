/**
 * 中国行政区划离线索引测试
 *
 * 背景：Open-Meteo 的地理编码直接透传 GeoNames，对国内地名支持很差：
 * 搜「南京」会带回云南同名村庄，搜「昆山」根本搜不到昆山市（只有 8 个同名村庄）。
 * 因此国内省/市/区县改为本地索引命中，坐标来自阿里 DataV 行政区划数据（已转为 WGS-84）。
 */
import { searchChinaPlaces, listChinaPlaces, chinaDistrictsCount } from './chinaPlaceIndex';

const KUNSHAN = { lat: 31.384, lon: 120.9539 };

describe('searchChinaPlaces - 国内地名必须本地命中', () => {
  it('搜「南京」只返回江苏南京市', () => {
    const results = searchChinaPlaces('南京');

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('南京市');
    expect(results[0].level).toBe(2);
    expect(results[0].province).toBe('江苏省');
    // WGS-84：南京市约 32.06N / 118.78E
    expect(Math.abs(results[0].latitude - 32.06)).toBeLessThan(0.05);
    expect(Math.abs(results[0].longitude - 118.78)).toBeLessThan(0.05);
  });

  it('搜「昆山」能命中昆山市（上游只剩同名村庄的场景）', () => {
    const results = searchChinaPlaces('昆山');

    expect(results[0].name).toBe('昆山市');
    expect(results[0].level).toBe(3);
    expect(results[0].province).toBe('江苏省');
    expect(results[0].city).toBe('苏州市');
    expect(Math.abs(results[0].latitude - KUNSHAN.lat)).toBeLessThan(0.05);
    expect(Math.abs(results[0].longitude - KUNSHAN.lon)).toBeLessThan(0.05);
  });

  it('省级 + 直辖市：搜「上海」返回上海市（省级），不是同名小地方', () => {
    const results = searchChinaPlaces('上海');

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('上海市');
    expect(results[0].level).toBe(1);
  });

  it('支持简称：搜「浦东」命中浦东新区', () => {
    const results = searchChinaPlaces('浦东');

    expect(results[0].name).toBe('浦东新区');
    expect(results[0].province).toBe('上海市');
  });

  it('同名歧义按时行政级别排序：朝阳市（地级）排在朝阳区（区县）之前', () => {
    const results = searchChinaPlaces('朝阳');

    expect(results[0].name).toBe('朝阳市');
    expect(results[0].level).toBe(2);
    expect(results.map(r => r.name)).toContain('朝阳区');
    expect(results.find(r => r.name === '朝阳区')?.province).toBe('北京市');
  });

  it('不会返回「西安村」这类同名村庄（索引里只有行政区）', () => {
    const results = searchChinaPlaces('西安');

    expect(results[0].name).toBe('西安市');
    expect(results.every(r => !r.name.includes('村'))).toBe(true);
  });

  it('特别行政区可检索', () => {
    expect(searchChinaPlaces('香港')[0].name).toBe('香港特别行政区');
    expect(searchChinaPlaces('澳门')[0].name).toBe('澳门特别行政区');
  });

  it('全名与简称命中结果一致', () => {
    expect(searchChinaPlaces('南京市')[0].adcode).toBe(searchChinaPlaces('南京')[0].adcode);
  });

  it('忽略首尾空白', () => {
    expect(searchChinaPlaces('  南京  ')).toHaveLength(1);
  });

  it('索引里没有的词返回空数组（由调用方回退到远程 API）', () => {
    expect(searchChinaPlaces('三里屯')).toEqual([]);
    expect(searchChinaPlaces('宏村')).toEqual([]);
    expect(searchChinaPlaces('Tokyo')).toEqual([]);
    expect(searchChinaPlaces('台北')).toEqual([]); // DataV 台湾只到省级
  });

  it('空查询返回空数组', () => {
    expect(searchChinaPlaces('')).toEqual([]);
    expect(searchChinaPlaces('   ')).toEqual([]);
  });

  it('尊重 limit', () => {
    expect(searchChinaPlaces('朝阳', 1)).toHaveLength(1);
  });

  it('结果按 adcode 去重（同名不同地除外）', () => {
    const results = searchChinaPlaces('朝阳', 20);
    const codes = results.map(r => r.adcode);

    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('searchChinaPlaces - 拼音/英文查询', () => {
  it('全拼命中：kunshan → 昆山市', () => {
    expect(searchChinaPlaces('kunshan')[0].name).toBe('昆山市');
  });

  it('全拼命中：beijing / shanghai / nanjing', () => {
    expect(searchChinaPlaces('beijing')[0].name).toBe('北京市');
    expect(searchChinaPlaces('shanghai')[0].name).toBe('上海市');
    expect(searchChinaPlaces('nanjing')[0].name).toBe('南京市');
  });

  it('忽略大小写、空格、撇号：NanJing / nan jing / xi’an', () => {
    expect(searchChinaPlaces('NanJing')[0].name).toBe('南京市');
    expect(searchChinaPlaces('nan jing')[0].name).toBe('南京市');
    expect(searchChinaPlaces("xi'an")[0].name).toBe('西安市');
  });

  it('ü 写作 v：lvliang → 吕梁市', () => {
    expect(searchChinaPlaces('lvliang')[0].name).toBe('吕梁市');
  });

  it('拼音首字母：nj → 南京市，bj → 北京市', () => {
    expect(searchChinaPlaces('nj')[0].name).toBe('南京市');
    expect(searchChinaPlaces('bj')[0].name).toBe('北京市');
  });

  it('拼音前缀：nanj → 南京市', () => {
    expect(searchChinaPlaces('nanj')[0].name).toBe('南京市');
  });

  it('同音异地：suzhou 同时给苏州市与宿州市，地级市按 adcode 稳定排序', () => {
    const results = searchChinaPlaces('suzhou');
    const names = results.map(r => r.name);

    expect(names).toContain('苏州市');
    expect(names).toContain('宿州市');
    expect(names[0]).toBe('苏州市');
  });

  it('自治州/自治区支持常用简称拼音', () => {
    expect(searchChinaPlaces('yanbian')[0].name).toBe('延边朝鲜族自治州');
    expect(searchChinaPlaces('guangxi')[0].name).toBe('广西壮族自治区');
    expect(searchChinaPlaces('xinjiang')[0].name).toBe('新疆维吾尔自治区');
  });

  it('多音字地名不能拼错：闵行 minhang、六安 luan、蚌埠 bengbu', () => {
    expect(searchChinaPlaces('minhang')[0].name).toBe('闵行区');
    expect(searchChinaPlaces('luan')[0].name).toBe('六安市');
    expect(searchChinaPlaces('bengbu')[0].name).toBe('蚌埠市');
  });

  it('拼音索引里的地名不影响中文查询结果', () => {
    expect(searchChinaPlaces('南京')[0].name).toBe('南京市');
    expect(searchChinaPlaces('南京')).toHaveLength(1);
  });

  it('国外城市不误命中', () => {
    expect(searchChinaPlaces('Tokyo')).toEqual([]);
    expect(searchChinaPlaces('Paris')).toEqual([]);
  });
});

describe('chinaDistricts 数据完整性', () => {
  const all = listChinaPlaces();

  it('条目数量覆盖全国省/地级/区县', () => {
    expect(chinaDistrictsCount()).toBeGreaterThan(3000);
    expect(all).toHaveLength(chinaDistrictsCount());
  });

  it('省 / 地级 / 区县 三个层级都有数据', () => {
    const levels = all.reduce<Record<number, number>>((acc, place) => {
      acc[place.level] = (acc[place.level] || 0) + 1;
      return acc;
    }, {});

    expect(levels[1]).toBe(34);
    expect(levels[2]).toBeGreaterThan(300);
    expect(levels[3]).toBeGreaterThan(2500);
  });

  it('坐标都在中国境内（WGS-84）', () => {
    const outOfChina = all.filter(
      place =>
        place.latitude < 3 ||
        place.latitude > 54 ||
        place.longitude < 73 ||
        place.longitude > 136
    );

    expect(outOfChina.map(p => p.name)).toEqual([]);
  });

  it('每条都有拼音，且只包含字母与空格', () => {
    const broken = all.filter(
      place => !place.pinyin || !/^[a-z ]+$/.test(place.pinyin) || place.pinyin.trim() !== place.pinyin
    );

    expect(broken.map(p => p.name)).toEqual([]);
  });

  it('每条都有名称、adcode 与上级行政区', () => {
    const broken = all.filter(
      place =>
        !place.name ||
        !place.adcode ||
        !place.province ||
        !place.city ||
        Number.isNaN(place.latitude) ||
        Number.isNaN(place.longitude)
    );

    expect(broken.map(p => p.name)).toEqual([]);
  });
});
