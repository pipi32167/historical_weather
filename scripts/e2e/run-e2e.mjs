/**
 * 端到端回归套件（所有 API 均 mock，零外部请求，不消耗任何配额）
 *
 * 前置：
 *   npm run build
 *   node scripts/serve-build.mjs          # 静态托管 build/ 于 http://localhost:8088
 * 运行：
 *   ego-browser nodejs < scripts/e2e/run-e2e.mjs
 *
 * 实现要点：
 * - 通过 CDP `Page.addScriptToEvaluateOnNewDocument` 在应用脚本之前注入 fetch 拦截器，
 *   所有 open-meteo / nominatim 请求都返回确定性数据；未知请求直接 204，确保不出网。
 * - 同时 stub `navigator.geolocation`，定位结果固定为上海，避免权限弹窗与环境差异。
 * - 断言点覆盖：路由/渲染、中文与拼音搜索（零网络）、远程兜底与缓存、城市页 slug 解析、
 *   canonical、i18n 切换、单位切换、分析维度切换、控制台异常。
 */
const BASE = 'http://localhost:8088';

const MOCK_SOURCE = String.raw`
(function () {
  if (window.__E2E_MOCK__) return;
  window.__E2E_MOCK__ = true;

  var calls = [];
  window.__e2e = { calls: calls, unknown: [], errors: [] };

  window.addEventListener('error', function (e) { window.__e2e.errors.push('error: ' + (e.message || '')); });
  window.addEventListener('unhandledrejection', function (e) { window.__e2e.errors.push('rejection: ' + String(e.reason).slice(0, 160)); });
  var nativeConsoleError = console.error.bind(console);
  console.error = function () {
    window.__e2e.errors.push('console.error: ' + Array.prototype.slice.call(arguments).map(String).join(' ').slice(0, 200));
    nativeConsoleError.apply(null, arguments);
  };

  function json(body, status) {
    return new Response(JSON.stringify(body), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  function r1(v) { return Math.round(v * 10) / 10; }
  function isoDay(d) { return d.toISOString().slice(0, 10); }

  function daysBetween(startIso, endIso) {
    var out = [];
    var start = new Date(startIso + 'T00:00:00Z');
    var end = new Date(endIso + 'T00:00:00Z');
    for (var d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) out.push(isoDay(d));
    return out;
  }

  // 确定性季节曲线 + 缓慢升温，保证图表有可断言的形状
  function tempFor(iso) {
    var d = new Date(iso + 'T00:00:00Z');
    var doy = Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000);
    var season = Math.sin(((doy - 100) / 365) * 2 * Math.PI);
    var trend = (d.getUTCFullYear() - 2006) * 0.03;
    return 16 + 11 * season + trend;
  }

  function archiveBody(url) {
    var lat = Number(url.searchParams.get('latitude'));
    var lon = Number(url.searchParams.get('longitude'));
    var start = url.searchParams.get('start_date');
    var end = url.searchParams.get('end_date') || start;
    var time = daysBetween(start, end);
    var tmax = [], tmin = [], tmean = [], precip = [], wind = [], code = [];
    for (var i = 0; i < time.length; i++) {
      var t = tempFor(time[i]);
      tmean.push(r1(t));
      tmax.push(r1(t + 4.5));
      tmin.push(r1(t - 4.5));
      precip.push(i % 7 === 0 ? 3.2 : 0);
      wind.push(8 + (i % 5));
      code.push(i % 7 === 0 ? 61 : 1);
    }
    return {
      latitude: lat, longitude: lon, generationtime_ms: 0.2,
      utc_offset_seconds: 0, timezone: 'GMT', timezone_abbreviation: 'GMT', elevation: 10,
      daily_units: {
        time: 'iso8601', temperature_2m_max: '\u00b0C', temperature_2m_min: '\u00b0C',
        temperature_2m_mean: '\u00b0C', precipitation_sum: 'mm', windspeed_10m_max: 'km/h', weather_code: 'wmo code'
      },
      daily: {
        time: time, temperature_2m_max: tmax, temperature_2m_min: tmin, temperature_2m_mean: tmean,
        precipitation_sum: precip, windspeed_10m_max: wind, weather_code: code
      }
    };
  }

  function forecastBody(url) {
    var lat = Number(url.searchParams.get('latitude'));
    var lon = Number(url.searchParams.get('longitude'));
    var today = url.searchParams.get('start_date') || isoDay(new Date());

    if (url.searchParams.get('hourly')) {
      var hours = [], temp = [], prob = [], pre = [], wcode = [], wspd = [], hum = [];
      for (var h = 0; h < 24; h++) {
        hours.push(today + 'T' + String(h).padStart(2, '0') + ':00');
        var t = tempFor(today) + 4 * Math.sin(((h - 6) / 24) * 2 * Math.PI);
        temp.push(r1(t));
        prob.push(h % 6 === 0 ? 40 : 5);
        pre.push(h % 6 === 0 ? 0.8 : 0);
        wcode.push(h % 6 === 0 ? 61 : 1);
        wspd.push(9 + (h % 4));
        hum.push(50 + (h % 20));
      }
      return {
        latitude: lat, longitude: lon,
        hourly_units: {
          time: 'iso8601', temperature_2m: '\u00b0C', precipitation_probability: '%',
          precipitation: 'mm', weathercode: 'wmo code', windspeed_10m: 'km/h', relativehumidity_2m: '%'
        },
        hourly: {
          time: hours, temperature_2m: temp, precipitation_probability: prob,
          precipitation: pre, weathercode: wcode, windspeed_10m: wspd, relativehumidity_2m: hum
        }
      };
    }

    var day = [today];
    var t = tempFor(today);
    return {
      latitude: lat, longitude: lon,
      current_weather: { temperature: r1(t), windspeed: 11.5, winddirection: 180, weathercode: 1, is_day: 1, time: today + 'T12:00' },
      daily_units: {
        time: 'iso8601', temperature_2m_max: '\u00b0C', temperature_2m_min: '\u00b0C',
        precipitation_sum: 'mm', windspeed_10m_max: 'km/h'
      },
      daily: {
        time: day, temperature_2m_max: [r1(t + 4.5)], temperature_2m_min: [r1(t - 4.5)],
        precipitation_sum: [0], windspeed_10m_max: [11]
      }
    };
  }

  // 远程地理编码：同时返回一个"重要地点"和一个 0 人口同名村庄，用于验证相关性过滤
  function geocodeBody(url) {
    var name = url.searchParams.get('name') || '';
    return {
      results: [
        { id: 9001, name: name, latitude: 29.9, longitude: 117.98, feature_code: 'PPLA2',
          country_code: 'CN', country: '\u4e2d\u56fd', admin1: '\u5b89\u5fbd', admin2: '\u9ec4\u5c71\u5e02',
          timezone: 'Asia/Shanghai', population: 120000 },
        { id: 9002, name: name, latitude: 23.4, longitude: 99.7, feature_code: 'PPL',
          country_code: 'CN', country: '\u4e2d\u56fd', admin1: '\u4e91\u5357', admin2: '\u4e34\u6ca7\u5e02',
          timezone: 'Asia/Shanghai' }
      ]
    };
  }

  function nominatimBody(url) {
    var lang = url.searchParams.get('accept-language') || 'zh-CN';
    var isEn = String(lang).toLowerCase().indexOf('en') === 0;
    return {
      lat: url.searchParams.get('lat'), lon: url.searchParams.get('lon'),
      display_name: isEn ? 'Shanghai, China' : '\u4e0a\u6d77\u5e02, \u4e2d\u56fd',
      address: isEn
        ? { city: 'Shanghai', state: 'Shanghai', country: 'China' }
        : { city: '\u4e0a\u6d77\u5e02', state: '\u4e0a\u6d77\u5e02', country: '\u4e2d\u56fd' }
    };
  }

  var realFetch = window.fetch ? window.fetch.bind(window) : null;

  window.fetch = function (input, init) {
    var urlString = typeof input === 'string' ? input : (input && input.url) || '';
    var url;
    try { url = new URL(urlString, location.href); } catch (e) { url = null; }
    var host = url ? url.hostname : '';
    var path = url ? url.pathname : '';

    var kind = 'unknown';
    var body = null;

    if (host === 'geocoding-api.open-meteo.com') { kind = 'geocode'; body = geocodeBody(url); }
    else if (host === 'archive-api.open-meteo.com') { kind = 'archive'; body = archiveBody(url); }
    else if (host === 'api.open-meteo.com') { kind = 'forecast'; body = forecastBody(url); }
    else if (host === 'nominatim.openstreetmap.org') { kind = 'nominatim'; body = nominatimBody(url); }

    calls.push({ kind: kind, url: urlString.slice(0, 160) });

    if (kind === 'unknown') {
      window.__e2e.unknown.push(urlString.slice(0, 160));
      return json({ blocked: true }, 204);
    }
    return json(body);
  };

  // 兜底：XHR（当前应用未使用，但避免将来引入时偷偷出网）
  var RealXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function () {
    var xhr = new RealXHR();
    var open = xhr.open;
    xhr.open = function (method, url) {
      window.__e2e.unknown.push('xhr:' + String(url).slice(0, 120));
      return open.apply(xhr, arguments);
    };
    return xhr;
  };

  // 固定定位，避免权限弹窗与环境差异
  var fixedPosition = {
    coords: { latitude: 31.2304, longitude: 121.4737, accuracy: 30, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
    timestamp: Date.now()
  };
  try { window.__e2e.geoFail = localStorage.getItem('__e2e_geo_fail') === '1'; } catch (e) { window.__e2e.geoFail = false; }
  navigator.geolocation.getCurrentPosition = function (success, error) {
    setTimeout(function () {
      if (window.__e2e.geoFail) { if (error) error({ code: 1, message: 'denied' }); }
      else success(fixedPosition);
    }, 30);
  };
  navigator.geolocation.watchPosition = function (success) { setTimeout(function () { success(fixedPosition); }, 30); return 1; };
  navigator.geolocation.clearWatch = function () {};
})();
`;

