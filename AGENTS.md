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

# 重新生成国内行政区离线索引（src/data/chinaDistricts.json）
#   数据源为阿里 DataV，会限流（403），被限时用 --from-raw 传已保存的原始行
npm run data:china
# npm run data:china -- --from-raw /path/to/rows.json

# 用真实 API 调试：package.json 里内联的 REACT_APP_USE_MOCK=true 会覆盖 .env，必须绕过该脚本
PORT=24587 REACT_APP_USE_MOCK=false npx react-scripts start
```

注意事项：

- 仓库同时存在 `package-lock.json` 和 `yarn.lock`，但本机未安装 yarn；默认用 **npm**，不要随意重新生成 lockfile。
- `react-scripts@5` 对 Node 版本敏感。若 build/test 报 webpack / OpenSSL / `ERR_OSSL_EVP_UNSUPPORTED`，切到 Node 18/20 LTS。
- `src/utils/chinaPlaceIndex.test.ts` 里包含数据完整性断言（条目数、坐标范围、层级分布），改完数据记得跑。
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
│                             # geocodeSearch（远程结果清洗）/ chinaPlaceIndex（国内行政区离线索引）/ coords（GCJ-02 ↔ WGS-84）
│                             # citySlug（城市页 slug 解析）/ seo（canonical 生成）
│                             # placeNamesEn（中文名 → 英文写法）/ placeDisplay（多语言展示）/ chinaNameUtils（简称工具）
├── data/cityMappings.ts      # 城市 slug → 坐标（sitemap / /city/:city 依赖）
├── data/chinaDistricts.json  # 生成产物：3237 条省/市/区县 + WGS-84 坐标 + 拼音（npm run data:china）

构建期专用 devDependency（不进产物）：`cn-divisions`（人工拼音）、`pinyin-pro`（拼音兜底）。
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
      ├─ 命中 src/utils/chinaPlaceIndex.ts（中文 / 全拼 / 首字母）→ 直接返回，不发任何请求
      └─ 否则回退远程：
          · language 由 resolveGeocodeLanguage(query, uiLanguage) 决定：中文查询强制 zh
          · 上游多取 3×count（至少 10 条），给过滤留冗余
          · rankGeocodeResults 清洗：去重 → 剔除非居民地要素 → 剔除同名小地名 → 按人口排序
          · localStorage 缓存 7 天，key = geocoding:v2:{query}:{lang}:{count}
```

**离线行政区索引（国内查询主路径）**：

- `src/data/chinaDistricts.json`：34 省 + 363 地级 + 2840 区县 = 3237 条，171 KB / gzip 70 KB，坐标已转 **WGS-84**，每条带**简称拼音**。
- 通过 `await import()` 懒加载（构建产物是独立 chunk，不进主包）。
- 数据由 `npm run data:china` 重新生成（`scripts/build-china-districts.mjs`）：
  - 名称 + 坐标：阿里 DataV 行政区划 GeoJSON。DataV 会限流（403），被限时可等服务恢复，或用 `--from-raw` 传已保存的原始行。
  - 拼音：**cn-divisions（人工维护）为主，pinyin-pro 生成兜底**（两者都是 devDependency，只在构建期用）。实测以 geojson.cn 人工拼音为参照，cn-divisions 一致率 95%、pinyin-pro 86%（多音字易错：闵行/丰都）。脚本会按 adcode 对齐音节数量取简称拼音，对不齐的（约 7%）自动降级到 pinyin-pro。
- 匹配顺序：中文全名精确 → 中文简称精确 → 中文前缀 → 中文包含 → **全拼精确（含自治州简称）→ 拼音首字母 → 全拼前缀**；同层级内省/地级市优先于区县，所以搜「朝阳」先给朝阳市再给朝阳区。
- 拼音归一化：忽略大小写/空格/撇号，`ü` 统一存成 `v`（`lvliang` → 吕梁市）；自治州额外存一个民族后缀去掉后的简称拼音（`yanbian` → 延边朝鲜族自治州）。
- 索引里**只有行政区**：街道/村/景区、国外城市、台湾下级区划都搜不到，必须靠远程兜底——改这块时保持这个分界。
- 区划每年会调整，需要重新生成并重跑数据完整性测试（`src/utils/chinaPlaceIndex.test.ts`）。

