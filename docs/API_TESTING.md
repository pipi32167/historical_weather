# Open-Meteo API 测试指南

本文档提供了用于测试 Open-Meteo API 的 curl 命令示例，这些 API 正是我们应用中使用的真实接口。

## 1. 地理编码API - 搜索城市

### 搜索上海

```bash
curl "https://geocoding-api.open-meteo.com/v1/search?name=shanghai&count=10&language=zh,en&format=json" | jq
```

### 搜索北京

```bash
curl "https://geocoding-api.open-meteo.com/v1/search?name=beijing&count=10&language=zh,en&format=json" | jq
```

### 搜索纽约

```bash
curl "https://geocoding-api.open-meteo.com/v1/search?name=new%20york&count=10&language=en&format=json" | jq
```

**响应示例:**
```json
{
  "results": [
    {
      "id": 1796236,
      "name": "Shanghai",
      "latitude": 31.22222,
      "longitude": 121.45806,
      "elevation": 12.0,
      "feature_code": "PPLC",
      "country_code": "CN",
      "admin1_id": 1796231,
      "admin2_id": 1796236,
      "timezone": "Asia/Shanghai",
      "population": 22315474,
      "country_id": 1814991,
      "country": "China",
      "admin1": "Shanghai",
      "admin2": "Shanghai"
    }
  ],
  "generationtime_ms": 0.234008789
}
```

## 2. 当前天气API

### 获取上海当前天气

```bash
curl "https://api.open-meteo.com/v1/forecast?latitude=31.2304&longitude=121.4737&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code&timezone=auto" | jq
```

### 获取北京当前天气

```bash
curl "https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code&timezone=Asia/Shanghai" | jq
```

**响应示例:**
```json
{
  "latitude": 31.25,
  "longitude": 121.5,
  "generationtime_ms": 0.03302097320556641,
  "utc_offset_seconds": 28800,
  "timezone": "Asia/Shanghai",
  "timezone_abbreviation": "CST",
  "elevation": 12.0,
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
    "time": "2024-09-08T13:00",
    "interval": 900,
    "temperature_2m": 25.8,
    "relative_humidity_2m": 78,
    "surface_pressure": 1013.2,
    "wind_speed_10m": 12.5,
    "wind_direction_10m": 180,
    "weather_code": 3
  }
}
```

## 3. 历史天气API

### 获取上海2023年数据（一年历史数据）

```bash
curl "https://archive-api.open-meteo.com/v1/archive?latitude=31.2304&longitude=121.4737&start_date=2023-01-01&end_date=2023-12-31&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m,surface_pressure,wind_speed_10m_max,wind_direction_10m_dominant,precipitation_sum,weather_code&timezone=auto" | jq '.daily | {time: .time[0:5], temp_max: .temperature_2m_max[0:5], temp_min: .temperature_2m_min[0:5]}'
```

### 获取北京最近30天历史数据

```bash
# 计算30天前的日期
START_DATE=$(date -d '30 days ago' '+%Y-%m-%d')
END_DATE=$(date '+%Y-%m-%d')

curl "https://archive-api.open-meteo.com/v1/archive?latitude=39.9042&longitude=116.4074&start_date=${START_DATE}&end_date=${END_DATE}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m,surface_pressure,wind_speed_10m_max,wind_direction_10m_dominant,precipitation_sum,weather_code&timezone=Asia/Shanghai" | jq
```

### 获取上海2024年9月8日的历史数据

```bash
curl "https://archive-api.open-meteo.com/v1/archive?latitude=31.2304&longitude=121.4737&start_date=2024-09-08&end_date=2024-09-08&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m,surface_pressure,wind_speed_10m_max,wind_direction_10m_dominant,precipitation_sum,weather_code&timezone=auto" | jq
```

**响应示例:**
```json
{
  "latitude": 31.25,
  "longitude": 121.5,
  "generationtime_ms": 1.3909339904785156,
  "utc_offset_seconds": 28800,
  "timezone": "Asia/Shanghai",
  "timezone_abbreviation": "CST",
  "elevation": 12.0,
  "daily_units": {
    "time": "iso8601",
    "temperature_2m_max": "°C",
    "temperature_2m_min": "°C",
    "temperature_2m_mean": "°C",
    "relative_humidity_2m": "%",
    "surface_pressure": "hPa",
    "wind_speed_10m_max": "km/h",
    "wind_direction_10m_dominant": "°",
    "precipitation_sum": "mm",
    "weather_code": "wmo code"
  },
  "daily": {
    "time": ["2024-09-08"],
    "temperature_2m_max": [28.5],
    "temperature_2m_min": [22.1],
    "temperature_2m_mean": [25.3],
    "relative_humidity_2m": [75],
    "surface_pressure": [1015.8],
    "wind_speed_10m_max": [15.2],
    "wind_direction_10m_dominant": [180],
    "precipitation_sum": [2.5],
    "weather_code": [61]
  }
}
```