const task = await taskSpace('e2e-mock-suite');
const page = task.page('p1');

await page.cdp('Page.addScriptToEvaluateOnNewDocument', { source: MOCK_SOURCE });
await page.cdp('Browser.setPermission', { origin: BASE, permission: { name: 'geolocation' }, setting: 'granted' });
await page.cdp('Emulation.setGeolocationOverride', { latitude: 31.2304, longitude: 121.4737, accuracy: 30 });
await page.cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

const calls = () => page.evaluate(() => (window.__e2e ? window.__e2e.calls.slice() : []));
const callsOf = async kind => (await calls()).filter(c => c.kind === kind).length;

const goto = async path => {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
};

const waitCharts = async timeout => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const n = await page.evaluate(() => document.querySelectorAll('.recharts-wrapper').length);
    if (n > 0) return n;
    await page.waitForTimeout(250);
  }
  return 0;
};

const text = () => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const canonical = () => page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href || '');
const h1 = () => page.evaluate(() => (document.querySelector('h1')?.innerText || '').trim());

const findSearchInput = () => page.evaluate(() => {
  const input = Array.from(document.querySelectorAll('input')).find(x => /城市|city/i.test(x.placeholder || ''));
  return input && input.getBoundingClientRect().width > 0 ? input.placeholder : null;
});

