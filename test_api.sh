#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}   Open-Meteo API 连接测试${NC}"
echo -e "${BLUE}==========================================${NC}"
echo

# 1. 测试地理编码API - 搜索上海
echo -e "${YELLOW}1. 测试地理编码API (搜索上海)...${NC}"
RESPONSE=$(curl -s "https://geocoding-api.open-meteo.com/v1/search?name=shanghai&count=1&language=zh,en&format=json")
if echo "$RESPONSE" | grep -q '"name"'; then
    CITY_NAME=$(echo "$RESPONSE" | sed 's/.*"name":"\([^"]*\)".*/\1/')
    LATITUDE=$(echo "$RESPONSE" | sed 's/.*"latitude":\([^,]*\).*/\1/')
    LONGITUDE=$(echo "$RESPONSE" | sed 's/.*"longitude":\([^,]*\).*/\1/')
    echo -e "${GREEN}✓ 地理编码API正常${NC}"
    echo -e "   找到城市: ${CITY_NAME} (${LATITUDE}, ${LONGITUDE})"
else
    echo -e "${RED}✗ 地理编码API异常${NC}"
fi
echo

# 2. 测试当前天气API - 上海
echo -e "${YELLOW}2. 测试当前天气API (上海)...${NC}"
RESPONSE=$(curl -s "https://api.open-meteo.com/v1/forecast?latitude=31.2304&longitude=121.4737&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto")
if echo "$RESPONSE" | grep -q '"temperature_2m"'; then
    TEMP=$(echo "$RESPONSE" | sed 's/.*"temperature_2m":\([^,]*\).*/\1/')
    HUMIDITY=$(echo "$RESPONSE" | sed 's/.*"relative_humidity_2m":\([^,]*\).*/\1/')
    WEATHER_CODE=$(echo "$RESPONSE" | sed 's/.*"weather_code":\([^}]*\).*/\1/')
    echo -e "${GREEN}✓ 当前天气API正常${NC}"
    echo -e "   上海当前: ${TEMP}°C, 湿度 ${HUMIDITY}%, 天气代码 ${WEATHER_CODE}"
else
    echo -e "${RED}✗ 当前天气API异常${NC}"
fi
echo

# 3. 测试当前天气API - 北京
echo -e "${YELLOW}3. 测试当前天气API (北京)...${NC}"
RESPONSE=$(curl -s "https://api.open-meteo.com/v1/forecast?latitude=39.9075&longitude=116.39723&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto")
if echo "$RESPONSE" | grep -q '"temperature_2m"'; then
    TEMP=$(echo "$RESPONSE" | sed 's/.*"temperature_2m":\([^,]*\).*/\1/')
    HUMIDITY=$(echo "$RESPONSE" | sed 's/.*"relative_humidity_2m":\([^,]*\).*/\1/')
    WEATHER_CODE=$(echo "$RESPONSE" | sed 's/.*"weather_code":\([^}]*\).*/\1/')
    echo -e "${GREEN}✓ 当前天气API正常${NC}"
    echo -e "   北京当前: ${TEMP}°C, 湿度 ${HUMIDITY}%, 天气代码 ${WEATHER_CODE}"
else
    echo -e "${RED}✗ 当前天气API异常${NC}"
fi
echo

# 4. 测试历史天气API - 获取昨天的数据
echo -e "${YELLOW}4. 测试历史天气API (上海昨天)...${NC}"
YESTERDAY=$(date -d '1 day ago' '+%Y-%m-%d' 2>/dev/null || date -j -v-1d '+%Y-%m-%d')
RESPONSE=$(curl -s "https://archive-api.open-meteo.com/v1/archive?latitude=31.2304&longitude=121.4737&start_date=${YESTERDAY}&end_date=${YESTERDAY}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum&timezone=auto")
if echo "$RESPONSE" | grep -q '"temperature_2m_mean"'; then
    TEMP_MAX=$(echo "$RESPONSE" | sed 's/.*"temperature_2m_max":\[\([^]]*\)\].*/\1/')
    TEMP_MIN=$(echo "$RESPONSE" | sed 's/.*"temperature_2m_min":\[\([^]]*\)\].*/\1/')
    TEMP_MEAN=$(echo "$RESPONSE" | sed 's/.*"temperature_2m_mean":\[\([^]]*\)\].*/\1/')
    echo -e "${GREEN}✓ 历史天气API正常${NC}"
    echo -e "   ${YESTERDAY} 上海: 最高${TEMP_MAX}°C, 最低${TEMP_MIN}°C, 平均${TEMP_MEAN}°C"
else
    echo -e "${RED}✗ 历史天气API异常${NC}"
    echo "   响应: $RESPONSE"
fi
echo

# 5. 测试API响应时间
echo -e "${YELLOW}5. 测试API响应时间...${NC}"
echo -n "   地理编码API: "
TIME=$(curl -w "%{time_total}" -o /dev/null -s "https://geocoding-api.open-meteo.com/v1/search?name=test&count=1")
echo -e "${GREEN}${TIME}s${NC}"

echo -n "   当前天气API: "
TIME=$(curl -w "%{time_total}" -o /dev/null -s "https://api.open-meteo.com/v1/forecast?latitude=31.2304&longitude=121.4737&current=temperature_2m")
echo -e "${GREEN}${TIME}s${NC}"

echo -n "   历史天气API: "
TIME=$(curl -w "%{time_total}" -o /dev/null -s "https://archive-api.open-meteo.com/v1/archive?latitude=31.2304&longitude=121.4737&start_date=${YESTERDAY}&end_date=${YESTERDAY}&daily=temperature_2m_mean")
echo -e "${GREEN}${TIME}s${NC}"

echo
echo -e "${BLUE}==========================================${NC}"
echo -e "${GREEN}✓ API连接测试完成！${NC}"
echo -e "${BLUE}==========================================${NC}"

# 天气代码说明
echo
echo -e "${YELLOW}天气代码含义:${NC}"
echo "0 = 晴朗, 1 = 基本晴朗, 2 = 多云, 3 = 阴天"
echo "45 = 雾, 51 = 小雨, 53 = 中雨, 61 = 小雨, 63 = 中雨"