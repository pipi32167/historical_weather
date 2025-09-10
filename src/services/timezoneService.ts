/**
 * 时区检测服务
 * 提供基于地理位置和浏览器的时区检测功能
 */

export interface TimezoneInfo {
  timezone: string;
  offset: number;
  source: 'browser' | 'geo' | 'estimated' | 'default';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * 基于经纬度的时区估算映射
 * 这是一个简化的时区映射，实际应用中可能需要更精确的数据库
 */
const TIMEZONE_REGIONS = [
  // 亚洲
  { bounds: { latMin: 18, latMax: 54, lonMin: 73, lonMax: 135 }, timezone: 'Asia/Shanghai', name: '中国' },
  { bounds: { latMin: 35, latMax: 46, lonMin: 126, lonMax: 146 }, timezone: 'Asia/Tokyo', name: '日本' },
  { bounds: { latMin: 33, latMax: 43, lonMin: 124, lonMax: 132 }, timezone: 'Asia/Seoul', name: '韩国' },
  { bounds: { latMin: 8, latMax: 38, lonMin: 92, lonMax: 108 }, timezone: 'Asia/Bangkok', name: '东南亚' },
  { bounds: { latMin: 20, latMax: 37, lonMin: 68, lonMax: 97 }, timezone: 'Asia/Kolkata', name: '印度' },
  { bounds: { latMin: 25, latMax: 42, lonMin: 44, lonMax: 63 }, timezone: 'Asia/Dubai', name: '中东' },
  
  // 欧洲
  { bounds: { latMin: 35, latMax: 72, lonMin: -10, lonMax: 30 }, timezone: 'Europe/London', name: '西欧' },
  { bounds: { latMin: 35, latMax: 72, lonMin: 5, lonMax: 40 }, timezone: 'Europe/Berlin', name: '中欧' },
  { bounds: { latMin: 40, latMax: 75, lonMin: 20, lonMax: 170 }, timezone: 'Europe/Moscow', name: '东欧/俄罗斯' },
  
  // 北美
  { bounds: { latMin: 15, latMax: 72, lonMin: -170, lonMax: -50 }, timezone: 'America/New_York', name: '北美东部' },
  { bounds: { latMin: 15, latMax: 72, lonMin: -125, lonMax: -95 }, timezone: 'America/Chicago', name: '北美中部' },
  { bounds: { latMin: 15, latMax: 72, lonMin: -140, lonMax: -110 }, timezone: 'America/Denver', name: '北美山区' },
  { bounds: { latMin: 15, latMax: 72, lonMin: -170, lonMax: -115 }, timezone: 'America/Los_Angeles', name: '北美西部' },
  
  // 南美
  { bounds: { latMin: -55, latMax: 15, lonMin: -82, lonMax: -35 }, timezone: 'America/Sao_Paulo', name: '南美' },
  { bounds: { latMin: -55, latMax: -20, lonMin: -75, lonMax: -53 }, timezone: 'America/Argentina/Buenos_Aires', name: '阿根廷' },
  
  // 大洋洲
  { bounds: { latMin: -45, latMax: -10, lonMin: 110, lonMax: 180 }, timezone: 'Australia/Sydney', name: '澳大利亚东部' },
  { bounds: { latMin: -45, latMax: -10, lonMin: 110, lonMax: 140 }, timezone: 'Australia/Perth', name: '澳大利亚西部' },
  { bounds: { latMin: -50, latMax: -30, lonMin: 165, lonMax: 180 }, timezone: 'Pacific/Auckland', name: '新西兰' },
  
  // 非洲
  { bounds: { latMin: -35, latMax: 40, lonMin: -20, lonMax: 55 }, timezone: 'Africa/Cairo', name: '非洲' }
];

export class TimezoneService {
  /**
   * 获取浏览器检测的时区
   */
  private getBrowserTimezone(): TimezoneInfo | null {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = new Date();
      const offset = -now.getTimezoneOffset() / 60;
      
      return {
        timezone,
        offset,
        source: 'browser',
        confidence: 'high'
      };
    } catch (error) {
      console.warn('浏览器时区检测失败:', error);
      return null;
    }
  }