const openSearch = async () => {
  for (let attempt = 0; attempt < 4; attempt++) {
    const placeholder = await findSearchInput();
    if (placeholder) return `input[placeholder="${placeholder}"]`;

    await page.evaluate(label => {
      const tab = Array.from(document.querySelectorAll('button'))
        .find(b => (b.textContent || '').trim() === label && b.getBoundingClientRect().width > 0);
      if (tab) tab.click();
    }, await page.evaluate(() => (document.documentElement.lang || '').startsWith('zh') ? '搜索' : 'Search'));
    await page.waitForTimeout(500);

    const afterTab = await findSearchInput();
    if (afterTab) return `input[placeholder="${afterTab}"]`;

    await page.evaluate(() => {
      const skip = /Home|首页|Historical|历史同期|About|关于我们|°C|°F|中文|English|^$/;
      const trigger = Array.from(document.querySelectorAll('header button'))
        .find(b => !skip.test((b.textContent || '').trim()) && b.getBoundingClientRect().width > 0);
      if (trigger) trigger.click();
    });
    await page.waitForTimeout(600);
  }
  return null;
};

const search = async query => {
  const selector = await openSearch();
  if (!selector) throw new Error('搜索框不可用');
  await page.fill(selector, query);
  await page.waitForTimeout(1500);
  return page.evaluate(() => Array.from(document.querySelectorAll('button'))
    .map(b => (b.innerText || '').replace(/\n/g, ' | ').trim())
    .filter(t => t.includes(' | ')));
};

const setLanguage = async label => {
  await page.evaluate(l => {
    const button = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').trim() === l);
    if (button) button.click();
  }, label);
  await page.waitForTimeout(1800);
};

const headerCity = () => page.evaluate(() => {
  const skip = /Home|首页|Historical|历史同期|About|关于我们|°C|°F|中文|English|^$/;
  return Array.from(document.querySelectorAll('header button'))
    .map(b => (b.textContent || '').trim())
    .filter(t => t && !skip.test(t))[0] || null;
});

