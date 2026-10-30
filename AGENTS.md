# AGENTS.md

本文件是本仓库的协作说明：架构、命令、硬性约定和已知陷阱。
若与 `CLAUDE.md` 冲突，以本文件为准；`CLAUDE.md` 中关于 i18n 和 useEffect 防死循环的详细规范仍然有效。

## 1. 项目定位

历史气温查询与趋势分析平台，线上域名 `https://historicalweather.org`。

- 纯前端 SPA（无后端、无数据库），构建产物为静态文件，直接部署 `build/`。
- 数据源：Open-Meteo（Archive / Forecast / Geocoding）+ OpenStreetMap Nominatim（反向地理编码、地名）。
- 双语（`zh-CN` / `en-US`），以城市落地页 + SEO 为主要增长方式（`/city/:city`）。
- 代码注释、文档以中文为主；UI 文案必须走 i18n。

## 2. 技术栈

React 19 · TypeScript 5.9（strict）· Create React App（react-scripts 5，未 eject）
Tailwind CSS 3.4（`darkMode: 'class'`）+ CSS 变量主题 · Recharts 3 · Zustand 5（persist）
react-router-dom 7 · i18next 25 / react-i18next · date-fns 4 · lucide-react · Leaflet / react-leaflet · @vercel/analytics

## 3. 命令

```bash
npm install

# 开发：固定端口 24587，并强制打开 mock 模式（见 package.json scripts）
npm start

# 生产构建（输出 build/）
npm run build

# 测试（CI 模式）
npm test -- --watchAll=false

# 用真实 API 调试：package.json 里内联的 REACT_APP_USE_MOCK=true 会覆盖 .env，必须绕过该脚本
PORT=24587 REACT_APP_USE_MOCK=false npx react-scripts start
```

注意事项：

- 仓库同时存在 `package-lock.json` 和 `yarn.lock`，但本机未安装 yarn；默认用 **npm**，不要随意重新生成 lockfile。
- `react-scripts@5` 对 Node 版本敏感。若 build/test 报 webpack / OpenSSL / `ERR_OSSL_EVP_UNSUPPORTED`，切到 Node 18/20 LTS。
- `src/App.test.tsx` 是 CRA 模板遗留（断言 “learn react”），当前测试基建在导入阶段即失败，**不能作为回归依据**；TDD 要求与当前限制见 §6。
- 没有独立的 lint / typecheck 脚本，CRA 在 build 时做类型检查；`CI=true npm run build` 会把 warning 当 error。

### 环境变量

| 变量 | 作用 |
| --- | --- |
| `REACT_APP_USE_MOCK` | 仅当 `NODE_ENV=development` 且值为 `true` 时启用本地 mock |
| `PORT` | 开发端口，脚本中固定为 24587 |
| `CI` | 影响 CRA 构建：warning 视为 error |

## 4. 目录结构

```
src/
├── index.tsx                 # 入口：i18n 初始化、errorSuppressor、ReactDOM
├── App.tsx                   # 路由表
├── pages/                    # 分析维度页面（daily/weekly/monthly/quarterly/yearly/custom）+ CityPage
├── components/
│   ├── HomepageHistoricalDaily.tsx   # 首页容器（1000 行，按 analysisType 切换 pages/Historical*）
│   ├── CityHistoricalDaily.tsx       # 城市页容器
│   ├── Layout/                       # MainLayout / Header
│   ├── Charts/                       # Recharts 封装
│   ├── Controls/ + common/           # 日期、城市、年份范围、单位/语言切换等
│   └── MapPage / WeatherDataDisplay  # 地图 + 旧版数据展示（/map 路由，导航入口已注释）
├── services/
│   ├── openMeteoWeather.ts           # 最底层 API 客户端（geocode/forecast/historical）+ localStorage 缓存 + 重试
│   ├── unifiedHistoricalService.ts   # 页面首选数据入口：内存缓存 + 日期过滤/按年分组
│   ├── monthlyTemperatureService.ts  # 月度/年度聚合与趋势计算
│   ├── weatherAggregateService.ts    # 历史+预报拼接（旧链路，仅 useWeatherData/MapPage 使用）
│   ├── weatherService.ts             # 旧版完整服务（仅 useWeatherData 使用）
│   ├── geocodingService.ts           # Open-Meteo Geocoding（城市搜索）
│   └── osmGeocodingService.ts        # Nominatim 反向地理编码（当前位置 → 地名）+ 本地缓存
├── store/                    # Zustand：location / analysisType / yearRange / app(主题、单位)
├── hooks/                    # useWeatherData(旧)、useGeolocation、useTemperatureDisplay、usePageTitle 等
├── utils/                    # cache、concurrency、统计、温度换算、天气代码映射、sitemap 生成脚本
├── data/cityMappings.ts      # 城市 slug → 坐标（sitemap / /city/:city 依赖）
├── i18n/locales/{zh-CN,en-US}.json
└── mock/                     # 1.5MB 历史数据快照，mock 模式固定返回这一份
```