## 4. 批量测试脚本

### 测试多个城市的当前天气

```bash
#!/bin/bash

# 定义城市列表
declare -A cities=(
  ["shanghai"]="31.2304,121.4737"
  ["beijing"]="39.9042,116.4074"
  ["shenzhen"]="22.3193,114.1694"
  ["newyork"]="40.7128,-74.0060"
  ["london"]="51.5074,-0.1278"
)

echo "=== 当前天气数据测试 ==="
for city in "${!cities[@]}"; do
  echo "测试城市: $city"
  IFS=',' read -r lat lon <<< "${cities[$city]}"
  
  curl -s "https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto" | \
  jq -r "\"城市: $city, 温度: \" + (.current.temperature_2m | tostring) + \"°C, 湿度: \" + (.current.relative_humidity_2m | tostring) + \"%, 天气代码: \" + (.current.weather_code | tostring)"
  
  echo "---"
done
```

### 测试历史同期数据（过去5年的今天）

```bash
#!/bin/bash

# 上海坐标
LATITUDE="31.2304"
LONGITUDE="121.4737"

# 当前日期
CURRENT_YEAR=$(date '+%Y')
CURRENT_MONTH=$(date '+%m')
CURRENT_DAY=$(date '+%d')

echo "=== 上海历史同期数据测试（过去5年的今天）==="

for i in {0..4}; do
  YEAR=$((CURRENT_YEAR - i))
  DATE="${YEAR}-${CURRENT_MONTH}-${CURRENT_DAY}"
  
  echo "获取 ${DATE} 的数据..."
  
  curl -s "https://archive-api.open-meteo.com/v1/archive?latitude=${LATITUDE}&longitude=${LONGITUDE}&start_date=${DATE}&end_date=${DATE}&daily=temperature_2m_mean,relative_humidity_2m,precipitation_sum&timezone=auto" | \
  jq -r "if .daily.time[0] then \"日期: \" + .daily.time[0] + \", 平均温度: \" + (.daily.temperature_2m_mean[0] | tostring) + \"°C, 湿度: \" + (.daily.relative_humidity_2m[0] | tostring) + \"%, 降水: \" + (.daily.precipitation_sum[0] | tostring) + \"mm\" else \"数据不可用\" end"
done
```

### 测试API响应时间

```bash
#!/bin/bash

echo "=== API 响应时间测试 ==="

# 测试地理编码API
echo "1. 地理编码API响应时间："
time curl -s "https://geocoding-api.open-meteo.com/v1/search?name=shanghai&count=5" > /dev/null

# 测试当前天气API
echo "2. 当前天气API响应时间："
time curl -s "https://api.open-meteo.com/v1/forecast?latitude=31.2304&longitude=121.4737&current=temperature_2m" > /dev/null

# 测试历史数据API
echo "3. 历史数据API响应时间："
time curl -s "https://archive-api.open-meteo.com/v1/archive?latitude=31.2304&longitude=121.4737&start_date=2023-01-01&end_date=2023-01-31&daily=temperature_2m_mean" > /dev/null
```

## 5. 错误处理测试

### 测试无效坐标

```bash
# 无效纬度
curl "https://api.open-meteo.com/v1/forecast?latitude=999&longitude=121.4737&current=temperature_2m" | jq

# 无效经度
curl "https://api.open-meteo.com/v1/forecast?latitude=31.2304&longitude=999&current=temperature_2m" | jq
```

### 测试无效日期范围

```bash
# 未来日期（历史API不支持）
curl "https://archive-api.open-meteo.com/v1/archive?latitude=31.2304&longitude=121.4737&start_date=2025-01-01&end_date=2025-01-31&daily=temperature_2m_mean" | jq
```

### 测试API限制

```bash
# 测试并发请求
for i in {1..10}; do
  curl -s "https://api.open-meteo.com/v1/forecast?latitude=31.2304&longitude=121.4737&current=temperature_2m" > /dev/null &
done
wait
echo "并发请求测试完成"
```