  /**
   * 基于地理位置估算时区
   */
  private getTimezoneFromCoordinates(latitude: number, longitude: number): TimezoneInfo {
    // 查找匹配的时区区域
    for (const region of TIMEZONE_REGIONS) {
      const { bounds } = region;
      if (
        latitude >= bounds.latMin &&
        latitude <= bounds.latMax &&
        longitude >= bounds.lonMin &&
        longitude <= bounds.lonMax
      ) {
        return {
          timezone: region.timezone,
          offset: this.calculateTimezoneOffset(longitude),
          source: 'geo',
          confidence: 'medium'
        };
      }
    }

    // 如果没有找到匹配的区域，使用经度估算
    const estimatedTimezone = this.estimateTimezoneByLongitude(longitude);
    return {
      timezone: estimatedTimezone,
      offset: this.calculateTimezoneOffset(longitude),
      source: 'estimated',
      confidence: 'low'
    };
  }

  /**
   * 根据经度估算时区偏移
   */
  private calculateTimezoneOffset(longitude: number): number {
    // 每15度经度约等于1小时时差
    return Math.round(longitude / 15);
  }

  /**
   * 基于经度的简单时区估算
   */
  private estimateTimezoneByLongitude(longitude: number): string {
    const offset = this.calculateTimezoneOffset(longitude);
    
    const timezoneMap: Record<number, string> = {
      '-12': 'Pacific/Baker_Island',
      '-11': 'Pacific/Midway',
      '-10': 'Pacific/Honolulu',
      '-9': 'America/Anchorage',
      '-8': 'America/Los_Angeles',
      '-7': 'America/Denver',
      '-6': 'America/Chicago',
      '-5': 'America/New_York',
      '-4': 'America/Halifax',
      '-3': 'America/Argentina/Buenos_Aires',
      '-2': 'Atlantic/South_Georgia',
      '-1': 'Atlantic/Azores',
      '0': 'Europe/London',
      '1': 'Europe/Paris',
      '2': 'Europe/Berlin',
      '3': 'Europe/Moscow',
      '4': 'Asia/Dubai',
      '5': 'Asia/Karachi',
      '6': 'Asia/Dhaka',
      '7': 'Asia/Bangkok',
      '8': 'Asia/Shanghai',
      '9': 'Asia/Tokyo',
      '10': 'Australia/Sydney',
      '11': 'Pacific/Norfolk',
      '12': 'Pacific/Auckland'
    };

    return timezoneMap[offset] || 'UTC';
  }

  /**
   * 获取最佳时区信息
   * @param latitude 纬度（可选）
   * @param longitude 经度（可选）
   * @returns 时区信息
   */
  public getBestTimezone(latitude?: number, longitude?: number): TimezoneInfo {
    // 1. 优先使用浏览器检测的时区
    const browserTimezone = this.getBrowserTimezone();
    if (browserTimezone) {
      return browserTimezone;
    }

    // 2. 如果提供了坐标，使用地理位置估算
    if (latitude !== undefined && longitude !== undefined) {
      return this.getTimezoneFromCoordinates(latitude, longitude);
    }

    // 3. 默认返回UTC
    return {
      timezone: 'UTC',
      offset: 0,
      source: 'default',
      confidence: 'low'
    };
  }

  /**
   * 验证时区字符串是否有效
   */
  public isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取时区的当前时间
   */
  public getCurrentTimeInTimezone(timezone: string): Date {
    try {
      // 获取当前UTC时间戳
      const now = new Date();
      
      // 使用Intl.DateTimeFormat获取时区偏移
      const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      
      // 计算时差并调整时间
      const offset = tzDate.getTime() - utcDate.getTime();
      return new Date(now.getTime() + offset);
    } catch (error) {
      console.warn(`获取时区 ${timezone} 的当前时间失败:`, error);
      return new Date();
    }
  }

  /**
   * 格式化时区显示名称
   */
  public formatTimezoneDisplay(timezoneInfo: TimezoneInfo): string {
    const offsetSign = timezoneInfo.offset >= 0 ? '+' : '';
    const confidenceIcon = {
      high: '🟢',
      medium: '🟡', 
      low: '🔴'
    }[timezoneInfo.confidence];
    
    return `${timezoneInfo.timezone} (UTC${offsetSign}${timezoneInfo.offset}) ${confidenceIcon}`;
  }
}

// 导出单例实例
export const timezoneService = new TimezoneService();