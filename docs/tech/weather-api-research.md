# 历史气温数据API技术方案调研

## 调研目标

寻找符合以下要求的气温数据解决方案：
- **全球覆盖**：支持全球任意地点
- **历史数据**：至少过去20年的数据
- **成本优化**：优先选择免费方案
- **混合方案**：同时支持历史数据和实时数据
- **SQL查询**：支持本地部署和SQL查询

## 方案对比表

| 服务商 | 历史数据范围 | 免费额度 | 全球覆盖 | 实时数据 | 数据下载 | SQL支持 | 推荐指数 |
|--------|------------|---------|---------|---------|---------|---------|----------|
| **Open-Meteo** | 1940-至今(80+年) | 完全免费 | ✅ | ✅ | ✅ | 📊 | ⭐⭐⭐⭐⭐ |
| **Meteostat** | 政府数据源 | 完全免费 | ✅ | ❌ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| **NOAA/NCEI** | 1950-至今 | 完全免费 | ✅ | ✅ | ✅ | ✅ | ⭐⭐⭐⭐ |
| **Visual Crossing** | 几十年 | 1000次/天 | ✅ | ✅ | ✅ | ❌ | ⭐⭐⭐⭐ |
| **OpenWeatherMap** | 1979-至今(45年) | 60次/分钟 | ✅ | ✅ | ❌ | ❌ | ⭐⭐⭐ |
| **WeatherAPI.com** | 有限历史数据 | 100万次/月 | ✅ | ✅ | ❌ | ❌ | ⭐⭐⭐ |
| **ERA5重分析** | 1940-至今 | 完全免费 | ✅ | ❌ | ✅ | ✅ | ⭐⭐⭐⭐ |

## 详细方案分析

### 🥇 推荐方案一：Open-Meteo (最优免费方案)

**优势：**
- 🆓 **完全免费**：非商业用途无需API Key
- 📈 **数据丰富**：80年历史数据(1940-至今)，全球10km分辨率
- ⚡ **高性能**：50TB重分析数据，秒级响应
- 🔄 **混合方案**：同时提供历史和实时数据API
- 🌍 **全球无盲点**：任何地点都有数据

**API特点：**
```bash
# 历史数据示例
https://api.open-meteo.com/v1/historical-weather
?latitude=52.52&longitude=13.41
&start_date=2020-01-01&end_date=2023-12-31
&hourly=temperature_2m,precipitation,wind_speed_10m

# 实时数据示例  
https://api.open-meteo.com/v1/forecast
?latitude=52.52&longitude=13.41
&current_weather=true&hourly=temperature_2m
```

**限制：**
- 非商业用途限制

### 🥈 推荐方案二：Meteostat + Open-Meteo 组合

**Meteostat特点：**
- 🆓 **完全免费**：无API Key需求
- 📊 **Python库**：易于集成和数据处理  
- 🏛️ **政府数据源**：来自NOAA、DWD等权威机构
- 💾 **离线友好**：支持批量数据下载
- 🔍 **Point API**：基于地理插值的精确数据

**使用示例：**
```python
from meteostat import Point, Daily, Hourly
import datetime

# 定义位置和时间范围
location = Point(52.5200, 13.4050, 70)  # 柏林
start = datetime.datetime(2020, 1, 1)
end = datetime.datetime(2023, 12, 31)

# 获取每日数据
data = Daily(location, start, end)
data = data.fetch()

# 数据可直接导入SQL数据库
```

### 🥉 推荐方案三：NOAA官方数据

**特点：**
- 🆓 **政府开放数据**：完全免费
- 📅 **时间跨度长**：1950年至今
- 🔗 **新API端点**：2025年更新为v1版本
- 📦 **批量下载**：FTP支持CSV格式
- 🌊 **综合数据**：包括极端天气事件

**新API端点(2025)：**
```bash
# 新的数据服务API
https://www.ncei.noaa.gov/access/services/data/v1

# 搜索服务API
https://www.ncei.noaa.gov/support/access-search-service-api-user-documentation
```

**批量下载：**
```bash
# FTP批量下载
ftp://ftp.ncdc.noaa.gov/pub/data/
```

