#!/usr/bin/env node
/**
 * 生成中国行政区划离线索引：src/data/chinaDistricts.json
 *
 * 数据源：
 * - 行政区划与坐标：阿里 DataV GeoJSON（https://geo.datav.aliyun.com/areas_v3/bound/{adcode}_full.json）
 * - 拼音：cn-divisions（人工维护，MIT）为主，pinyin-pro 给缺失条目兜底
 *
 * 用途：城市搜索时优先在本地命中「省 / 地级市 / 区县」，避免 Open-Meteo（GeoNames）
 * 对国内地名支持差的问题（例如搜「昆山」只返回 8 个同名村庄）。
 *
 * 注意：
 * 1. DataV 的 center 是 GCJ-02（火星坐标），Open-Meteo 需要 WGS-84，这里统一转换。
 *    转换算法与 src/utils/coords.ts 保持一致（那边有单测覆盖）。
 * 2. 直辖市的区县直接出现在省级文件里（level=district），必须单独处理，
 *    否则会漏掉全部直辖市辖区（搜「浦东」会变成 0 条）。
 * 3. 台湾省（710000）在 DataV 里没有下级数据，只有省级中心点。
 *
 * 运行：npm run data:china
 */
import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allDivisions } from 'cn-divisions';
import { pinyin as toPinyin } from 'pinyin-pro';

const BASE = 'https://geo.datav.aliyun.com/areas_v3/bound';
const CONCURRENCY = 8;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.resolve(__dirname, '../src/data/chinaDistricts.json');

/**
 * 用法：
 *   node scripts/build-china-districts.mjs                  # 从 DataV 在线拉取
 *   node scripts/build-china-districts.mjs --from-raw x.json # 用已保存的原始行重新生成
 *
 * DataV 会对高频请求限流（返回 403），被限时先等一下，或从别处拿到
 * 同样结构的原始行（[name, adcode, level, lng, lat, province, city]）后用 --from-raw。
 */
const args = process.argv.slice(2);
const fromRawArg = args.indexOf('--from-raw');
const FROM_RAW = fromRawArg >= 0 ? args[fromRawArg + 1] : null;

/** GCJ-02 → WGS-84（与 src/utils/coords.ts 相同的实现） */
const A = 6378245.0;
const EE = 0.00669342162296594323;