// ---------------------------------------------------------------- 场景开始
await goto('/');
await page.evaluate(() => localStorage.clear());
await goto('/');

// 1. 首页渲染
const homeCharts = await waitCharts(15000);
check('首页渲染出图表', homeCharts > 0, `charts=${homeCharts}`);
check('首页默认城市为定位城市（zh）', (await headerCity()) === '上海市, 中国', await headerCity());
check('首页今日逐小时预报有内容', /逐小时预报/.test(await text()));

// 2. 只有 mock 端点被调用（没有任何未知请求出网）
const unknown = await page.evaluate(() => window.__e2e.unknown.slice());
check('无未 mock 的外部请求', unknown.length === 0, unknown.slice(0, 3).join(' ; '));
const homeMockCalls = await page.evaluate(() => {
  const counts = {};
  (window.__e2e.calls || []).forEach(c => { counts[c.kind] = (counts[c.kind] || 0) + 1; });
  return counts;
});
check('首页数据全部来自 mock 端点（archive + forecast + nominatim）',
  (homeMockCalls.archive || 0) > 0 && (homeMockCalls.forecast || 0) > 0 && (homeMockCalls.nominatim || 0) > 0,
  JSON.stringify(homeMockCalls));

// 3. 搜索：中文 / 拼音 / 首字母 / 自治州简称（全部本地命中，零网络）
const geocodeBefore = await callsOf('geocode');
const zhNanjing = await search('南京');
check('中文搜索「南京」→ 南京市', zhNanjing.some(t => t.includes('南京市')), zhNanjing[0]);
const zhKunshan = await search('昆山');
check('中文搜索「昆山」→ 昆山市（不再只有村庄）', zhKunshan.some(t => t.includes('昆山市')), zhKunshan[0]);
const pinyin = await search('kunshan');
check('拼音「kunshan」→ 昆山市', pinyin.some(t => t.includes('昆山市')), pinyin[0]);
const initials = await search('nj');
check('首字母「nj」→ 南京市', initials.some(t => t.includes('南京市')), initials[0]);
const alias = await search('yanbian');
check('自治州简称「yanbian」→ 延边朝鲜族自治州', alias.some(t => t.includes('延边朝鲜族自治州')), alias[0]);
const homophone = await search('suzhou');
check('同音「suzhou」→ 苏州市 + 宿州市', homophone.some(t => t.includes('苏州市')) && homophone.some(t => t.includes('宿州市')), homophone.slice(0, 2).join(' / '));
const ambiguous = await search('朝阳');
check('歧义「朝阳」→ 朝阳市排在前面', /朝阳市/.test(ambiguous[0] || ''), ambiguous[0]);
check('本地搜索零网络请求', (await callsOf('geocode')) === geocodeBefore, `geocode 调用 ${await callsOf('geocode')}`);

// 4. 英文界面搜索
await setLanguage('English');
const enSearch = await search('昆山');
check('英文界面搜索 → Kunshan / Suzhou, Jiangsu, China', enSearch.some(t => /Kunshan \| Suzhou, Jiangsu, China/.test(t)), enSearch[0]);
await setLanguage('中文');

// 5. 远程兜底 + 相关性过滤 + 缓存
const geocodeBeforeRemote = await callsOf('geocode');
const sanlitun = await search('三里屯');
const geocodeAfterRemote = await callsOf('geocode');
const sanlitunLabels = await page.evaluate(() => Array.from(document.querySelectorAll('button'))
  .map(b => (b.innerText || '').replace(/\n/g, ' | ').trim()).filter(t => /三里屯/.test(t)));
check('远程兜底「三里屯」有结果', sanlitun.length > 0, JSON.stringify(sanlitunLabels.slice(0, 2)));
check('远程兜底产生 1 次 geocode 请求', geocodeAfterRemote - geocodeBeforeRemote === 1, `+${geocodeAfterRemote - geocodeBeforeRemote}`);
check('远程结果已过滤同名小村庄（云南不出现）', !sanlitunLabels.some(t => /云南|临沧/.test(t)), JSON.stringify(sanlitunLabels));
const geocodeBeforeCache = await callsOf('geocode');
await page.fill(await openSearch(), '');
await page.waitForTimeout(400);
await search('三里屯');
check('重复搜索命中缓存（0 新请求）', (await callsOf('geocode')) === geocodeBeforeCache, `geocode 调用 ${await callsOf('geocode')}`);

