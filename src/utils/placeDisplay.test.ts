/**
 * 地名展示 i18n 测试
 *
 * 现实问题（E2E 截图）：英文界面下搜「昆山」显示「昆山市 / 苏州市, 江苏省, 中国」，
 * 城市页标题是「昆山市 Historical Temperature Data」，中英混排。
 */
import { localizedPlaceName, localizedPlaceLabel, localizedCountry, isChineseLanguage } from './placeDisplay';

const ZH: Record<string, string> = {
  'cities.nanjing': '南京',
  'countries.china': '中国',
};
const EN: Record<string, string> = {
  'cities.nanjing': 'Nanjing',
  'countries.china': 'China',
};

/** 模拟 i18next：同一个 key 按当前语言返回不同文案 */
const tFor = (language: string) => (key: string) =>
  ((language.startsWith('zh') ? ZH : EN)[key] ?? key);

describe('localizedPlaceName', () => {
  it('索引城市：中文界面给中文名，英文界面给英文名', () => {
    const place = { name: '昆山市', nameEn: 'Kunshan' };

    expect(localizedPlaceName(place, tFor('zh-CN'), 'zh-CN')).toBe('昆山市');
    expect(localizedPlaceName(place, tFor('en-US'), 'en-US')).toBe('Kunshan');
  });

  it('手写城市：走 i18n 翻译（cities.<id>）', () => {
    const nanjing = { id: 'nanjing', name: 'Nanjing', nameEn: undefined };

    expect(localizedPlaceName(nanjing, tFor('zh-CN'), 'zh-CN')).toBe('南京');
    expect(localizedPlaceName(nanjing, tFor('en-US'), 'en-US')).toBe('Nanjing');
  });

  it('没有英文名时退回原名，不显示空白', () => {
    expect(localizedPlaceName({ name: '无名地' }, tFor('en'), 'en')).toBe('无名地');
  });
});

describe('localizedCountry', () => {
  it('China 在中英文界面分别显示中国 / China', () => {
    expect(localizedCountry('China', tFor('zh-CN'), 'zh-CN')).toBe('中国');
    expect(localizedCountry('China', tFor('en-US'), 'en-US')).toBe('China');
  });

  it('未收录的国家原样返回', () => {
    expect(localizedCountry('Iceland', tFor('zh-CN'), 'zh-CN')).toBe('Iceland');
    expect(localizedCountry(undefined, tFor('zh-CN'), 'zh-CN')).toBe('');
  });
});

describe('localizedPlaceLabel', () => {
  const kunshan = {
    name: '昆山市',
    nameEn: 'Kunshan',
    admin1: '江苏省',
    admin1En: 'Jiangsu',
    admin2: '苏州市',
    admin2En: 'Suzhou',
    country: 'China',
  };

  it('英文界面：全英文文案', () => {
    expect(localizedPlaceLabel(kunshan, tFor('en-US'), 'en-US')).toBe('Kunshan, Suzhou, Jiangsu, China');
  });

  it('中文界面：全中文文案', () => {
    expect(localizedPlaceLabel(kunshan, tFor('zh-CN'), 'zh-CN')).toBe('昆山市, 苏州市, 江苏省, 中国');
  });

  it('重复的行政名只出现一次', () => {
    const shanghai = {
      name: '上海市',
      nameEn: 'Shanghai',
      admin1: '上海市',
      admin1En: 'Shanghai',
      admin2: '上海市',
      admin2En: 'Shanghai',
      country: 'China',
    };

    expect(localizedPlaceLabel(shanghai, tFor('zh-CN'), 'zh-CN')).toBe('上海市, 中国');
    expect(localizedPlaceLabel(shanghai, tFor('en-US'), 'en-US')).toBe('Shanghai, China');
  });
});

describe('isChineseLanguage', () => {
  it('识别中英文语言码', () => {
    expect(isChineseLanguage('zh')).toBe(true);
    expect(isChineseLanguage('zh-CN')).toBe(true);
    expect(isChineseLanguage('en')).toBe(false);
    expect(isChineseLanguage('en-US')).toBe(false);
  });
});