**远程兜底（GeoNames）**：

- 上游 `geocoding-api.open-meteo.com` 直接透传 GeoNames，**不做相关性排序**：搜「南京」会带回云南两个同名 0 人口村庄（要素码 `PPL`）。清洗逻辑只能写在 `src/utils/geocodeSearch.ts`（纯函数 + 单测），不要在组件里临时 `filter`。
- 过滤规则刻意保守：只有当结果里存在人口 ≥ 10 万或国家/省/地级行政中心的同名地点时，才剔除小地名；若全部是小地名则原样保留，不能让搜索变空。
- 上游 `language` 参数**同时决定搜索索引**：`name=南京&language=en` 返回 0 条，所以不能直接用界面语言。
- 展示文案统一走 `buildPlaceLabel`（补齐 `admin2`），否则「南京, 云南, 中国」无法区分同名地点。
- 修改过滤/排序规则时同步 bump `cacheKeys.geocoding` 的版本号，否则用户 7 天内的旧缓存不会更新。
- 坐标系：DataV / 高德 / 腾讯是 GCJ-02，Open-Meteo 要 WGS-84，跨源混用前必须过 `src/utils/coords.ts`（有单测）。

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

### i18n / 地名多语言

- 语言资源在 `src/i18n/locales/{zh-CN,en-US}.json`；`cities.*` 是手写城市的名称翻译（76 条）上，`countries.*` 是国家名。
- **`<html lang>` 由 `src/i18n/index.ts` 的 `syncHtmlLang` 维护**（index.html 写死了 `lang="en"`，不处理则切语言后一直是 en）。
- 离线行政区索引只有中文名，所以 `Location` / `OpenMeteoLocation` 同时携带 `nameEn` / `admin1En` / `admin2En`（由 `placeNamesEn.ts` 在索引构建时从拼音生成 + 特例表）。
- 展示一律走 `src/utils/placeDisplay.ts`：
  - `localizedPlaceName(place, t, language)` —— 手写城市优先 `cities.<id>` 翻译，否则按语言在 `name` / `nameEn` 间切换；`getCityLocalizedName` 已改为委托它，老调用点自动生效。
  - `localizedPlaceLabel` / `localizedRegionLabel` —— 搜索结果文案（名称/地级市/省/国家，自动去重）。
  - `localizedCountry` —— `China` ⇄ 中国（通过 `countries.*`）。
- 英文名规则：默认音节连写首字母大写（`kun shan` → Kunshan）；`placeNamesEn.ts` 里的 `OVERRIDES` 存多音字/惯用译名（西安 Xi'an、陕西 Shaanxi、内蒙古 Inner Mongolia、乌鲁木齐 Urumqi、香港 Hong Kong…），加新特例往那里补。
- 不要手写纯样式的中英双份文案；不要在组件里直接拼 `name + country`。

### SEO

- `usePageTitle` / `useHomePageTitle` / `useHistoricalPageTitle` 设置 `document.title` 与 og/twitter meta。
- `CityPage` 会动态改写 description/keywords/JSON-LD；改城市页时保持中英两套 SEO 文案。
- `public/index.html` 是静态 meta 与 JSON-LD 的源头。
- **canonical / og:url 必须按路由更新**：`useCanonicalSeo()`（挂在 `MainLayout`）负责非城市路由，`CityPage` 负责 `/city/*`（它要异步解析 slug）。纯逻辑在 `src/utils/seo.ts`（`canonicalUrl` / `canonicalPathForLocation`），有单测。以前的坑：canonical 写死在 `index.html`，所有城市页都指向首页。
- `public/sitemap.xml` 由 `npm run sitemap`（`scripts/build-sitemap.mjs`）生成，当前 **3299 个 URL**：首页 + /about + `cityMappings` 的 76 个手写城市（id 直接从 `cityMappings.ts` 正则解析，无需维护第二份清单）+ 行政区索引的 3237 个 slug。
- sitemap 的 slug 规则与运行时 `citySlug.ts` 是两份实现（前者跑在 node，不能 import TS），由 `src/utils/sitemap.test.ts` 兜底：它会逐条 `resolveCitySlug` 校验，规则一漂移测试就红。
- **主域名统一为 `https://historicalweather.org`**（与 index.html / canonical / 结构化数据一致）；sitemap 脚本支持 `SITE_ORIGIN=... npm run sitemap` 覆盖，`public/robots.txt` 里的 sitemap 地址需同步。旧的 `src/utils/generateSitemap.js` 已删除（它写死城市数组且用另一个域名）。
- 新增/调整行政区数据后：`npm run data:china` → `npm run sitemap` → 跑 `sitemap.test.ts`。