## 5. 运行时架构

### 路由

| 路径 | 组件 | 说明 |
| --- | --- | --- |
| `/` | `HomepageHistoricalDaily` | 根据 `analysisStore.currentAnalysisType` 内嵌渲染 `pages/Historical*` |
| `/city/:city` | `CityPage` | 从 `cityMappings` 取城市，写 SEO meta，再内嵌同一批分析页面 |
| `/map` | `MapPage` | 已实现但导航入口被注释 |
| `/about` | `About` | — |
| `*` | `NotFound` | — |

分析维度不是独立路由，而是由全局 store 切换。新增维度时需要同时改：`analysisStore` 的 `AnalysisType`、`AnalysisTypeDropdown`、首页/CityPage 的分支渲染、i18n key。

### 数据流（页面首选路径）

```
页面/容器
  → unifiedHistoricalService.getUnifiedHistoricalData(location, startYear)
      · 内存缓存 1h，key = `${lat.toFixed(2)}_${lon.toFixed(2)}`
      · 固定请求 startYear-01-01 → 昨天（不按 endYear 截断）
  → openMeteoService.getHistoricalWeather(...)
      · localStorage 缓存 7 天，key 见 utils/cache.ts#cacheKeys
      · fetch 超时 10s + 最多 3 次指数退避重试
  → archive-api.open-meteo.com
  → monthlyTemperatureService / unifiedHistoricalService.filterBy* 做客户端聚合
```

- Open-Meteo 请求**必须用 `start_date` + `end_date` 日期区间**，不要逐日请求。
- 今日数据来自 `getTodayForecast`（10 分钟内存缓存），历史截止到昨天，避免 archive API 边界问题。
- 三层缓存：`unifiedHistoricalService` 内存 Map（历史 1h / 今日预报 10min）→ `openMeteoWeather` 的 localStorage 缓存（TTL 见下）→ `geocodingService` 内存 Map（30min）。逐小时预报缓存 1h。
- `unifiedHistoricalService` 的 key 只含坐标与起始年：切换结束年份不会重新请求（年份过滤在客户端完成）；切换时区/语言也不会。

### 城市搜索（地理编码）

```
CityDropdown（唯一挂载的搜索入口）/ CitySearchBox（当前未挂载）
  → openMeteoService.geocodeCity(query, uiLanguage, count)
      · language 由 resolveGeocodeLanguage(query, uiLanguage) 决定：中文查询强制 zh
      · 上游多取 3×count（至少 10 条），给过滤留冗余
      · rankGeocodeResults 清洗：去重 → 剔除非居民地要素 → 剔除同名小地名 → 按人口排序
      · localStorage 缓存 7 天，key = geocoding:v2:{query}:{lang}:{count}
```

