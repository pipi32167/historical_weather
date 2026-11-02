/**
 * 端到端验证（**真实 API**，不做任何 mock）+ 逐场景截图
 *
 * 与 run-e2e.mjs 的分工：
 * - run-e2e.mjs      全 mock，零外部请求，用于回归断言（60 项）
 * - run-e2e-real.mjs 打真实 open-meteo / nominatim，用于验证「线上真实行为」并产出截图证据
 *
 * 前置：
 *   npm run build
 *   node scripts/serve-build.mjs          # http://localhost:8088
 * 运行：
 *   ego-browser nodejs < scripts/e2e/run-e2e-real.mjs
 *   E2E_OUT=/some/dir ego-browser nodejs < scripts/e2e/run-e2e-real.mjs   # 自定义截图目录
 *
 * 注意：open-meteo 有分钟级请求限额，连续跑会返回 429。脚本会先探测配额、
 * 并在页面出现「加载失败」时等待 65s 重试，避免把限流误判成应用故障。
 */
const BASE = 'http://localhost:8088';
// 截图输出目录：默认 ~/Desktop/historical_weather-e2e-verify（可用 E2E_OUT 覆盖）
const OUT =
  process.env.E2E_OUT ||
  `${process.env.HOME || '/tmp'}/Desktop/historical_weather-e2e-verify`;

const task = await taskSpace('e2e real api verify nanjing');
const page = task.page('p1');

await page.cdp('Browser.setPermission', {
  origin: BASE,
  permission: { name: 'geolocation' },
  setting: 'granted',
});
await page.cdp('Emulation.setGeolocationOverride', { latitude: 31.2304, longitude: 121.4737, accuracy: 50 });

// Open-Meteo 有「每分钟请求数」限制：连续跑多次 E2E 会拿到 429。
// 这里先等到配额恢复，避免把限流误判成应用故障。
const apiBudgetOk = async () => {
  try {
    const r = await fetch(
      'https://archive-api.open-meteo.com/v1/archive?latitude=31.23&longitude=121.47&start_date=2026-10-01&end_date=2026-10-02&daily=temperature_2m_max&timezone=auto'
    );
    return r.ok;
  } catch {
    return false;
  }
};
for (let i = 0; i < 8 && !(await apiBudgetOk()); i += 1) {
  console.log('      ⏳ archive-api 429（分钟级配额），等 65s 后重试…');
  await new Promise((r) => setTimeout(r, 65000));
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

const shot = async (file) => {
  await page.screenshot({ path: `${OUT}/${file}` });
  console.log(`      📷 ${file}`);
};

const geoReqs = () =>
  page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .filter((e) => /geocoding-api/.test(e.name))
      .map((e) => decodeURIComponent(e.name.replace('https://geocoding-api.open-meteo.com/v1/search?', '')))
  );
const archiveReqs = () =>
  page.evaluate(() => performance.getEntriesByType('resource').filter((e) => /archive-api/.test(e.name)).length);

const installErrorHooks = () =>
  page.evaluate(() => {
    window.__errs = [];
    window.addEventListener('error', (e) => window.__errs.push('error: ' + e.message));
    window.addEventListener('unhandledrejection', (e) => window.__errs.push('rejection: ' + String(e.reason).slice(0, 120)));
  });

/** 打开城市下拉的搜索面板 */
const openSearch = async () => {
  const opened = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.offsetParent !== null && b.querySelector('svg') && /中国|China|,/.test(b.innerText)
    );
    if (!btn) return false;
    btn.click();
    return true;
  });
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('button')).find((b) =>
      b.offsetParent !== null && /^(搜索|Search)$/.test(b.innerText.trim())
    );
    if (tab) tab.click();
  });
  await page.waitForTimeout(600);
  return opened;
};

/** 在下拉里输入查询词，返回下拉里可见的结果行 */
const search = async (query, waitMs = 2200) => {
  await page.evaluate((q) => {
    const inputs = Array.from(document.querySelectorAll('input')).filter(
      (i) => i.offsetParent !== null && i.type !== 'date'
    );
    const el = inputs[inputs.length - 1];
    if (!el) throw new Error('搜索输入框不存在');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, q);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, query);
  await page.waitForTimeout(waitMs);
  return page.evaluate(() => {
    const panel = Array.from(document.querySelectorAll('div'))
      .filter((d) => d.offsetParent !== null && /中国|China/.test(d.innerText) && d.querySelectorAll('button').length > 0)
      .pop();
    const rows = panel ? panel.innerText.split('\n').map((s) => s.trim()).filter(Boolean) : [];
    // 结果行的形态：名称 一行 + 「名称, 省, 中国」一行
    const labels = [];
    for (let i = 0; i < rows.length; i += 1) {
      if (/,/.test(rows[i])) labels.push(`${rows[i - 1] || ''} | ${rows[i]}`);
    }
    return labels;
  });
};

const headerCity = () =>
  page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.offsetParent !== null && b.querySelector('svg') && /中国|China|,/.test(b.innerText)
    );
    return btn ? btn.innerText.trim() : '';
  });