// 6. 点击搜索结果 → 城市落地页
await search('昆山');
await page.evaluate(() => {
  // 结果行 = 名称 + 上级行政区（中英界面都能匹配），避免误点 header 里的当前城市
  const row = Array.from(document.querySelectorAll('button'))
    .filter(b => b.getBoundingClientRect().width > 0)
    .find(b => /昆山|Kunshan/.test(b.innerText || '') && /苏州市|Suzhou/.test(b.innerText || ''));
  if (row) row.click();
});
await page.waitForTimeout(2500);
const afterClickPath = await page.evaluate(() => location.pathname);
check('点击搜索结果跳到 /city/kunshan', afterClickPath === '/city/kunshan', afterClickPath);
check('落地页渲染图表', (await waitCharts(15000)) > 0);

// 7. 路由与 canonical
const routeCases = [
  ['/city/nanjing', '南京', '/city/nanjing'],
  ['/city/kunshan', '昆山市', '/city/kunshan'],
  ['/city/320583', '昆山市', '/city/kunshan'],
  ['/city/suzhou-341300', '宿州市', '/city/suzhou-341300'],
  ['/city/guangdong', '广东省', '/city/guangdong'],
  ['/city/aba', '阿坝县', '/city/aba']
];
for (const [path, expectedName, expectedCanonical] of routeCases) {
  await goto(path);
  await page.waitForTimeout(2500);
  const pageH1 = await h1();
  const pageCanonical = await canonical();
  const charts = await waitCharts(15000);
  check(`${path} → ${expectedName}（canonical + 图表）`,
    pageH1.includes(expectedName) && pageCanonical.endsWith(expectedCanonical) && charts > 0,
    `h1=${pageH1} canonical=${pageCanonical.replace(/^https?:\/\/[^/]+/, '')} charts=${charts}`);
}
await goto('/city/999999');
await page.waitForTimeout(1500);
check('/city/999999 → 404 页', /404|Not Found/i.test(await text()), (await h1()).slice(0, 20));

// 8. i18n：城市页即时切换
await goto('/city/kunshan');
await page.waitForTimeout(3000);
const zhState = { h1: await h1(), lang: await page.evaluate(() => document.documentElement.lang) };
await setLanguage('中文');
await page.waitForTimeout(1500);
const zhCity = await page.evaluate(() => ({
  h1: document.querySelector('h1')?.innerText.trim(),
  lang: document.documentElement.lang,
  title: document.title,
  country: (document.body.innerText.match(/🌍\s*([A-Za-z\u4e00-\u9fff]+)/) || [])[1]
}));
check('中文城市页：昆山市 / 中国 / html lang=zh-CN',
  zhCity.h1.includes('昆山市') && zhCity.country === '中国' && zhCity.lang === 'zh-CN',
  JSON.stringify(zhCity));

await setLanguage('English');
await page.waitForTimeout(1500);
const enCity = await page.evaluate(() => ({
  h1: document.querySelector('h1')?.innerText.trim(),
  lang: document.documentElement.lang,
  title: document.title,
  country: (document.body.innerText.match(/🌍\s*([A-Za-z\u4e00-\u9fff]+)/) || [])[1]
}));
check('英文城市页：Kunshan / China / title 英文 / lang=en',
  enCity.h1.includes('Kunshan') && enCity.country === 'China' && enCity.lang === 'en' && /Kunshan Historical/.test(enCity.title),
  JSON.stringify({ h1: enCity.h1, country: enCity.country, lang: enCity.lang }));

// 9. 定位地名跟随语言（首页）
await goto('/');
await page.waitForTimeout(6000);
const enHeader = await headerCity();
await setLanguage('中文');
await page.waitForTimeout(4000);
const zhHeader = await headerCity();
check('定位城市名随语言切换（en ⇄ zh）', enHeader === 'Shanghai, China' && zhHeader === '上海市, 中国', `${enHeader} / ${zhHeader}`);

// 10. 单位切换
await goto('/');
await page.waitForTimeout(5000);
const tempBefore = await page.evaluate(() => (document.body.innerText.match(/-?\d+\.\d°/g) || []).slice(0, 3).join(','));
await page.evaluate(() => {
  const button = Array.from(document.querySelectorAll('header button')).find(b => (b.textContent || '').trim() === '°F');
  if (button) button.click();
});
await page.waitForTimeout(2500);
const tempAfter = await page.evaluate(() => (document.body.innerText.match(/-?\d+\.\d°/g) || []).slice(0, 3).join(','));
check('切换 °F 后温度数值变化', tempBefore !== tempAfter && tempAfter.length > 0, `${tempBefore} → ${tempAfter}`);

