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
  window.__e2e = { calls: calls, unknown: [] };

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
  navigator.geolocation.getCurrentPosition = function (success) { setTimeout(function () { success(fixedPosition); }, 30); };
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
    `h1=${pageH1} canonical=${pageCanonical.replace('https://historicalweather.org', '')} charts=${charts}`);
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

const passed = results.filter(r => r.ok).length;
console.log(`\n===== 小计 ${passed}/${results.length} 通过 =====`);
if (passed !== results.length) {
  console.log('失败项:');
  results.filter(r => !r.ok).forEach(r => console.log(` - ${r.name} — ${r.detail || ''}`));
}