### 城市页 slug（`src/utils/citySlug.ts`）

`/city/:city` 的解析优先级：

1. `cityMappings` 手写城市（`nanjing` 等）——URL 不变，不破坏已有收录。
2. 行政区索引：slug = 简称拼音（`/city/kunshan`、`/city/guangdong`）；同音冲突时 adcode 最小者占裸 slug，其余加 `-adcode`（`suzhou` → 苏州市，`suzhou-341300` → 宿州市）。
3. 纯 6 位 adcode（`/city/320583`）也能访问，canonical 指向规范 slug。

- 该模块会引入 170KB 行政区数据，**只能动态 `import()`**（CityPage、CityDropdown 都是这么做的），否则数据会进主包。
- 索引城市的 `Location.id` 用**规范 slug**（`kunshan`、`suzhou-341300`），不要用 `cn-<adcode>`：`AnalysisTypeDropdown` 会 `navigate('/city/' + currentLocation.id)`，id 不可解析就会 404（E2E 里有对应断言）。
- 城市搜索引擎命中的行政区结果（`source === 'china-districts'`）会直接跳对应落地页，不再回首页——这是 3237 个页面的内链入口。

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

### 6.7 端到端回归套件（API 全 mock）

```bash
npm run build
node scripts/serve-build.mjs                     # 静态托管 build/ 于 :8088（带 SPA fallback）
ego-browser nodejs < scripts/e2e/run-e2e.mjs      # 跑套件
```

- 当前 **54 项断言**，覆盖所有路由与页面类型：
  - 路由：`/`、`/city/:slug` 的 6 种形态（mapped `nanjing` / pinyin slug `kunshan` / adcode `320583` / 同音后缀 `suzhou-341300` / 省级 `guangdong` / 区县 `aba`）、`/about`、`/map`、`/city/999999`、未知路径 → 404
  - 六个分析维度（daily/weekly/monthly/quarterly/yearly/custom）**在首页和城市页各跑一遍**：断言 h1、图表/表格/输入框、无 ErrorBoundary、无 console 异常
  - 搜索：中文/拼音/首字母/自治州简称/同音/歧义，本地命中零网络；远程兜底产生 1 次请求、同名小村庄被过滤、重复搜索命中缓存；点击结果跳落地页
  - i18n：中英即时切换（h1/title/country/`<html lang>`）、定位地名跟随语言
  - 其它：canonical、°F 单位切换、历史数据写入本地缓存、运行中无异常
  - 边界：定位被拒绝时，首页切换分析维度仍能回到 `/city/kunshan`（而不是 `/city/cn-320583` 这类 404）