function transformLat(x, y) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin((y / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((y / 12.0) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLng(x, y) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin((x / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((x / 12.0) * Math.PI) + 300.0 * Math.sin((x / 30.0) * Math.PI)) * 2.0) / 3.0;
  return ret;
}

function wgs84ToGcj02(lng, lat) {
  const dLat0 = transformLat(lng - 105.0, lat - 35.0);
  const dLng0 = transformLng(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  const dLat = (dLat0 * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * Math.PI);
  const dLng = (dLng0 * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * Math.PI);
  return [lng + dLng, lat + dLat];
}

function gcj02ToWgs84(lng, lat) {
  // 迭代逼近，精度远高于常用的 2*gcj-wgs2gcj 粗解
  let x = lng;
  let y = lat;
  for (let i = 0; i < 6; i++) {
    const [gx, gy] = wgs84ToGcj02(x, y);
    x += lng - gx;
    y += lat - gy;
  }
  return [x, y];
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function mapWithConcurrency(items, limit, worker) {
  const results = [];
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function isAdcode(value) {
  return value !== undefined && value !== null && /^\d{6}$/.test(String(value));
}

/* ------------------------------------------------------------------ *
 * 拼音：人工数据主源 + 生成器兜底
 *
 * 主源 cn-divisions（人工维护、MIT、省/市/区县 3,636 条含拼音），
 * 与 geojson.cn 人工拼音交叉验证一致率 95%（其差异多是带后缀音节等格式问题）。
 * 兜底 pinyin-pro：只为 cn-divisions 缺失/对不齐的条目生成（如香港各区、米林县）。
 * 两者均为 devDependency，只在构建期使用，不进产物。
 * ------------------------------------------------------------------ */
const PINYIN_INDEX = new Map();
for (const division of allDivisions()) {
  if (division.level <= 2) PINYIN_INDEX.set(division.code, division);
}

/** 行政区后缀，与 src/utils/chinaPlaceIndex.ts 保持一致 */
const SUFFIXES = [
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

/** 去掉行政区后缀得到简称 */
function shortPlaceName(name) {
  for (const suffix of SUFFIXES) {
    if (name.length > suffix.length && name.endsWith(suffix)) return name.slice(0, -suffix.length);
  }
  return name;
}

/** 民族名称，用于给「自治州/自治县」生成常用简称（延边朝鲜族自治州 → 延边） */
const ETHNIC_TOKENS = [
  '族',
  '蒙古',
  '维吾尔',
  '哈萨克',
  '柯尔克孜',
  '朝鲜',
  '壮',
  '回',
  '藏',
  '苗',
  '彝',
  '侗',
  '瑶',
  '白',
  '傣',
  '傈僳',
  '哈尼',
  '拉祜',
  '纳西',
  '景颇',
  '布朗',
  '普米',
  '怒',
  '独龙',
  '阿昌',
  '德昂',
  '基诺',
  '水',
  '仡佬',
  '羌',
  '毛南',
  '仫佬',
  '土',
  '撒拉',
  '东乡',
  '保安',
  '裕固',
  '锡伯',
  '达斡尔',
  '鄂温克',
  '鄂伦春',
  '赫哲',
  '门巴',
  '珞巴',
  '满',
  '畲',
  '高山',
  '塔吉克',
  '塔塔尔',
  '乌孜别克',
  '俄罗斯',
  '京',
];

/** 逐字转拼音（ü 统一写成 v，便于用户用键盘输入） */
function syllablesOf(text) {
  return toPinyin(text, { toneType: 'none', type: 'array' })
    .map(syllable => syllable.toLowerCase().replace(/ü/g, 'v'))
    .filter(Boolean);
}

/** 我们索引里的 adcode（6 位）对应 cn-divisions 的短码：省 2 位 / 市 4 位 / 区县 6 位 */
function divisionCode(adcode, level) {
  const text = String(adcode);
  if (level === 1) return text.slice(0, 2);
  if (level === 2) return text.slice(0, 4);
  return text;
}

/** 简称拼音：优先用人工数据，对不齐时用 pinyin-pro 兜底 */
function shortNamePinyin(name, adcode, level) {
  const shortName = shortPlaceName(name);
  const shortLength = [...shortName].length;
  const division = PINYIN_INDEX.get(divisionCode(adcode, level));

  if (division) {
    const syllables = division.pinyin
      .split(' ')
      .filter(Boolean)
      .map(syllable => syllable.toLowerCase().replace(/ü/g, 'v'));
    const fullLength = [...division.fullName].length;

    // 人工数据有时给全称拼音（浦东新区 → pu dong xin qu），有时给简称拼音（南京市 → nan jing）
    if (syllables.length === shortLength) return { pinyin: syllables.join(' '), source: 'cn-divisions' };
    if (syllables.length === fullLength && fullLength > shortLength) {
      const trimmed = syllables.slice(0, syllables.length - (fullLength - shortLength));
      if (trimmed.length >= 1) return { pinyin: trimmed.join(' '), source: 'cn-divisions' };
    }
  }

  return { pinyin: syllablesOf(shortName).join(' '), source: 'pinyin-pro' };
}

/** 自治州/自治县/自治区的常用简称拼音（广西壮族自治区 → guang xi） */
function aliasPinyin(name) {
  if (!/自治/.test(name)) return null;

  let core = shortPlaceName(name);
  const original = core;

  for (;;) {
    const token = ETHNIC_TOKENS.find(
      candidate => core.endsWith(candidate) && [...core.slice(0, -candidate.length)].length >= 2
    );
    if (!token) break;
    core = core.slice(0, -token.length);
  }

  if (core === original) return null;
  return syllablesOf(core).join(' ');
}

function coordsOf(properties) {
  const center = properties.center || properties.centroid;
  if (!Array.isArray(center) || center.length < 2) return null;
  const [lng, lat] = center;
  if (typeof lng !== 'number' || typeof lat !== 'number') return null;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return [lng, lat];
}

async function fetchRows() {
  console.log('⬇️  拉取省级数据…');
  const root = await getJson(`${BASE}/100000_full.json`);
  const provinces = root.features
    .map(feature => feature.properties)
    .filter(props => isAdcode(props.adcode) && props.name && coordsOf(props));

  /** @type {Array<[string, number, 1|2|3, number, number, string, string]>} */
  const rows = [];
  /** @type {Array<{province: string, cityAdcode: number, cityName: string}>} */
  const cities = [];

  for (const province of provinces) {
    const center = coordsOf(province);
    rows.push([province.name, Number(province.adcode), 1, center[0], center[1], province.name, province.name]);

    if (!province.childrenNum) continue;

    let detail;
    try {
      detail = await getJson(`${BASE}/${province.adcode}_full.json`);
    } catch (error) {
      console.warn(`⚠️  跳过 ${province.name}: ${error.message}`);
      continue;
    }

    for (const feature of detail.features || []) {
      const props = feature.properties;
      const coords = coordsOf(props);
      if (!props.name || !isAdcode(props.adcode) || !coords) continue;

      if (props.level === 'city') {
        rows.push([props.name, Number(props.adcode), 2, coords[0], coords[1], province.name, props.name]);
        cities.push({ province: province.name, cityAdcode: Number(props.adcode), cityName: props.name });
      } else if (props.level === 'district') {
        // 直辖市：区县直接挂在省级下面
        rows.push([props.name, Number(props.adcode), 3, coords[0], coords[1], province.name, province.name]);
      }
    }
  }

  console.log(`⬇️  拉取区县数据（${cities.length} 个地级行政区）…`);
  const districtRows = await mapWithConcurrency(cities, CONCURRENCY, async city => {
    try {
      const detail = await getJson(`${BASE}/${city.cityAdcode}_full.json`);
      const out = [];
      for (const feature of detail.features || []) {
        const props = feature.properties;
        const coords = coordsOf(props);
        if (!props.name || !isAdcode(props.adcode) || !coords) continue;
        out.push([props.name, Number(props.adcode), 3, coords[0], coords[1], city.province, city.cityName]);
      }
      return out;
    } catch (error) {
      console.warn(`⚠️  跳过 ${city.cityName}: ${error.message}`);
      return [];
    }
  });

  for (const chunk of districtRows) rows.push(...chunk);
  return rows;
}

async function main() {
  const rows = FROM_RAW ? JSON.parse(await readFile(FROM_RAW, 'utf8')) : await fetchRows();
  console.log(`📦 原始行 ${rows.length} 条`);

  // 去重（同 adcode 只保留一条）并把 GCJ-02 转成 WGS-84
  const seen = new Set();
  const names = [];
  const nameIndex = new Map();
  const nameId = name => {
    if (!nameIndex.has(name)) {
      nameIndex.set(name, names.length);
      names.push(name);
    }
    return nameIndex.get(name);
  };

  const compact = [];
  const pinyinSources = { 'cn-divisions': 0, 'pinyin-pro': 0 };
  let aliasCount = 0;

  for (const [name, adcode, level, lng, lat, province, city] of rows) {
    if (seen.has(adcode)) continue;
    seen.add(adcode);
    const [wgsLng, wgsLat] = gcj02ToWgs84(lng, lat);
    const { pinyin, source } = shortNamePinyin(name, adcode, level);
    pinyinSources[source] += 1;
    const alias = aliasPinyin(name);
    if (alias) aliasCount += 1;

    compact.push([
      name,
      adcode,
      level,
      Number(wgsLat.toFixed(4)),
      Number(wgsLng.toFixed(4)),
      nameId(province),
      nameId(city),
      pinyin,
      ...(alias ? [alias] : []),
    ]);
  }

  compact.sort((a, b) => a[1] - b[1]);

  const payload = { v: 1, n: names, r: compact };
  const json = JSON.stringify(payload);
  await writeFile(OUT_FILE, json, 'utf8');

  const levelCount = compact.reduce((acc, row) => {
    acc[row[2]] = (acc[row[2]] || 0) + 1;
    return acc;
  }, {});

  console.log('✅ 已写入', path.relative(process.cwd(), OUT_FILE));
  console.log(`   省级 ${levelCount[1] || 0} / 地级 ${levelCount[2] || 0} / 区县 ${levelCount[3] || 0} = ${compact.length} 条`);
  console.log(
    `   拼音来源：cn-divisions ${pinyinSources['cn-divisions']} / pinyin-pro 兜底 ${pinyinSources['pinyin-pro']}；自治州简称 ${aliasCount} 条`
  );
  console.log(`   体积 ${(json.length / 1024).toFixed(1)} KB`);
}

main().catch(error => {
  console.error('❌ 生成失败:', error);
  process.exit(1);
});