// 11. 分析维度切换不崩
await page.evaluate(() => {
  const trigger = Array.from(document.querySelectorAll('header button'))
    .find(b => /历史同期|Daily Historical|Historical/i.test((b.textContent || '').trim()) && b.getBoundingClientRect().width > 0);
  if (trigger) trigger.click();
});
await page.waitForTimeout(800);
const analysisOptions = await page.evaluate(() => Array.from(document.querySelectorAll('button'))
  .map(b => (b.textContent || '').trim()).filter(t => /月度|季度|年度|Weekly|Monthly|Quarterly|Yearly/.test(t)));
check('分析维度下拉可展开', analysisOptions.length > 0, analysisOptions.slice(0, 4).join(' / '));

// 12. 缓存与异常
const cacheKeys = await page.evaluate(() => Object.keys(localStorage).filter(k => /weather_cache_/.test(k)));
check('历史数据写入本地缓存', cacheKeys.some(k => k.includes('historical')), `缓存项 ${cacheKeys.length}`);
const finalUnknown = await page.evaluate(() => window.__e2e.unknown.slice());
check('全程无未 mock 的外部请求', finalUnknown.length === 0, finalUnknown.slice(0, 3).join(' ; '));
const externalResources = await page.evaluate(() => performance.getEntriesByType('resource')
  .map(e => e.name)
  .filter(name => !name.startsWith(location.origin)));
check('浏览器未真实访问任何外部域名（零配额消耗）', externalResources.length === 0, externalResources.slice(0, 3).join(' ; '));


// 13. 其余路由：/about、/map、未知路径
await goto('/about');
await page.waitForTimeout(1200);
const aboutState = { h1: await h1(), canonical: await canonical() };
check('/about 渲染且 canonical=/about',
  aboutState.h1.length > 0 && aboutState.canonical.endsWith('/about'),
  `h1=${aboutState.h1.slice(0, 20)} canonical=${aboutState.canonical.replace(/^https?:\/\/[^/]+/, '')}`);

await goto('/map');
await page.waitForTimeout(2500);
const mapText = await text();
check('/map 渲染（不崩、无 ErrorBoundary）',
  mapText.length > 40 && !/出错了|Something went wrong|ErrorBoundary/.test(mapText),
  mapText.slice(0, 60));

await goto('/no-such-page');
await page.waitForTimeout(1200);
check('未知路径 → 404 页', /404|Not Found/i.test(await text()), (await h1()).slice(0, 20));

// 14. 六个分析维度在「城市页」上逐个切换
const ANALYSIS_TYPES = [
  ['daily', '查看指定日期在历史年份中的天气表现'],
  ['weekly', '分析指定周在历史年份中的天气数据'],
  ['monthly', '分析指定月份在多年中的温度变化趋势'],
  ['quarterly', '了解季节性气候特征和长期变化规律'],
  ['yearly', '分析多年的年度温度变化趋势'],
  ['custom', '输入多个自定义日期，分析这些日期的天气数据']
];

const setAnalysisType = async description => {
  await page.evaluate(() => {
    // 触发器文本就是当前维度名（历史同期/周数据/月度分析/…），不能用「排除法」，
    // 否则会先命中城市下拉（它也有 aria-haspopup）
    const triggerNames = /^(历史同期|周数据|月度分析|季度分析|年度分析|自定义日期|Daily Historical|Weekly|Monthly|Quarterly|Yearly|Custom Dates?)$/;
    const trigger = Array.from(document.querySelectorAll('header button'))
      .find(b => triggerNames.test((b.textContent || '').trim()) && b.getBoundingClientRect().width > 0);
    if (trigger) trigger.click();
  });
  await page.waitForTimeout(500);
  const clicked = await page.evaluate(desc => {
    const option = Array.from(document.querySelectorAll('button'))
      .find(b => (b.textContent || '').includes(desc) && b.getBoundingClientRect().width > 0);
    if (option) { option.click(); return true; }
    return false;
  }, description);
  await page.waitForTimeout(3000);
  return clicked;
};

await goto('/city/kunshan');
await page.waitForTimeout(4000);
await page.evaluate(() => { window.__e2e.errors.length = 0; });

