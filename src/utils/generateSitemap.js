// 生成sitemap的脚本
const fs = require('fs');
const path = require('path');

const cities = [
  'shanghai', 'beijing', 'guangzhou', 'shenzhen', 'hangzhou', 'nanjing', 'chengdu', 'wuhan', 'xian', 'tianjin',
  'newyork', 'london', 'tokyo', 'paris', 'sydney', 'singapore', 'hongkong', 'qingdao', 'dalian', 'xiamen',
  'kunming', 'urumqi', 'lhasa', 'haikou', 'sanya', 'seoul', 'mumbai', 'delhi', 'bangkok', 'jakarta',
  'manila', 'kualalumpur', 'dubai', 'istanbul', 'berlin', 'rome', 'madrid', 'amsterdam', 'vienna', 'zurich',
  'stockholm', 'oslo', 'copenhagen', 'helsinki', 'moscow', 'prague', 'budapest', 'warsaw', 'losangeles', 'chicago',
  'miami', 'sanfrancisco', 'seattle', 'boston', 'toronto', 'vancouver', 'montreal', 'mexicocity', 'buenosaires', 'saopaulo',
  'riodejaneiro', 'lima', 'bogota', 'caracas', 'santiago', 'cairo', 'lagos', 'capetown', 'johannesburg', 'nairobi',
  'casablanca', 'melbourne', 'brisbane', 'perth', 'auckland', 'wellington'
];

const baseUrl = 'https://historicaltemperature.org';
const currentDate = new Date().toISOString();

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- About Page -->
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

`;

// 添加所有城市页面
cities.forEach(cityId => {
  sitemap += `  <!-- City: ${cityId} -->
  <url>
    <loc>${baseUrl}/city/${cityId}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

`;
});

sitemap += '</urlset>';

// 写入public目录
const publicDir = path.join(__dirname, '../../public');
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);

console.log(`✅ Sitemap generated with ${cities.length + 2} URLs`);
console.log(`📄 Includes homepage, about page, and ${cities.length} city pages`);