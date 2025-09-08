# Open-Meteo API 响应格式详解

基于实际测试，以下是各个API端点的详细响应格式和数据处理说明。

## 1. 地理编码API响应格式

### 请求示例
```bash
curl "https://geocoding-api.open-meteo.com/v1/search?name=shanghai&count=2&language=zh,en&format=json"
```

### 响应格式
```json
{
  "results": [
    {
      "id": 1796236,
      "name": "Shanghai",
      "latitude": 31.22222,
      "longitude": 121.45806,
      "elevation": 12.0,
      "feature_code": "PPLA",
      "country_code": "CN",
      "admin1_id": 1796231,
      "admin2_id": 12324204,
      "timezone": "Asia/Shanghai",
      "population": 24874500,
      "country_id": 1814991,
      "country": "China",
      "admin1": "Shanghai",
      "admin2": "Shanghai Municipality"
    }
  ],
  "generationtime_ms": 1.1404753
}
```

### 数据字段说明
- `id`: 城市唯一标识符
- `name`: 城市名称
- `latitude/longitude`: 经纬度坐标
- `elevation`: 海拔高度（米）
- `feature_code`: 地理特征代码
- `country/country_code`: 国家信息
- `admin1/admin2`: 行政区划信息
- `timezone`: 时区
- `population`: 人口数量

## 2. 当前天气API响应格式

### 请求示例
```bash
curl "https://api.open-meteo.com/v1/forecast?latitude=31.2304&longitude=121.4737&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code&timezone=auto"
```

### 响应格式
```json
{
  "latitude": 31.25,
  "longitude": 121.5,
  "generationtime_ms": 0.0711679458618164,
  "utc_offset_seconds": 28800,
  "timezone": "Asia/Shanghai",
  "timezone_abbreviation": "GMT+8",
  "elevation": 5.0,
  "current_units": {
    "time": "iso8601",
    "interval": "seconds",
    "temperature_2m": "°C",
    "relative_humidity_2m": "%",
    "surface_pressure": "hPa",
    "wind_speed_10m": "km/h",
    "wind_direction_10m": "°",
    "weather_code": "wmo code"
  },
  "current": {
    "time": "2025-09-08T17:45",
    "interval": 900,
    "temperature_2m": 32.0,
    "relative_humidity_2m": 69,
    "surface_pressure": 1006.3,
    "wind_speed_10m": 5.9,
    "wind_direction_10m": 14,
    "weather_code": 3
  }
}
```

### 数据字段说明
- `current.time`: 数据时间戳（ISO 8601格式）
- `current.temperature_2m`: 2米高度温度（°C）
- `current.relative_humidity_2m`: 相对湿度（%）
- `current.surface_pressure`: 地面气压（hPa）
- `current.wind_speed_10m`: 10米高度风速（km/h）
- `current.wind_direction_10m`: 10米高度风向（度）
- `current.weather_code`: 天气代码（WMO标准）

## 3. 历史天气API响应格式

### 请求示例
```bash
curl "https://archive-api.open-meteo.com/v1/archive?latitude=31.2304&longitude=121.4737&start_date=2024-09-06&end_date=2024-09-08&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,weather_code&hourly=relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=auto"
```

### 响应格式
```json
{
  "latitude": 31.247803,
  "longitude": 121.5,
  "generationtime_ms": 0.31173229217529297,
  "utc_offset_seconds": 28800,
  "timezone": "Asia/Shanghai",
  "timezone_abbreviation": "GMT+8",
  "elevation": 5.0,
  "daily_units": {
    "time": "iso8601",
    "temperature_2m_max": "°C",
    "temperature_2m_min": "°C", 
    "temperature_2m_mean": "°C",
    "precipitation_sum": "mm",
    "weather_code": "wmo code"
  },
  "daily": {
    "time": ["2024-09-06", "2024-09-07", "2024-09-08"],
    "temperature_2m_max": [34.4, 34.8, 34.1],
    "temperature_2m_min": [25.4, 25.7, 26.1],
    "temperature_2m_mean": [29.7, 29.8, 29.6],
    "precipitation_sum": [0.0, 0.2, 0.1],
    "weather_code": [3, 51, 51]
  },
  "hourly_units": {
    "time": "iso8601",
    "relative_humidity_2m": "%",
    "surface_pressure": "hPa",
    "wind_speed_10m": "km/h",
    "wind_direction_10m": "°"
  },
  "hourly": {
    "time": ["2024-09-06T00:00", "2024-09-06T01:00", ...],
    "relative_humidity_2m": [78, 79, 80, ...],
    "surface_pressure": [1006.2, 1006.1, 1006.0, ...],
    "wind_speed_10m": [8.3, 7.9, 7.5, ...],
    "wind_direction_10m": [45, 48, 52, ...]
  }
}
```

### 数据结构说明

#### Daily 数据（每日汇总）
- `daily.time[]`: 日期数组
- `daily.temperature_2m_max[]`: 每日最高温度
- `daily.temperature_2m_min[]`: 每日最低温度  
- `daily.temperature_2m_mean[]`: 每日平均温度
- `daily.precipitation_sum[]`: 每日降水量总和
- `daily.weather_code[]`: 每日天气代码