## 6. 实用脚本

### 保存为Shell脚本

创建 `test_api.sh` 文件：

```bash
#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查jq是否安装
if ! command -v jq &> /dev/null; then
    echo -e "${RED}错误: 需要安装 jq 来解析JSON响应${NC}"
    echo "安装方法: brew install jq (macOS) 或 sudo apt install jq (Ubuntu)"
    exit 1
fi

# 测试函数
test_geocoding() {
    echo -e "${YELLOW}测试地理编码API...${NC}"
    RESPONSE=$(curl -s "https://geocoding-api.open-meteo.com/v1/search?name=shanghai&count=1&format=json")
    
    if echo "$RESPONSE" | jq -e '.results[0].name' > /dev/null 2>&1; then
        CITY_NAME=$(echo "$RESPONSE" | jq -r '.results[0].name')
        echo -e "${GREEN}✓ 地理编码API正常 - 找到城市: $CITY_NAME${NC}"
        return 0
    else
        echo -e "${RED}✗ 地理编码API异常${NC}"
        return 1
    fi
}

test_current_weather() {
    echo -e "${YELLOW}测试当前天气API...${NC}"
    RESPONSE=$(curl -s "https://api.open-meteo.com/v1/forecast?latitude=31.2304&longitude=121.4737&current=temperature_2m&timezone=auto")
    
    if echo "$RESPONSE" | jq -e '.current.temperature_2m' > /dev/null 2>&1; then
        TEMP=$(echo "$RESPONSE" | jq -r '.current.temperature_2m')
        echo -e "${GREEN}✓ 当前天气API正常 - 上海温度: ${TEMP}°C${NC}"
        return 0
    else
        echo -e "${RED}✗ 当前天气API异常${NC}"
        return 1
    fi
}

test_historical_weather() {
    echo -e "${YELLOW}测试历史天气API...${NC}"
    YESTERDAY=$(date -d '1 day ago' '+%Y-%m-%d')
    RESPONSE=$(curl -s "https://archive-api.open-meteo.com/v1/archive?latitude=31.2304&longitude=121.4737&start_date=${YESTERDAY}&end_date=${YESTERDAY}&daily=temperature_2m_mean&timezone=auto")
    
    if echo "$RESPONSE" | jq -e '.daily.temperature_2m_mean[0]' > /dev/null 2>&1; then
        TEMP=$(echo "$RESPONSE" | jq -r '.daily.temperature_2m_mean[0]')
        echo -e "${GREEN}✓ 历史天气API正常 - ${YESTERDAY} 平均温度: ${TEMP}°C${NC}"
        return 0
    else
        echo -e "${RED}✗ 历史天气API异常${NC}"
        return 1
    fi
}

# 主程序
echo -e "${YELLOW}开始API连接测试...${NC}"
echo "================================"

FAILED=0

test_geocoding || FAILED=$((FAILED + 1))
test_current_weather || FAILED=$((FAILED + 1))
test_historical_weather || FAILED=$((FAILED + 1))

echo "================================"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ 所有API测试通过！${NC}"
    exit 0
else
    echo -e "${RED}✗ ${FAILED} 个API测试失败${NC}"
    exit 1
fi
```

### 使用方法

```bash
# 赋予执行权限
chmod +x test_api.sh

# 运行测试
./test_api.sh
```

## 7. 常用参数说明

### 地理编码API参数
- `name`: 搜索的城市名称
- `count`: 返回结果数量 (默认10)
- `language`: 语言设置 (zh,en)
- `format`: 响应格式 (json)

### 天气API参数
- `latitude`: 纬度 (-90 到 90)
- `longitude`: 经度 (-180 到 180)
- `current`: 当前天气参数列表
- `daily`: 每日天气参数列表
- `timezone`: 时区设置 (auto 或具体时区)

### 历史数据API参数
- `start_date`: 开始日期 (YYYY-MM-DD)
- `end_date`: 结束日期 (YYYY-MM-DD)
- `daily`: 每日数据参数

### 天气参数列表
- `temperature_2m`: 2米高度温度
- `relative_humidity_2m`: 相对湿度
- `surface_pressure`: 地面气压
- `wind_speed_10m`: 10米高度风速
- `wind_direction_10m`: 10米高度风向
- `precipitation_sum`: 降水量
- `weather_code`: 天气代码

这些curl命令可以帮助你测试API的可用性和响应格式，确保我们的应用能够正常获取天气数据。