for (const [type, description] of ANALYSIS_TYPES) {
  const clicked = await setAnalysisType(description);
  const state = await page.evaluate(() => ({
    path: location.pathname,
    h1: document.querySelector('h1')?.innerText.trim() || '',
    charts: document.querySelectorAll('.recharts-wrapper').length,
    tables: document.querySelectorAll('table').length,
    rows: document.querySelectorAll('tbody tr').length,
    textareas: document.querySelectorAll('textarea').length,
    hasErrorBanner: /出错了|Something went wrong|加载失败|Failed to load/i.test(document.body.innerText),
    errors: window.__e2e.errors.slice()
  }));
  // custom 维度是「输入日期」表单，不直接出图表，按输入框断言
  const hasContent = type === 'custom'
    ? state.textareas > 0
    : state.charts > 0 || state.tables > 0 || state.rows > 0;
  check(`城市页分析维度 ${type} 渲染正常`,
    clicked && state.h1.includes('昆山市') && !state.hasErrorBanner && state.errors.length === 0 && hasContent,
    `charts=${state.charts} tables=${state.tables} rows=${state.rows} textarea=${state.textareas} errors=${state.errors.slice(0, 2).join(' | ')}`);
}


// 15b. 六个分析维度在「首页」上也逐个切换
await goto('/');
await page.waitForTimeout(6000);
await setAnalysisType(ANALYSIS_TYPES[0][1]);
for (const [type, description] of ANALYSIS_TYPES) {
  const clicked = await setAnalysisType(description);
  const state = await page.evaluate(() => ({
    path: location.pathname,
    h1: document.querySelector('h1')?.innerText.trim() || '',
    charts: document.querySelectorAll('.recharts-wrapper').length,
    tables: document.querySelectorAll('table').length,
    rows: document.querySelectorAll('tbody tr').length,
    textareas: document.querySelectorAll('textarea').length,
    body: document.body.innerText.slice(0, 160)
  }));
  const hasContent = type === 'custom' ? state.textareas > 0 : state.charts > 0 || state.tables > 0 || state.rows > 0;
  check(`首页分析维度 ${type} 渲染正常`,
    clicked && state.path === '/' && !/404|Not Found/i.test(state.body) && hasContent,
    `path=${state.path} charts=${state.charts} tables=${state.tables} textarea=${state.textareas}`);
}

// 15. 首页切换分析维度（定位城市 id 为 current-location，不能跳到 404）
await goto('/');
await page.waitForTimeout(6000);
await page.evaluate(() => { window.__e2e.errors.length = 0; });
await setAnalysisType(ANALYSIS_TYPES[1][1]);
const homeSwitch = await page.evaluate(() => ({
  path: location.pathname,
  h1: document.querySelector('h1')?.innerText.trim() || '',
  body: document.body.innerText.slice(0, 200),
  errors: window.__e2e.errors.slice()
}));
check('首页切换分析维度不跳到 404', !/404|Not Found/i.test(homeSwitch.body) && !homeSwitch.path.includes('current-location'),
  `path=${homeSwitch.path} h1=${homeSwitch.h1.slice(0, 20)}`);


// 17. 访问过城市页后回首页再切维度：locationStore 里的 id 必须能反解析回城市页
await goto('/city/kunshan');
await page.waitForTimeout(3000);
await goto('/');
await page.waitForTimeout(6000);
await page.evaluate(() => { window.__e2e.errors.length = 0; });
await setAnalysisType(ANALYSIS_TYPES[2][1]);
const afterCityThenHome = await page.evaluate(() => ({
  path: location.pathname,
  body: document.body.innerText.slice(0, 200),
  storedId: JSON.parse(localStorage.getItem('location-storage') || '{}')?.state?.currentLocation?.id || null
}));
check('访问城市页后回首页切换维度不跳到 404',
  !/404|Not Found/i.test(afterCityThenHome.body) && !afterCityThenHome.path.includes('cn-'),
  `path=${afterCityThenHome.path} storedId=${afterCityThenHome.storedId}`);


