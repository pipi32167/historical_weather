# 月平均温度API调研报告

## 概述

本文档调研了主要天气API服务提供商是否支持按月查询月平均温度的功能，为项目未来可能的月度气温数据分析功能提供技术参考。

## 调研结果

### 1. Open-Meteo API ⭐️⭐️⭐️⭐️⭐️

**优势：**
- ✅ **完全免费** - 无需API密钥，无注册要求
- ✅ **历史数据丰富** - 提供超过80年的历史气温数据（从1940年开始）
- ✅ **高精度** - 10公里分辨率，基于再分析数据集
- ✅ **月度聚合支持** - 可通过每日数据聚合计算月平均温度
- ✅ **多种变量** - 支持最高温、最低温、平均温等多种温度指标

**技术细节：**
- **数据源：** ERA5和ERA5-Land再分析数据
- **API端点：** `https://archive-api.open-meteo.com/v1/archive`
- **历史覆盖：** 1940年至今（延迟2天）
- **数据更新：** 基于历史再分析，数据稳定
- **聚合方式：** 从小时数据聚合到每日，可进一步聚合为月度

**实现方案：**
```javascript
// 示例：获取2023年1月北京的每日数据，然后聚合为月平均
const monthlyData = await openMeteoService.getHistoricalWeather(
  39.9042, 116.4074,
  '2023-01-01', '2023-01-31',
  'Asia/Shanghai',
  ['temperature_2m_max', 'temperature_2m_min', 'temperature_2m_mean']
);
```

---

### 2. OpenWeatherMap Statistical Weather Data API ⭐️⭐️⭐️⭐️

**优势：**
- ✅ **专门的月度统计API** - 直接提供月度统计数据
- ✅ **丰富的统计指标** - 包括平均值、中位数、百分位数等
- ✅ **长期历史数据** - 从1979年1月开始的46+年数据
- ✅ **全球覆盖** - 支持任意地理坐标

**技术细节：**
- **API端点：** `history.openweathermap.org/data/2.5/aggregated/month`
- **历史覆盖：** 1979年1月至今
- **数据更新：** 每小时更新
- **订阅要求：** 需要Expert订阅计划
- **响应格式：** 仅支持JSON格式

**统计数据包括：**
- 记录最高/最低温度
- 平均最高/最低温度
- 中位数和平均值
- 四分位数(p25, p75)
- 标准差
- 数据点数量

**实现方案：**
```javascript
// 示例API调用
const monthlyStats = await fetch(
  `https://history.openweathermap.org/data/2.5/aggregated/month?lat=39.9042&lon=116.4074&month=1&appid=${API_KEY}`
);
```

---

### 3. Visual Crossing Weather API ⭐️⭐️⭐️⭐️

**优势：**
- ✅ **灵活的聚合选项** - 支持多种时间聚合间隔
- ✅ **历史摘要功能** - 专门的历史摘要查询
- ✅ **长期数据** - 50+年历史数据覆盖
- ✅ **免费额度** - 每天1000条记录免费

**技术细节：**
- **API端点：** Timeline Weather API
- **历史覆盖：** 50+年历史数据
- **聚合参数：** `aggregateHours`参数控制聚合间隔
- **定价：** 1000记录/天免费，超出部分$0.0001/记录
- **输出格式：** JSON和CSV格式

**历史摘要功能：**
- 支持跨年份月度聚合（如"过去10年1月份的典型天气"）
- 年份范围可自定义
- 按月分组的长期统计分析

**实现方案：**
```javascript
// 使用Historical Summaries API
const monthlySummary = await fetch(
  `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/39.9042,116.4074/2020-01-01/2023-01-31?unitGroup=metric&include=days&key=${API_KEY}`
);
```

---

### 4. WeatherAPI.com ⭐️⭐️⭐️

**优势：**
- ✅ **历史数据支持** - 从2010年1月开始的历史数据
- ✅ **API密钥认证** - 相对简单的认证机制
- ✅ **交互式API浏览器** - 方便测试和调试

**技术细节：**
- **API端点：** `http://api.weatherapi.com/v1/history.json`
- **历史覆盖：** 2010年1月至今
- **认证方式：** API密钥作为请求参数
- **数据间隔：** 小时级和15分钟级数据

**限制：**
- 历史数据相对较短（仅14年）
- 具体的月度聚合功能文档不够详细
- 可能需要客户端进行数据聚合

---

## 推荐方案

### 方案一：Open-Meteo API（推荐）
**适用场景：** 项目当前使用，免费且功能强大
- **优点：** 完全免费，数据质量高，历史数据丰富
- **实现：** 扩展现有`openMeteoService`，添加月度聚合功能
- **成本：** $0

### 方案二：OpenWeatherMap统计API（高级功能）
**适用场景：** 需要专业统计分析功能
- **优点：** 直接提供统计数据，包含丰富的统计指标
- **实现：** 新增统计API服务模块
- **成本：** 需要Expert订阅

### 方案三：混合方案
**适用场景：** 平衡成本和功能需求
- **主要数据源：** Open-Meteo（免费基础数据）
- **增强功能：** Visual Crossing（免费额度内的高级分析）
- **实现：** 智能路由，根据需求选择API
- **成本：** 基本免费，高级功能按使用量付费

## 技术实现建议

### 1. 数据聚合算法
```javascript
class MonthlyTemperatureAggregator {
  // 从日数据计算月平均温度
  static calculateMonthlyAverage(dailyData) {
    const monthlyStats = {
      avgTemp: this.mean(dailyData.map(d => d.temperature)),
      avgMaxTemp: this.mean(dailyData.map(d => d.temperatureMax)),
      avgMinTemp: this.mean(dailyData.map(d => d.temperatureMin)),
      recordHigh: Math.max(...dailyData.map(d => d.temperatureMax)),
      recordLow: Math.min(...dailyData.map(d => d.temperatureMin))
    };
    return monthlyStats;
  }
}
```

### 2. 缓存策略
```javascript
const CACHE_KEYS = {
  monthlyTemp: (lat, lon, year, month) => 
    `monthly_temp_${lat}_${lon}_${year}_${month}`,
};

const CACHE_TTL = {
  MONTHLY_DATA: 30 * 24 * 60 * 60 * 1000, // 30天
};
```

### 3. API服务扩展
```javascript
// 扩展现有weatherAggregateService
class MonthlyWeatherService extends WeatherAggregateService {
  async getMonthlyTemperatureStats(location, year, month) {
    // 实现月度温度统计查询
  }
  
  async getMonthlyTrends(location, startYear, endYear, month) {
    // 实现月度温度趋势分析
  }
}
```

## 结论

基于调研结果，建议采用**Open-Meteo API**作为主要数据源实现月平均温度查询功能：

1. **零成本启动** - 完全免费，无需额外预算
2. **数据质量高** - 基于专业气象再分析数据
3. **技术兼容性好** - 与现有系统无缝集成
4. **扩展性强** - 后续可根据需求增加其他API支持

建议在现有`openMeteoService`基础上扩展月度聚合功能，为用户提供月度气温数据分析能力。

---

*调研日期：2025年9月10日*  
*调研人员：Claude Code Assistant*  
*文档版本：v1.0*