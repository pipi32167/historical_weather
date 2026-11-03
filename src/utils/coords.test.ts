/**
 * GCJ-02 / WGS-84 坐标转换测试
 *
 * 已知事实：国内 GCJ-02 与 WGS-84 的偏移量在 300～700 米之间，
 * 北京附近约为东向 +0.006°、北向 +0.0015°。
 */
import { gcj02ToWgs84, wgs84ToGcj02 } from './coords';

/** 两点近似距离（米），用于断言偏移量级 */
function distanceMeters(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1) * Math.cos(toRad((lat1 + lat2) / 2));
  return Math.sqrt(dLat * dLat + dLng * dLng) * R;
}

describe('gcj02ToWgs84 / wgs84ToGcj02', () => {
  it('北京：GCJ-02 → WGS-84 偏移在 300～800 米之间，且经度向西', () => {
    const gcj = [116.405285, 39.904989] as const; // DataV 北京市中心（GCJ-02）
    const [lng, lat] = gcj02ToWgs84(gcj[0], gcj[1]);
    const offset = distanceMeters(gcj[0], gcj[1], lng, lat);

    expect(offset).toBeGreaterThan(300);
    expect(offset).toBeLessThan(800);
    // GCJ-02 始终在 WGS-84 东侧（经度方向固定）
    expect(lng).toBeLessThan(gcj[0]);
    expect(lat).toBeCloseTo(gcj[1], 1);
  });

  it('全国各纬度偏移量都在合理范围（200～800 米，经度一律向西）', () => {
    // 实测值（来源：各省会 GCJ-02 中心点）：距 266～621 米
    const cases: Array<[string, number, number]> = [
      ['乌鲁木齐', 87.617733, 43.792818],
      ['哈尔滨', 126.642464, 45.756967],
      ['北京', 116.405285, 39.904989],
      ['上海', 121.472644, 31.231706],
      ['拉萨', 91.132212, 29.660361],
      ['广州', 113.280637, 23.125178],
      ['三亚', 109.508, 18.247],
    ];

    for (const [city, lng, lat] of cases) {
      const [wgsLng, wgsLat] = gcj02ToWgs84(lng, lat);
      const offset = distanceMeters(lng, lat, wgsLng, wgsLat);

      expect({ city, ok: offset > 200 && offset < 800 }).toEqual({ city, ok: true });
      expect(wgsLng).toBeLessThan(lng);
      expect(Math.abs(wgsLat - lat)).toBeLessThan(0.005);
    }
  });

  it('正反变换可逆（误差 < 5 米）', () => {
    const cases: Array<[number, number]> = [
      [116.405285, 39.904989],
      [121.472644, 31.231706],
      [113.280637, 23.125178],
      [87.617733, 43.792818],
    ];

    for (const [lng, lat] of cases) {
      const [wgsLng, wgsLat] = gcj02ToWgs84(lng, lat);
      const [backLng, backLat] = wgs84ToGcj02(wgsLng, wgsLat);
      expect(distanceMeters(lng, lat, backLng, backLat)).toBeLessThan(5);
    }
  });

  it('境外坐标不做偏移', () => {
    expect(gcj02ToWgs84(-74.006, 40.7128)).toEqual([-74.006, 40.7128]);
    expect(wgs84ToGcj02(139.6917, 35.6895)).toEqual([139.6917, 35.6895]);
  });
});