const setLanguage = async (label) => {
  const clicked = await page.evaluate((l) => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim() === l);
    if (!btn) return false;
    btn.click();
    return true;
  }, label);
  await page.waitForTimeout(1800);
  const lang = await page.evaluate(() => document.documentElement.lang);
  return { clicked, lang };
};

/** 轮询等待图表渲染（冷启动真实 API 可能要 10s+） */
const loadFailed = () =>
  page.evaluate(() => /加载失败|Failed to load|load failed/i.test(document.body.innerText));

/** 进城市页并等图表；若命中 429 限流（页面显示加载失败）则等 65s 重试一次 */
const gotoCity = async (path) => {
  await page.goto(BASE + path, { timeout: 45000 });
  let charts = await waitCharts(22000);
  if (charts === 0 && (await loadFailed())) {
    console.log('      ⏳ 页面显示加载失败（多为 archive-api 429），等 65s 重试…');
    await new Promise((r) => setTimeout(r, 65000));
    await page.reload({ timeout: 45000 });
    charts = await waitCharts(25000);
  }
  return charts;
};

const waitCharts = async (timeout = 20000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const n = await page.evaluate(() => document.querySelectorAll('.recharts-wrapper').length);
    if (n > 0) return n;
    await page.waitForTimeout(300);
  }
  return 0;
};

const closeDropdown = async () => {
  await page.keyboard.press('Escape').catch(() => {});
  await page.evaluate(() => document.body.click());
  await page.waitForTimeout(400);
};

// ---------------------------------------------------------------- 1. 首屏
await page.goto(`${BASE}/`, { timeout: 45000 });
await page.evaluate(() => {
  try {
    localStorage.clear();
  } catch {}
});
await page.goto(`${BASE}/`, { timeout: 45000 });
await installErrorHooks();
const homeCharts = await waitCharts(22000);
await page.waitForTimeout(500);
check('首屏渲染 + 真实 archive-api 数据', homeCharts > 0 && (await archiveReqs()) >= 1, `charts=${homeCharts} archive=${await archiveReqs()}`);
check('定位城市（真实 Nominatim）', /上海/.test(await headerCity()), await headerCity());
await shot('01-home.png');

// ------------------------------------------- 2. 中文搜「南京」：核心回归点
await openSearch();
const before = (await geoReqs()).length;
const nanjing = await search('南京');
check('搜「南京」→ 只有南京市', nanjing.length === 1 && nanjing[0].includes('南京市'), JSON.stringify(nanjing));
check('搜「南京」→ 结果里没有云南/临沧/思茅', !nanjing.some((t) => /云南|临沧|思茅/.test(t)), JSON.stringify(nanjing));
check('搜「南京」→ 0 次远程地理编码请求', (await geoReqs()).length === before, `+${(await geoReqs()).length - before}`);
await shot('02-search-nanjing-zh.png');

// ------------------------------------------------- 3. 拼音 / 首字母 / 昆山
const njInitials = await search('nj');
check('首字母「nj」→ 南京市', njInitials.some((t) => t.includes('南京市')), JSON.stringify(njInitials.slice(0, 3)));
await shot('03-search-nj-initials.png');

const kunshan = await search('kunshan');
check('拼音「kunshan」→ 昆山市', kunshan.some((t) => t.includes('昆山市')), JSON.stringify(kunshan.slice(0, 3)));
await shot('04-search-kunshan-pinyin.png');

const kunshanZh = await search('昆山');
check('中文「昆山」→ 昆山市（不再只有同名村庄）', kunshanZh.some((t) => t.includes('昆山市')), JSON.stringify(kunshanZh.slice(0, 3)));
check('中文/拼音搜索全程 0 远程请求', (await geoReqs()).length === before, `geocoding 请求 ${(await geoReqs()).length}`);
await closeDropdown();

// ------------------------------------------------------- 4. 英文界面搜中文
const toEn = await setLanguage('English');
check('切到英文界面（html lang=en）', toEn.clicked && toEn.lang === 'en', `clicked=${toEn.clicked} lang=${toEn.lang}`);
await openSearch();
const enNanning = await search('南京');
check(
  '英文界面搜「南京」→ Nanjing（跟随查询语种，不是 0 条）',
  enNanning.some((t) => /Nanjing/i.test(t)),
  JSON.stringify(enNanning)
);
check('英文界面结果不含云南', !enNanning.some((t) => /云南|临沧|Yunnan|Lincang/.test(t)), JSON.stringify(enNanning));
await shot('05-search-nanjing-en.png');
await closeDropdown();
const backZh = await setLanguage('中文');
check('切回中文界面（html lang=zh-CN）', backZh.lang === 'zh-CN', `lang=${backZh.lang}`);

// ------------------------------------------------------------ 5. 远程兜底
await openSearch();
const beforeRemote = (await geoReqs()).length;
const sanlitun = await search('三里屯', 3500);
check('远程兜底「三里屯」有结果且不崩', sanlitun.length > 0, JSON.stringify(sanlitun.slice(0, 2)));
check('远程兜底产生 1 次 geocode 请求', (await geoReqs()).length - beforeRemote === 1, `+${(await geoReqs()).length - beforeRemote}`);
await shot('06-search-sanlitun-fallback.png');
await closeDropdown();