- **零外部请求**：通过 CDP `Page.addScriptToEvaluateOnNewDocument` 在应用脚本之前注入 fetch 拦截器，open-meteo（archive/forecast/geocoding）与 Nominatim 全部返回确定性数据（季节曲线 + 缓慢升温），未知域名直接 204；同时 stub `navigator.geolocation` 固定到上海。套件最后两条断言就是“无未 mock 请求”和“无外部域名资源”。
- 这样跑多少次都不会消耗 API 配额，也不受网络/限流影响；改数据链路、路由、i18n 后先跑它，再用真实 API 手动抽查一两个页面。
- 驱动脚本依赖本机的 `ego-browser`（agent 工具），逻辑与具体工具无关（注入 mock + 断言 DOM），后续可平移到 Playwright/Cypress。
- 写断言时的三个坑：① 导航后 `window.__e2e` 会重置，需要断言“累计请求数”时立即取；② `CityDropdown` 在桌面/移动菜单各渲染一份，选元素必须过滤 `getBoundingClientRect().width > 0`，否则会点到隐藏实例；③ header 里有两个 `aria-haspopup` 下拉（城市、分析维度），要按特征文本选中，不能用“排除法”或 DOM 顺序。
- 想测“定位被拒绝”这类分支时，把开关放进 `localStorage`（`__e2e_geo_fail`），因为每次导航都会重新执行注入脚本，挂在 `window` 上的开关会丢。

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
- **域名**：站点统一用 `historicalweather.org`（index.html / canonical / 结构化数据 / sitemap / robots.txt 已对齐）。残留的 `support@historicaltemperature.org` 是联系邮箱（`i18n/locales/*.json` 的 `contact.email`），属内容决策，未改动。
- **Mock 模式是“假”的**：`src/mock/config.ts` 无论城市/日期都返回同一份 `weather_cache_historical_big.json`，且只作用于 `getHistoricalWeather`（今日预报、逐小时、地理编码仍走真实网络）。mock 下的正确性只能验证渲染，不能验证多城市、日期过滤等逻辑。
- **服务层重复**：`openMeteoService.geocodeCity` 与 `geocodingService.searchCities` 都能搜城市；页面数据优先用 `unifiedHistoricalService`，不要新代码再走 `weatherService` / `weatherAggregateService`（仅旧 `useWeatherData` 与 `/map` 使用）。
- **未使用/半废弃文件**：`utils/concurrencyController.ts`、`utils/apiTester.ts`、`utils/historicalDataGenerator.ts`、`components/RateLimitingLoader.tsx` 当前没有实际引用；删除前先全局搜索确认。
- **`/map` 功能存在但入口被注释**（`Layout/Header.tsx`），改动导航时注意不要误删注释块里的实现线索。
- **缓存与语言**：部分地理编码缓存按语言区分，部分不区分；做多语言地名时要显式传 `language`。
- **日志很多**：源码中大量 `console.log`（含 emoji），生产构建不会自动移除。新增调试日志后建议在合并前清理。
- **根目录脚本**：`test_api.sh`、`test_final_integration.sh`、`debug-data-consistency.js` 是手动排查工具，不在 CI 中运行。
- **文档**：`docs/` 内容较全但部分描述的是规划态（如 SYSTEM_ARCHITECTURE 里的自然语言查询、`/historical/*` 路由），与当前实现不完全一致；以源码为准。

## 9. 常见任务

- **新增城市**：国内城市不需要改代码（行政区索引已覆盖，`/city/{拼音 slug}` 自动可用）；只有**国外城市**或需要英文名/翻译时才在 `src/data/cityMappings.ts` 加 `Location` + `i18n/locales/*.json` 的 `cities.<id>`，然后 `npm run sitemap` 重新生成。
- **新增分析维度**：先扩展 `AnalysisType` 与下拉选项，再写 `pages/HistoricalXxx.tsx`（复用 `unifiedHistoricalService` + `useYearRangeStore` + `useLocationStore`），最后接入首页与 CityPage 的 switch。
- **改 API 参数**：只改 `openMeteoWeather.ts` 的参数拼接处，并同步 `cacheKeys`（key 必须包含新参数，否则会读到旧缓存）。
- **调缓存时间**：统一改 `utils/cache.ts` 的 `CACHE_TTL` 或对应 service 的 timeout 常量，不要散落硬编码。
- **新增 i18n 文案**：两个 locale JSON 同结构添加，key 按 `feature.section.item` 命名；数组类文案参考 `time.*` 的写法。
- **改主题色/样式**：优先改 `tailwind.config.js`（primary/weather 色板）与 `index.css` 的 CSS 变量，避免在组件里写死 hex。
