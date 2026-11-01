#!/usr/bin/env node
/**
 * 本地静态托管 build/（带 SPA fallback），供端到端测试使用
 *
 * 用法：
 *   npm run build
 *   node scripts/serve-build.mjs [port]      # 默认 8088
 *
 * 说明：CRA 产物是 SPA，/city/:slug 这类路由需要回退到 index.html，
 * 而 `python -m http.server` 之类的简单静态服务不支持，所以这里自带一个。
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../build');
const PORT = Number(process.argv[2] || process.env.PORT || 8088);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
};

const server = http.createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://localhost:${PORT}`).pathname);
  const filePath = path.join(ROOT, pathname);

  // Vercel Analytics 的脚本只有部署在 Vercel 上才存在，本地托管时给个空实现，
  // 否则 SPA fallback 会把 index.html 当成 JS 返回（浏览器报 Unexpected token '<'）
  if (pathname.startsWith('/_vercel/insights/')) {
    response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    response.end('/* local analytics stub */');
    return;
  }

  try {
    const data = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream' });
    response.end(data);
    return;
  } catch {
    // SPA fallback
  }

  // 带扩展名的静态资源缺失时记录一条，避免 SPA fallback 把 404 掩盖成 JS 语法错误
  if (path.extname(pathname)) {
    console.warn(`[404] ${pathname} → 回退 index.html`);
  }

  try {
    const index = await readFile(path.join(ROOT, 'index.html'));
    response.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
    response.end(index);
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('build/ 不存在，请先运行 npm run build');
  }
});

server.listen(PORT, () => {
  console.log(`serving ${path.relative(process.cwd(), ROOT) || ROOT} on http://localhost:${PORT}`);
});