### 💰 付费方案：Visual Crossing (最佳商业方案)

**特点：**
- 📊 **统一API**：历史、实时、预报一体化
- 🎯 **高精度**：企业级解决方案
- 🔄 **混合查询**：单次调用获取全部数据类型
- 💼 **商业友好**：20年企业级服务经验

**定价：**
- 免费：1000次/天
- 付费：$35/月起

## SQL数据库部署方案

### 方案A：ERA5重分析数据本地化

**数据源：**

- Copernicus Climate Data Store (CDS)
- 数据格式：NetCDF4、GRIB、Zarr
- 时间范围：1940-至今
- 分辨率：31km全球网格

**部署步骤：**

1. 注册CDS账户
2. 使用CDS API下载历史数据
3. 转换为SQL友好格式
4. 导入SQLite数据库 (生产环境可升级至PostgreSQL)

```python
# 示例：下载ERA5数据并转换为SQL
import cdsapi

c = cdsapi.Client()
c.retrieve(
    'reanalysis-era5-single-levels',
    {
        'product_type': 'reanalysis',
        'format': 'netcdf',
        'variable': ['2m_temperature', 'total_precipitation'],
        'year': ['2020', '2021', '2022'],
        'month': ['01', '02', '03'],
        'day': ['01', '02', '03'],
        'time': ['00:00', '12:00'],
    },
    'era5_data.nc')
```

### 方案B：Meteostat数据本地化

**优势：**

- 已处理的清洁数据
- Python库直接支持
- 易于导入SQL数据库
- 支持SQLite轻量部署

```python
# 批量获取数据并存储到SQLite (兼容PostgreSQL)
import pandas as pd
from meteostat import Stations, Daily
from sqlalchemy import create_engine

# 获取全球气象站
stations = Stations()
stations = stations.region('world')
stations = stations.fetch(limit=1000)

# SQLite方案 - 开发和小规模部署
sqlite_engine = create_engine('sqlite:///weather_data.db')

# PostgreSQL方案 - 生产环境 (预留)
# psql_engine = create_engine('postgresql://user:pass@localhost/weather')

# 选择数据库引擎
engine = sqlite_engine  # 默认使用SQLite

for station_id in stations.index:
    data = Daily(station_id, start, end).fetch()
    data.to_sql('weather_data', engine, if_exists='append', index=False)
```

## 推荐架构方案

### 🎯 最优混合架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   历史数据源     │    │    应用服务层     │    │    前端应用     │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • Meteostat     │────│ • 数据整合API    │────│ • React + TS    │
│ • ERA5数据      │    │ • 缓存层         │    │ • 地图可视化    │
│ • SQLite数据库   │    │ • 查询优化       │    │ • 趋势分析      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │              ┌──────────────────┐
         └──────────────│   实时数据源     │
                        ├──────────────────┤
                        │ • Open-Meteo    │
                        │ • 定时同步      │
                        │ • 增量更新      │
                        └──────────────────┘
```

### 🛠️ 实施步骤

1. **第一阶段**：搭建基础架构
   - 部署SQLite数据库 (快速启动)
   - 集成Meteostat获取历史数据
   - 设置Open-Meteo实时数据

2. **第二阶段**：数据治理
   - 建立数据质量检查
   - 实现增量更新机制
   - 优化查询性能

3. **第三阶段**：服务化
   - 开发统一数据API
   - 添加缓存层
   - 监控和告警

4. **第四阶段**：生产扩展 (可选)
   - 迁移至PostgreSQL集群
   - 数据分片和读写分离
   - 高可用部署

## 结论与建议

**最佳方案组合：**

1. **历史数据**：Meteostat (免费 + Python库 + 政府数据)
2. **实时数据**：Open-Meteo (免费 + 高性能 + 全球覆盖)
3. **本地存储**：SQLite (开发) → PostgreSQL (生产)
4. **备用方案**：NOAA官方数据 + ERA5重分析

**成本评估：**
- 开发成本：中等 (需要数据管道开发)
- 运行成本：极低 (仅服务器成本)
- 维护成本：低 (自动化数据更新)

**风险评估：**
- ✅ 数据可靠性：政府级数据源
- ✅ 服务稳定性：多数据源冗余
- ✅ 扩展性：支持全球任意位置
- ⚠️ 技术复杂性：需要数据处理能力

## 数据库迁移策略

### SQLite vs PostgreSQL 对比

| 特性 | SQLite | PostgreSQL |
|------|--------|-----------|
| **部署复杂度** | ⭐⭐⭐⭐⭐ 零配置 | ⭐⭐ 需要服务器配置 |
| **并发读写** | ⭐⭐ 读并发好，写串行 | ⭐⭐⭐⭐⭐ 高并发 |
| **数据量限制** | ⭐⭐⭐ <1TB推荐 | ⭐⭐⭐⭐⭐ PB级支持 |
| **查询性能** | ⭐⭐⭐⭐ 简单查询快 | ⭐⭐⭐⭐⭐ 复杂查询优 |
| **开发效率** | ⭐⭐⭐⭐⭐ 即开即用 | ⭐⭐⭐ 需配置调优 |

### 兼容性设计原则

```python
# 数据库抽象层 - 支持SQLite和PostgreSQL
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