- 上游 `geocoding-api.open-meteo.com` 直接透传 GeoNames，**不做相关性排序**：搜「南京」会带回云南两个同名 0 人口村庄（要素码 `PPL`）。清洗逻辑只能写在 `src/utils/geocodeSearch.ts`（纯函数 + 单测），不要在组件里临时 `filter`。
- 过滤规则刻意保守：只有当结果里存在人口 ≥ 10 万或国家/省/地级行政中心的同名地点时，才剔除小地名；若全部是小地名（如上游对「昆山」只返回村庄）则原样保留，不能让搜索变空。
- 上游 `language` 参数**同时决定搜索索引**：`name=南京&language=en` 返回 0 条，所以不能直接用界面语言。
- 展示文案统一走 `buildPlaceLabel`（补齐 `admin2`），否则「南京, 云南, 中国」无法区分同名地点。
- 修改过滤/排序规则时同步 bump `cacheKeys.geocoding` 的版本号，否则用户 7 天内的旧缓存不会更新。

### 缓存约定（`src/utils/cache.ts`）

| 数据类型 | TTL |
| --- | --- |
| 历史数据 | 7 天 |
| 地理编码 | 7 天 |
| 当前天气 | 10 分钟 |
| 预报 | 1 小时 |
| 搜索结果 | 30 分钟 |

localStorage 上限 50MB，超限淘汰最旧项；不可用时自动降级为内存缓存。新增缓存一律复用 `cacheKeys` + `CACHE_TTL`，不要自造 key 格式。

### 状态管理

- `locationStore`：当前城市、最近、收藏（persist）
- `analysisStore`：当前分析维度（persist）
- `yearRangeStore`：年份范围，默认近 20 年（persist）
- `appStore`：主题、摄氏/华氏、历史查询状态（persist）

### 样式

- Tailwind + `src/index.css` 中的 CSS 变量。主题类名用 `bg-primary` / `bg-secondary` / `bg-tertiary` / `text-primary` / `text-secondary` / `border-custom`（这些是自定义类，不是 Tailwind `primary-500` 调色板）。
- 深色模式通过 `<html class="dark">`，`appStore.setTheme` 负责切换。
- 图表统一用 Recharts，先看 `components/Charts/` 现有封装再新建。

### SEO

- `usePageTitle` / `useHomePageTitle` / `useHistoricalPageTitle` 设置 `document.title` 与 og/twitter meta。
- `CityPage` 会动态改写 description/keywords/JSON-LD；改城市页时保持中英两套 SEO 文案。
- `public/index.html` 是静态 meta 与 JSON-LD 的源头。
- `public/sitemap.xml` 是提交到 GSC/Bing 的静态文件，由 `node src/utils/generateSitemap.js` 生成（未接入 npm scripts）；新增城市需同时更新 `cityMappings` 与该脚本的城市数组并重新生成。

## 6. TDD 原则

本项目采用测试先行。默认流程是 **红 → 绿 → 重构**：没有先看到测试失败，不要写实现。

### 6.1 什么必须先写测试

| 改动类型 | 要求 |
| --- | --- |
| `utils/`、`services/` 的纯逻辑（统计、趋势、日期过滤、温度换算、缓存 key/TTL） | 必须 TDD |
| Bug 修复 | 先写能复现该 bug 的失败测试，再修 |
| 数据边界（昨天/闰年/跨年、`null`/`NaN` 温度、±60°C 过滤、429 重试） | 必须有测试 |
| 新组件 / 新交互 | 先写 React Testing Library 行为测试，断言用户可见结果，不断言实现细节 |
| 纯样式 / 文案 / i18n JSON | 可不写单测，但必须 `npm run build` + 手动验证 |

### 6.2 放置与命名

- 与被测文件同目录：`utils/cache.ts` → `utils/cache.test.ts`；测试数据多时放 `__fixtures__/`。
- 命名描述行为：`describe('filterByDate')` + `it('returns an empty array when daily.time is missing')`。
- 只通过公开 API 测试，不测私有方法；断言具体输出或副作用，不要对大对象做整块 snapshot。
- 优先内联小数据；不要拿 1.5MB 的 mock 快照做单元测试，也不要在单测里断言真实 Open-Meteo 响应。