// 18. 定位被拒绝时（locationStore 里残留刚访问过的城市）切维度仍能回到城市页
await page.evaluate(() => localStorage.setItem('__e2e_geo_fail', '1'));
await goto('/city/kunshan');
await page.waitForTimeout(3000);
await goto('/');
await page.waitForTimeout(12000);
const storedAfterDeny = await page.evaluate(() => JSON.parse(localStorage.getItem('location-storage') || '{}')?.state?.currentLocation?.id || null);
await page.evaluate(() => { window.__e2e.errors.length = 0; });
await setAnalysisType(ANALYSIS_TYPES[2][1]);
const denyState = await page.evaluate(() => ({
  path: location.pathname,
  body: document.body.innerText.slice(0, 200),
  h1: document.querySelector('h1')?.innerText.trim() || ''
}));
check('定位被拒 + 首页切维度：回到城市页而不是 404',
  storedAfterDeny === 'kunshan' && denyState.path === '/city/kunshan' &&
    /昆山市/.test(denyState.h1) && !/404|Not Found/i.test(denyState.body),
  `storeId=${storedAfterDeny} path=${denyState.path} h1=${denyState.h1.slice(0, 16)}`);
await page.evaluate(() => localStorage.removeItem('__e2e_geo_fail'));


// 19. 年份范围选择器（城市页表格 + 自定义区间）
await goto('/city/kunshan');
await page.waitForTimeout(6000);
const rowsBefore = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
await page.selectOption('select:has(option[value="custom"])', '10');
await page.waitForTimeout(4000);
const afterTen = await page.evaluate(() => ({
  rows: document.querySelectorAll('tbody tr').length,
  range: (document.body.innerText.match(/已选择范围:?\s*[^()\n]*/) || [])[0] || ''
}));
check('年份范围切「最近10年」→ 表格行数减少',
  rowsBefore > 0 && afterTen.rows > 0 && afterTen.rows < rowsBefore,
  `${rowsBefore} → ${afterTen.rows} 行 | ${afterTen.range.slice(0, 30)}`);

await page.selectOption('select:has(option[value="custom"])', 'custom');
await page.waitForTimeout(1500);
const customInputs = await page.evaluate(() => document.querySelectorAll('input[type="number"]').length);
check('切「自定义」→ 出现起止年份输入框', customInputs >= 2, `number inputs=${customInputs}`);
await page.selectOption('select:has(option[value="custom"])', '20');
await page.waitForTimeout(3000);

// 20. 联系表单（关于页 → Email 弹窗）
await goto('/about');
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button'))
    .find(b => /Email/.test(b.textContent || '') && b.getBoundingClientRect().width > 0);
  if (btn) btn.click();
});
await page.waitForTimeout(1000);
const contact = await page.evaluate(() => ({
  hasClose: !!document.querySelector('button[aria-label="Close"]'),
  inputs: document.querySelectorAll('div.fixed input').length,
  textareas: document.querySelectorAll('div.fixed textarea').length,
  hasSubmit: !!document.querySelector('div.fixed form button[type="submit"]')
}));
check('关于页联系表单可打开（字段 + 提交按钮）',
  contact.hasClose && contact.inputs >= 3 && contact.textareas >= 1 && contact.hasSubmit,
  JSON.stringify(contact));
await page.evaluate(() => document.querySelector('button[aria-label="Close"]')?.click());
await page.waitForTimeout(600);
const modalClosed = await page.evaluate(() => !document.querySelector('button[aria-label="Close"]'));
check('联系表单可关闭', modalClosed, String(modalClosed));

// 21. 深色主题切换
await goto('/');
await page.waitForTimeout(5000);
const themeBefore = await page.evaluate(() => document.documentElement.classList.contains('dark'));
await page.click('button[aria-label^="Switch to"]');
await page.waitForTimeout(1000);
const themeAfter = await page.evaluate(() => document.documentElement.classList.contains('dark'));
check('深色主题切换生效（html.dark）', themeBefore !== themeAfter, `dark: ${themeBefore} → ${themeAfter}`);
await page.click('button[aria-label^="Switch to"]');
await page.waitForTimeout(800);
const themeRestored = await page.evaluate(() => document.documentElement.classList.contains('dark'));
check('再次点击恢复亮色主题', themeRestored === themeBefore, `dark=${themeRestored}`);

// 16. 全站运行时异常
const runtimeErrors = await page.evaluate(() => window.__e2e.errors.slice());
check('关键页面无运行时异常', runtimeErrors.length === 0, runtimeErrors.slice(0, 3).join(' | '));

const passed = results.filter(r => r.ok).length;
console.log(`\n===== 小计 ${passed}/${results.length} 通过 =====`);
if (passed !== results.length) {
  console.log('失败项:');
  results.filter(r => !r.ok).forEach(r => console.log(` - ${r.name} — ${r.detail || ''}`));
}
