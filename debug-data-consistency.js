/**
 * 调试数据一致性问题 - 首页 vs /shanghai
 */

console.log('=== 数据一致性调试 ===');

// 模拟上海位置数据
const shanghaiFromCityMappings = {
  id: 'shanghai',
  name: '上海',
  latitude: 31.2304,
  longitude: 121.4737,
  country: 'China',
  timezone: 'Asia/Shanghai'
};

const shanghaiFallback = {
  id: 'shanghai_fallback',
  name: '上海',
  latitude: 31.2304,
  longitude: 121.4737,
  country: 'China',
  timezone: 'Asia/Shanghai'
};

console.log('CityMappings中的上海:', shanghaiFromCityMappings);
console.log('UserLocationWeather的fallback上海:', shanghaiFallback);

// 检查坐标是否完全一致
const coordsMatch = 
  shanghaiFromCityMappings.latitude === shanghaiFallback.latitude &&
  shanghaiFromCityMappings.longitude === shanghaiFallback.longitude;

const timezoneMatch = shanghaiFromCityMappings.timezone === shanghaiFallback.timezone;

console.log('坐标匹配:', coordsMatch);
console.log('时区匹配:', timezoneMatch);

// 检查日期处理
const today = new Date();
console.log('今天日期 (首页使用):', today.toISOString().split('T')[0]);
console.log('今天日期 (/shanghai使用):', today.toISOString().split('T')[0]);

// 检查时区处理
console.log('浏览器时区:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('上海时区:', 'Asia/Shanghai');

// 模拟API调用的关键参数
const apiParams = {
  首页: {
    location: shanghaiFallback,
    targetDate: today,
    apiType: 'weatherAggregateService.getHistoricalSamePeriodData'
  },
  shanghai页面: {
    location: shanghaiFromCityMappings,
    targetDate: today,
    apiType: 'weatherAggregateService.getHistoricalSamePeriodData (via useWeatherData)'
  }
};

console.log('API调用参数对比:', apiParams);

// 预期的差异点分析
console.log('\n=== 可能的差异原因 ===');
console.log('1. 位置ID不同 (shanghai vs shanghai_fallback) - 但坐标相同，应该不影响API调用');
console.log('2. 时区处理不同 - 都是Asia/Shanghai，应该一致');
console.log('3. 日期处理不同 - 都使用今天，应该一致');
console.log('4. API调用路径不同 - 但现在都使用聚合API，应该一致');
console.log('5. 缓存问题 - 可能存在不同的缓存键');

// 生成缓存键对比
const generateCacheKey = (location, date, years) => 
  `historicalSamePeriod_${location.latitude}_${location.longitude}_${date.toISOString().split('T')[0]}_${years}`;

const cacheKey1 = generateCacheKey(shanghaiFallback, today, 20);
const cacheKey2 = generateCacheKey(shanghaiFromCityMappings, today, 20);

console.log('\n=== 缓存键对比 ===');
console.log('首页缓存键:', cacheKey1);
console.log('/shanghai缓存键:', cacheKey2);
console.log('缓存键匹配:', cacheKey1 === cacheKey2);

if (cacheKey1 !== cacheKey2) {
  console.log('❌ 缓存键不匹配！这可能导致数据不一致');
} else {
  console.log('✅ 缓存键匹配，应该获取相同数据');
}