/**
 * 坐标系转换：GCJ-02（火星坐标，高德/腾讯）与 WGS-84（GPS / Open-Meteo）
 *
 * 为什么需要：国内地图服务（高德/腾讯/DataV 行政区划数据）用 GCJ-02，
 * 而 Open-Meteo 与 GPS 用 WGS-84，两者在国内相差 300～700 米。
 * 历史气温网格 1～11 km，这点偏差对气温无影响，但坐标必须统一，
 * 否则「定位点」标记位置会漂移。
 *
 * 说明：离线行政区划数据在生成阶段（scripts/build-china-districts.mjs）已转换，
 * 这里保留同一份实现供运行时使用（例如将来接入高德/腾讯搜索结果），并有单测覆盖。
 */

const A = 6378245.0; // 克拉索夫斯基椭球长半轴
const EE = 0.00669342162296594323; // 偏心率平方

function transformLat(x: number, y: number): number {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin((y / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((y / 12.0) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLng(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin((x / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((x / 12.0) * Math.PI) + 300.0 * Math.sin((x / 30.0) * Math.PI)) * 2.0) / 3.0;
  return ret;
}

/** 是否在中国境外（境外不做偏移） */
function outOfChina(lng: number, lat: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

/** GCJ-02 → WGS-84（迭代逼近，误差 < 2 米） */
export function gcj02ToWgs84(lng: number, lat: number): [number, number] {
  if (outOfChina(lng, lat)) return [lng, lat];

  let x = lng;
  let y = lat;
  for (let i = 0; i < 6; i++) {
    const [gx, gy] = wgs84ToGcj02(x, y);
    x += lng - gx;
    y += lat - gy;
  }
  return [x, y];
}

/** WGS-84 → GCJ-02 */
export function wgs84ToGcj02(lng: number, lat: number): [number, number] {
  if (outOfChina(lng, lat)) return [lng, lat];

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