#### Hourly 数据（每小时详细）
- `hourly.time[]`: 小时时间戳数组
- `hourly.relative_humidity_2m[]`: 每小时湿度
- `hourly.surface_pressure[]`: 每小时气压
- `hourly.wind_speed_10m[]`: 每小时风速
- `hourly.wind_direction_10m[]`: 每小时风向

## 4. 天气代码对照表

### WMO 天气代码映射

```javascript
const weatherCodeMap = {
  0: '晴朗',           // Clear sky
  1: '基本晴朗',       // Mainly clear
  2: '多云',           // Partly cloudy
  3: '阴天',           // Overcast
  45: '雾',            // Fog
  48: '霜雾',          // Depositing rime fog
  51: '小雨',          // Light drizzle
  53: '中雨',          // Moderate drizzle
  55: '大雨',          // Dense drizzle
  56: '冻雨',          // Light freezing drizzle
  57: '大冻雨',        // Dense freezing drizzle
  61: '小雨',          // Slight rain
  63: '中雨',          // Moderate rain
  65: '大雨',          // Heavy rain
  66: '冻雨',          // Light freezing rain
  67: '大冻雨',        // Heavy freezing rain
  71: '小雪',          // Slight snow fall
  73: '中雪',          // Moderate snow fall
  75: '大雪',          // Heavy snow fall
  77: '雪粒',          // Snow grains
  80: '阵雨',          // Slight rain showers
  81: '中阵雨',        // Moderate rain showers
  82: '大阵雨',        // Violent rain showers
  85: '阵雪',          // Slight snow showers
  86: '大阵雪',        // Heavy snow showers
  95: '雷暴',          // Thunderstorm
  96: '雷暴伴冰雹',    // Thunderstorm with slight hail
  99: '大雷暴伴冰雹'   // Thunderstorm with heavy hail
};
```

## 5. 数据处理策略

### 历史数据处理问题及解决方案

#### 问题1: 湿度数据不可用
**问题**: 历史天气API的`daily`参数不支持`relative_humidity_2m`
**解决方案**: 使用`hourly`参数获取每小时湿度，然后计算日平均值

```javascript
// 错误做法
daily: 'temperature_2m_max,temperature_2m_min,relative_humidity_2m' // ❌ 不支持

// 正确做法
daily: 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,weather_code',
hourly: 'relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m' // ✅ 正确
```

#### 问题2: 数据组合复杂性
**挑战**: 需要将每日数据和每小时数据结合
**解决方案**: 实现数据处理函数

```javascript
// 提取特定日期的小时数据
private getHourlyDataForDate(hourly, targetDate) {
  const hourlyData = [];
  hourly.time.forEach((time, index) => {
    if (time.startsWith(targetDate)) {
      hourlyData.push({
        humidity: hourly.relative_humidity_2m[index] || 50,
        pressure: hourly.surface_pressure[index] || 1013,
        windSpeed: hourly.wind_speed_10m[index] || 0,
        windDirection: hourly.wind_direction_10m[index] || 0,
      });
    }
  });
  return hourlyData;
}

// 计算平均值
private calculateAverage(values) {
  const validValues = values.filter(v => v != null && !isNaN(v));
  if (validValues.length === 0) return 0;
  return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
}

// 计算风向的圆形平均值
private calculateCircularAverage(directions) {
  if (directions.length === 0) return 0;
  let x = 0, y = 0;
  directions.forEach(dir => {
    const rad = (dir * Math.PI) / 180;
    x += Math.cos(rad);
    y += Math.sin(rad);
  });
  const avgRad = Math.atan2(y / directions.length, x / directions.length);
  let avgDeg = (avgRad * 180) / Math.PI;
  if (avgDeg < 0) avgDeg += 360;
  return avgDeg;
}
```

### TypeScript 接口定义

```typescript
interface OpenMeteoHistoricalResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    temperature_2m_mean: number[];
    precipitation_sum: number[];
    weather_code: number[];
  };
  hourly?: {
    time: string[];
    relative_humidity_2m: number[];
    surface_pressure: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
  };
}
```

## 6. API使用限制和最佳实践

### 请求限制
- **频率限制**: 每天10,000次请求
- **并发限制**: 建议不超过10个并发请求
- **数据范围**: 历史数据可追溯到1940年

### 缓存策略
- **地理编码结果**: 缓存24小时
- **当前天气**: 缓存10分钟
- **历史数据**: 缓存1小时（历史数据不会改变）

### 错误处理
- **网络错误**: 重试机制（指数退避）
- **API限制**: 队列管理
- **数据缺失**: 使用合理默认值
- **参数错误**: 参数验证和错误提示

### 性能优化
- **批量请求**: 将多年数据分批处理
- **并行处理**: 并行获取不同年份数据
- **数据压缩**: 只请求必要的参数
- **智能缓存**: 基于数据特性调整缓存策略

通过以上详细的API响应格式分析和数据处理策略，可以确保应用程序能够正确处理和显示真实的天气数据。