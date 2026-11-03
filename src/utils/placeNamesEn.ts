/**
 * 中文地名 → 英文写法
 *
 * 离线行政区索引只有中文名与拼音，英文界面直接显示中文（「北京市, 中国」）
 * 会显得像 bug。这里把拼音按地名习惯转成英文写法：
 * - 默认：音节连写 + 首字母大写（kun shan → Kunshan）
 * - 特例：多音字/惯用译名（西安 Xi'an、陕西 Shaanxi、内蒙古 Inner Mongolia…）
 * - 自治州等长名优先用索引里的简称拼音（延边朝鲜族自治州 → Yanbian）
 */
import { shortPlaceName } from './chinaNameUtils';

/** 拼音规则无法覆盖的惯用译名（键为中文简称） */
const OVERRIDES: Record<string, string> = {
  西安: "Xi'an",
  陕西: 'Shaanxi',
  山西: 'Shanxi',
  内蒙古: 'Inner Mongolia',
  西藏: 'Tibet',
  乌鲁木齐: 'Urumqi',
  呼和浩特: 'Hohhot',
  拉萨: 'Lhasa',
  香港: 'Hong Kong',
  澳门: 'Macao',
  台湾: 'Taiwan',
  新疆: 'Xinjiang',
  广西: 'Guangxi',
  宁夏: 'Ningxia',
  哈尔滨: 'Harbin',
  齐齐哈尔: 'Qiqihar',
  西双版纳: 'Xishuangbanna',
  鄂尔多斯: 'Ordos',
  二连浩特: 'Erenhot',
  满洲里: 'Manzhouli',
};

/** 音节连写并首字母大写：kun shan → Kunshan */
export function titleCasePinyin(pinyin: string): string {
  const joined = (pinyin || '').replace(/\s+/g, '').toLowerCase();
  if (!joined) return '';
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

/**
 * 生成英文地名。
 *
 * @param name 中文全名（如「昆山市」「延边朝鲜族自治州」）
 * @param pinyin 简称拼音（带空格，如 "kun shan"）
 * @param alias 自治州/自治县的简称拼音（如 "yan bian"）
 */
export function englishPlaceName(name: string, pinyin: string, alias?: string): string {
  const short = shortPlaceName(name);
  const override = OVERRIDES[short] ?? OVERRIDES[name];
  if (override) return override;

  // 简称拼音更贴近口语名称（延边朝鲜族自治州 → yan bian）
  return titleCasePinyin(alias || pinyin);
}