class WeatherDatabase:
    def __init__(self, db_type='sqlite'):
        if db_type == 'sqlite':
            # SQLite配置 - 开发和小规模部署
            db_path = os.getenv('SQLITE_DB_PATH', './data/weather.db')
            self.engine = create_engine(f'sqlite:///{db_path}', 
                                      echo=False,
                                      pool_pre_ping=True)
        elif db_type == 'postgresql':
            # PostgreSQL配置 - 生产环境
            db_url = os.getenv('DATABASE_URL', 
                              'postgresql://user:pass@localhost:5432/weather')
            self.engine = create_engine(db_url,
                                      pool_size=20,
                                      max_overflow=30,
                                      pool_pre_ping=True)
        
        self.Session = sessionmaker(bind=self.engine)
    
    def get_weather_data(self, location, date_range):
        # 使用标准SQL语法，兼容两种数据库
        query = text("""
            SELECT date, temperature, humidity, pressure 
            FROM weather_data 
            WHERE location = :location 
            AND date BETWEEN :start_date AND :end_date
            ORDER BY date
        """)
        
        with self.engine.connect() as conn:
            return conn.execute(query, {
                'location': location,
                'start_date': date_range[0],
                'end_date': date_range[1]
            }).fetchall()
```

### 迁移路径

#### 阶段1: SQLite开发环境
- 快速原型开发
- 本地测试和验证
- 单用户使用场景

#### 阶段2: 数据增长评估
```python
# 监控数据库大小和查询性能
import sqlite3
import os

def assess_migration_need(db_path):
    # 检查数据库文件大小
    db_size_gb = os.path.getsize(db_path) / (1024**3)
    
    # 检查并发查询延迟
    conn = sqlite3.connect(db_path)
    start_time = time.time()
    cursor = conn.execute("SELECT COUNT(*) FROM weather_data")
    query_time = time.time() - start_time
    
    # 迁移建议
    if db_size_gb > 10 or query_time > 2:
        return "建议迁移至PostgreSQL"
    return "继续使用SQLite"
```

#### 阶段3: 无缝迁移
```python
# 数据迁移脚本
def migrate_sqlite_to_postgresql():
    # 1. 导出SQLite数据
    sqlite_engine = create_engine('sqlite:///weather.db')
    
    # 2. 建立PostgreSQL连接
    psql_engine = create_engine('postgresql://user:pass@localhost/weather')
    
    # 3. 批量迁移数据
    chunk_size = 10000
    for chunk in pd.read_sql("SELECT * FROM weather_data", 
                           sqlite_engine, chunksize=chunk_size):
        chunk.to_sql('weather_data', psql_engine, 
                    if_exists='append', index=False)
    
    print("数据迁移完成")
```

### 迁移触发条件

- **数据量**: SQLite文件 > 10GB
- **并发**: 同时查询用户 > 10
- **性能**: 查询响应时间 > 2秒
- **功能**: 需要全文搜索、地理空间查询等高级功能

这种渐进式架构设计既保证了开发初期的敏捷性，又为未来的扩展预留了平滑的迁移路径，是历史气温数据项目的理想选择。