### 6.3 确定性

- 禁止真实网络、真实定位、真实当前时间。mock `fetch` / `navigator.geolocation`；时间用 `jest.useFakeTimers()` + `setSystemTime`，日期基准写死。
- `beforeEach` / `afterEach` 必须清理：`localStorage.clear()`、`jest.restoreAllMocks()`、恢复 timers。
- 用例之间不依赖执行顺序；service 单例的模块级缓存要在测试里显式 `clearCache()`。
- 禁止 `it.only` / `describe.skip` 进入主干。

### 6.4 运行

```bash
npm test -- --watchAll=false                              # 全量
npm test -- --watchAll=false --testPathPattern=cache      # 单个文件
npm test -- --watchAll=false --coverage                   # 覆盖率
```

### 6.5 当前测试基建状态（重要）

`npm test` 现在会在**导入阶段**失败，不是断言失败：CRA 5 内置的 Jest 27 不解析 package `exports`，`react-router-dom@7` 和 `@vercel/analytics/react` 都会报 `Cannot find module`；即使补上映射，还有 `TextEncoder is not defined` 和模板测试 `App.test.tsx`。因此：

- 纯逻辑层（`utils/`、不 import React/router/analytics 的 service）**现在就可以 TDD**。
- 需要渲染 `App` 或路由的测试，先修测试基建：`jest.moduleNameMapper` 映射 RR7 / analytics 子路径 + `setupTests.ts` polyfill `TextEncoder` + mock `AnalyticsWrapper`，并重写或删除模板测试；基建修复应单独提交。
- **不允许**以「测试跑不起来」为由跳过测试：至少为新逻辑补测试，并在提交说明里写明未执行的原因。

### 6.6 重构与提交

- 重构不改变行为时测试不应修改；必须改测试就说明是行为变更，并在提交信息中写清。
- 提交前：`npm test -- --watchAll=false` 全绿 + `npm run build` 通过（CI 环境下 warning 会 fail）。
- 测试代码同样要 review：可读、无魔法数字、失败信息能直接定位问题。

## 7. 硬性开发约定

1. **i18n**：所有用户可见文案必须使用 `t('...')`，并同时写入 `zh-CN.json` 与 `en-US.json`。禁止硬编码中英文。城市名用 `getCityLocalizedName`，天气现象用 `getWeatherConditionKey(code)` + `weather.conditions.*`。
2. **温度单位**：API 一律返回摄氏度。展示/绘图统一通过 `useTemperatureDisplay()`（`formatTemp`/`displayTemp`/`formatChartTick`/`getUnitSymbol`）或 `utils/temperatureConversion.ts`，不要在组件里手写 `* 9/5 + 32`。
3. **请求**：统一走 `openMeteoWeather.ts` 的 `fetchWithRetry` 封装；不要直接 `fetch`。重试上限 3 次，指数退避；429 需给出友好提示与手动重试，不要无限重试。
4. **状态**：跨组件共享状态放 Zustand store；父子通信用 props 回调。不要为单个页面新增全局 store，也不要绕过 store 另存一份 location。
5. **useEffect**：依赖数组只放稳定值；函数用 `useCallback`；涉及定位/数据的 effect 必须有 `isInitialized` 之类的守卫。历史上多次因 effect 循环导致 API 429，详见 `CLAUDE.md` 的“Preventing Infinite Render Loops”。
6. **TypeScript**：strict 模式。组件写显式返回类型（现有代码两种风格：`React.FC<Props>` 与 `function X(): React.ReactElement`，跟随所在目录即可）；props 必须定义 interface；避免 `any`（现有遗留代码中的 `any` 不要扩散）。
7. **数据校验**：Open-Meteo 可能返回 `null`/空洞。历史温度取用前检查 `!= null && !isNaN()` 并做合理范围过滤（现网用 -60~60°C）。
8. **时区**：请求时传 `location.timezone`；日期字符串统一 `YYYY-MM-DD`，聚合时注意 `new Date('YYYY-MM-DD')` 的 UTC 解析行为。
9. **不要引入新依赖**，除非确有必要；CRA 已锁定构建链，新增包需同时考虑包体积与 Node 兼容性。
10. **提交前**：`npm test -- --watchAll=false` 全绿 + `npm run build` 通过（CI 下 warning 会 fail）；改动数据链路时用真实 API 模式手动验证首页 + 一个 `/city/:city` 页；改动 i18n 时检查两个语言文件 key 是否对齐。

