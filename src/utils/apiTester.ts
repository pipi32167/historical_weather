/**
 * API测试工具
 * 用于验证Open-Meteo API的调用方式和响应格式
 */

export const testOpenMeteoAPI = async () => {
  // 示例API调用：使用日期范围获取北京2003-2023年的历史数据
  const startDate = '2003-01-01';
  const endDate = '2023-12-31';
  const testUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=39.90&longitude=116.41&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min&temperature_unit=celsius&timezone=auto`;
  
  console.log('测试API URL (使用日期范围):', testUrl);
  console.log('日期范围:', startDate, '到', endDate);
  
  try {
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('API响应结构:');
    console.log('- 纬度:', data.latitude);
    console.log('- 经度:', data.longitude);
    console.log('- 时区:', data.timezone);
    console.log('- 数据点数量:', data.daily.time.length);
    console.log('- 日期范围:', data.daily.time[0], '到', data.daily.time[data.daily.time.length - 1]);
    console.log('- 可用参数:', Object.keys(data.daily));
    
    // 检查前几个数据点
    console.log('\n前5个数据点示例:');
    for (let i = 0; i < Math.min(5, data.daily.time.length); i++) {
      console.log(`${data.daily.time[i]}: max=${data.daily.temperature_2m_max[i]}°C, min=${data.daily.temperature_2m_min[i]}°C, mean=${data.daily.temperature_2m_mean?.[i] || 'N/A'}°C`);
    }
    
    return data;
  } catch (error) {
    console.error('API测试失败:', error);
    throw error;
  }
};

// 测试月度数据提取
export const testMonthlyExtraction = (apiData: any, targetMonth: number) => {
  console.log(`\n提取${targetMonth}月份的数据:`);
  
  const monthlyData: Record<number, number[]> = {};
  
  apiData.daily.time.forEach((time: string, index: number) => {
    const date = new Date(time);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    if (month === targetMonth) {
      if (!monthlyData[year]) {
        monthlyData[year] = [];
      }
      
      const meanTemp = apiData.daily.temperature_2m_mean?.[index] || 
                       (apiData.daily.temperature_2m_max[index] + apiData.daily.temperature_2m_min[index]) / 2;
      
      monthlyData[year].push(meanTemp);
    }
  });
  
  console.log(`${targetMonth}月份各年数据点数量:`);
  for (const [year, temps] of Object.entries(monthlyData)) {
    const avgTemp = temps.reduce((sum, t) => sum + t, 0) / temps.length;
    console.log(`${year}年: ${temps.length}天, 平均${avgTemp.toFixed(1)}°C`);
  }
  
  return monthlyData;
};