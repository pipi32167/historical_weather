/**
 * 行政区名称工具（不依赖 170KB 的行政区数据，可安全被任意模块引用）
 */

/** 行政区后缀，按长度从长到短匹配，保证「浦东新区」→「浦东」而不是「浦东新」 */
export const ADMIN_SUFFIXES = [
  '特别行政区',
  '维吾尔自治区',
  '壮族自治区',
  '回族自治区',
  '自治区',
  '自治州',
  '自治县',
  '自治旗',
  '地区',
  '林区',
  '新区',
  '省',
  '市',
  '区',
  '县',
  '旗',
  '盟',
];

/** 去掉行政区后缀得到简称（「昆山市」→「昆山」），去不干净时退回原名 */
export function shortPlaceName(name: string): string {
  for (const suffix of ADMIN_SUFFIXES) {
    if (name.length > suffix.length && name.endsWith(suffix)) {
      return name.slice(0, -suffix.length);
    }
  }
  return name;
}