## 8. 已知陷阱 / 待清理项

- **`CLAUDE.md` 有过时内容**：它仍称 `App.tsx` 是 CRA 默认模板、开发端口 3000、只用 npm。实际已是完整应用、端口 24587、默认 mock。
- **域名不一致（待确认）**：`public/index.html`、`StructuredData`、`About`、`MapPage` 使用 `historicalweather.org`，而 `public/sitemap.xml`、`public/robots.txt`、`generateSitemap.js` 使用 `historicaltemperature.org`。改 SEO 前先与维护者确认主域名，不要单方面批量替换。
- **Mock 模式是“假”的**：`src/mock/config.ts` 无论城市/日期都返回同一份 `weather_cache_historical_big.json`，且只作用于 `getHistoricalWeather`（今日预报、逐小时、地理编码仍走真实网络）。mock 下的正确性只能验证渲染，不能验证多城市、日期过滤等逻辑。
- **服务层重复**：`openMeteoService.geocodeCity` 与 `geocodingService.searchCities` 都能搜城市；页面数据优先用 `unifiedHistoricalService`，不要新代码再走 `weatherService` / `weatherAggregateService`（仅旧 `useWeatherData` 与 `/map` 使用）。
- **未使用/半废弃文件**：`utils/concurrencyController.ts`、`utils/apiTester.ts`、`utils/historicalDataGenerator.ts`、`components/RateLimitingLoader.tsx` 当前没有实际引用；删除前先全局搜索确认。
- **`/map` 功能存在但入口被注释**（`Layout/Header.tsx`），改动导航时注意不要误删注释块里的实现线索。
- **缓存与语言**：部分地理编码缓存按语言区分，部分不区分；做多语言地名时要显式传 `language`。
- **日志很多**：源码中大量 `console.log`（含 emoji），生产构建不会自动移除。新增调试日志后建议在合并前清理。
- **根目录脚本**：`test_api.sh`、`test_final_integration.sh`、`debug-data-consistency.js` 是手动排查工具，不在 CI 中运行。
- **文档**：`docs/` 内容较全但部分描述的是规划态（如 SYSTEM_ARCHITECTURE 里的自然语言查询、`/historical/*` 路由），与当前实现不完全一致；以源码为准。

## 9. 常见任务

- **新增城市**：`src/data/cityMappings.ts` 添加 `Location` → `generateSitemap.js` 城市数组 → 运行生成脚本 → 确认 `getCityByName` 能命中 slug。
- **新增分析维度**：先扩展 `AnalysisType` 与下拉选项，再写 `pages/HistoricalXxx.tsx`（复用 `unifiedHistoricalService` + `useYearRangeStore` + `useLocationStore`），最后接入首页与 CityPage 的 switch。
- **改 API 参数**：只改 `openMeteoWeather.ts` 的参数拼接处，并同步 `cacheKeys`（key 必须包含新参数，否则会读到旧缓存）。
- **调缓存时间**：统一改 `utils/cache.ts` 的 `CACHE_TTL` 或对应 service 的 timeout 常量，不要散落硬编码。
- **新增 i18n 文案**：两个 locale JSON 同结构添加，key 按 `feature.section.item` 命名；数组类文案参考 `time.*` 的写法。
- **改主题色/样式**：优先改 `tailwind.config.js`（primary/weather 色板）与 `index.css` 的 CSS 变量，避免在组件里写死 hex。
