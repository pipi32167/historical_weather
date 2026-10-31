/**
 * 地名英文写法测试
 */
import { englishPlaceName, titleCasePinyin } from './placeNamesEn';
import { listChinaPlaces } from './chinaPlaceIndex';

describe('titleCasePinyin', () => {
  it('音节连写并首字母大写', () => {
    expect(titleCasePinyin('kun shan')).toBe('Kunshan');
    expect(titleCasePinyin('dong cheng')).toBe('Dongcheng');
    expect(titleCasePinyin('')).toBe('');
  });
});

describe('englishPlaceName', () => {
  it('普通地名走拼音', () => {
    expect(englishPlaceName('昆山市', 'kun shan')).toBe('Kunshan');
    expect(englishPlaceName('浦东新区', 'pu dong')).toBe('Pudong');
    expect(englishPlaceName('石家庄市', 'shi jia zhuang')).toBe('Shijiazhuang');
  });

  it('惯用译名优先', () => {
    expect(englishPlaceName('西安市', 'xi an')).toBe("Xi'an");
    expect(englishPlaceName('陕西省', 'shan xi')).toBe('Shaanxi');
    expect(englishPlaceName('山西省', 'shan xi')).toBe('Shanxi');
    expect(englishPlaceName('内蒙古自治区', 'nei meng gu')).toBe('Inner Mongolia');
    expect(englishPlaceName('乌鲁木齐市', 'wu lu mu qi')).toBe('Urumqi');
    expect(englishPlaceName('香港特别行政区', 'xiang gang')).toBe('Hong Kong');
    expect(englishPlaceName('广西壮族自治区', 'guang xi')).toBe('Guangxi');
  });

  it('自治州优先用简称拼音', () => {
    expect(englishPlaceName('延边朝鲜族自治州', 'yan bian chao xian zu', 'yan bian')).toBe('Yanbian');
    expect(englishPlaceName('巴音郭楞蒙古自治州', 'ba yin guo leng meng gu', 'ba yin guo leng')).toBe(
      'Bayinguoleng'
    );
  });
});

describe('行政区索引里的英文名', () => {
  const places = listChinaPlaces();
  const find = (name: string) => places.find(place => place.name === name)!;

  it('每个行政区都有英文名', () => {
    const missing = places.filter(place => !place.englishName || !/[A-Za-z]/.test(place.englishName));

    expect(missing.map(place => place.name)).toEqual([]);
  });

  it('省级 / 地级英文名可用于展示', () => {
    const kunshan = find('昆山市');

    expect(kunshan.englishName).toBe('Kunshan');
    expect(kunshan.provinceEn).toBe('Jiangsu');
    expect(kunshan.cityEn).toBe('Suzhou');
    expect(find('西安市').englishName).toBe("Xi'an");
  });

  it('同名不同地各自持有一份英文名（朝阳区/朝阳市/潮阳区）', () => {
    const chaoyang = places.filter(place => place.englishName === 'Chaoyang');

    // 朝阳市(辽宁)、朝阳区(北京/长春)、潮阳区(汕头) 拼音都是 chaoyang
    expect(chaoyang.length).toBeGreaterThanOrEqual(3);
    expect(chaoyang.some(place => place.name === '朝阳市')).toBe(true);
    expect(chaoyang.some(place => place.name === '潮阳区')).toBe(true);
  });
});