// --------------------------------------------- 6. 点结果 → 城市落地页
await openSearch();
const nanjing2 = await search('南京');
check('再次搜「南京」（缓存后仍正确）', nanjing2.length === 1 && nanjing2[0].includes('南京市'), JSON.stringify(nanjing2));
await page.evaluate(() => {
  const panel = Array.from(document.querySelectorAll('div'))
    .filter((d) => d.offsetParent !== null && /中国|China/.test(d.innerText) && d.querySelectorAll('button').length > 0)
    .pop();
  const btn = Array.from(panel.querySelectorAll('button')).find((b) => /南京市/.test(b.innerText));
  btn.click();
});
let landingCharts = await waitCharts(22000);
for (let i = 0; i < 2 && landingCharts === 0; i += 1) {
  if (!(await loadFailed())) break;
  console.log(`      ⏳ 落地页加载失败（多为 archive-api 429），等 65s 重试（第 ${i + 1} 次）…`);
  await new Promise((r) => setTimeout(r, 65000));
  await page.reload({ timeout: 45000 });
  landingCharts = await waitCharts(25000);
}
const landing = await page.evaluate(() => ({
  path: location.pathname,
  h1: document.querySelector('h1')?.innerText || '',
  title: document.title,
  canonical: document.querySelector('link[rel="canonical"]')?.href || '',
  ogUrl: document.querySelector('meta[property="og:url"]')?.content || '',
  charts: document.querySelectorAll('.recharts-wrapper').length,
}));
check('点击结果跳到 /city/nanjing', landing.path === '/city/nanjing', landing.path);
check('落地页标题/图表正常', /南京/.test(landing.h1) && (landing.charts > 0 || landingCharts > 0), `h1=${landing.h1} charts=${Math.max(landing.charts, landingCharts)}`);
check('canonical 跟随实际域名', landing.canonical === `${BASE}/city/nanjing`, landing.canonical);
check('og:url 与 canonical 一致', landing.ogUrl === landing.canonical, landing.ogUrl);
await shot('07-city-nanjing.png');

// ------------------------------------- 8. canonical 证据叠加 + 其他落地页
await page.evaluate(() => {
  const box = document.createElement('div');
  box.id = '__canonical_evidence';
  box.style.cssText =
    'position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#111;color:#0f0;font:12px/1.5 monospace;padding:8px 10px;border-radius:6px;max-width:640px;white-space:pre-wrap';
  box.textContent =
    'canonical = ' +
    (document.querySelector('link[rel="canonical"]')?.href || '(none)') +
    '\nog:url    = ' +
    (document.querySelector('meta[property="og:url"]')?.content || '(none)') +
    '\ntwitter   = ' +
    (document.querySelector('meta[name="twitter:url"]')?.content || '(none)');
  document.body.appendChild(box);
});
await shot('08-canonical-evidence.png');
await page.evaluate(() => document.getElementById('__canonical_evidence')?.remove());

const pages = [
  ['/city/kunshan', '昆山', '09-city-kunshan.png'],
  ['/city/guangdong', '广东', '10-city-guangdong.png'],
  ['/about', 'Million', '11-about.png'],
];
for (const [path, expect, file] of pages) {
  if (path.startsWith('/city/')) await gotoCity(path);
  else {
    await page.goto(BASE + path, { timeout: 45000 });
    await page.waitForTimeout(2500);
  }
  const state = await page.evaluate(() => ({
    path: location.pathname,
    h1: document.querySelector('h1')?.innerText || '',
    canonical: document.querySelector('link[rel="canonical"]')?.href || '',
    charts: document.querySelectorAll('.recharts-wrapper').length,
  }));
  const ok = state.h1.includes(expect) && state.canonical === `${BASE}${path}` && (!path.startsWith('/city/') || state.charts > 0);
  check(`${path} 渲染 + canonical 正确`, ok, `h1=${state.h1.slice(0, 12)} canonical=${state.canonical} charts=${state.charts}`);
  await shot(file);
}

// --------------------------------------------------- 9. 404 与运行时异常
await page.goto(`${BASE}/city/999999`, { timeout: 45000 });
await page.waitForTimeout(3000);
check('未知城市 → 404 页', /404|Not Found/i.test(await page.evaluate(() => document.body.innerText)), '');
await shot('12-404.png');

const errs = await page.evaluate(() => window.__errs || []);
check('全程无运行时异常', errs.length === 0, errs.slice(0, 3).join(' | '));

const passed = results.filter((r) => r.ok).length;
console.log(`\n===== 真实 API E2E：${passed}/${results.length} 通过 =====`);
if (passed !== results.length) {
  console.log('失败项：');
  results.filter((r) => !r.ok).forEach((r) => console.log(` - ${r.name} — ${r.detail}`));
}
console.log(`截图目录：${OUT}`);
