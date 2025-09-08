// 统计计算工具函数

/**
 * 计算数组的中位数
 */
export const calculateMedian = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
};

/**
 * 计算数组的平均值
 */
export const calculateMean = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
};

/**
 * 计算数组的标准差
 */
export const calculateStandardDeviation = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  
  const mean = calculateMean(numbers);
  const squaredDifferences = numbers.map(num => Math.pow(num - mean, 2));
  const variance = calculateMean(squaredDifferences);
  
  return Math.sqrt(variance);
};

/**
 * 计算数组的百分位数
 */
export const calculatePercentile = (numbers: number[], percentile: number): number => {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  
  if (index === Math.floor(index)) {
    return sorted[index];
  } else {
    const lower = sorted[Math.floor(index)];
    const upper = sorted[Math.ceil(index)];
    return lower + (upper - lower) * (index - Math.floor(index));
  }
};

/**
 * 计算温度趋势（线性回归斜率）
 */
export const calculateTemperatureTrend = (data: Array<{ date: string; temperature: number }>): number => {
  if (data.length < 2) return 0;
  
  // 按年份排序
  const sortedData = [...data].sort((a, b) => new Date(a.date).getFullYear() - new Date(b.date).getFullYear());
  
  // 使用年份作为x，温度作为y进行线性回归
  const n = sortedData.length;
  const years = sortedData.map((_, index) => index); // 0, 1, 2, ... 代表相对年份
  const temperatures = sortedData.map(d => d.temperature);
  
  const sumX = years.reduce((sum, x) => sum + x, 0);
  const sumY = temperatures.reduce((sum, y) => sum + y, 0);
  const sumXY = years.reduce((sum, x, i) => sum + x * temperatures[i], 0);
  const sumXX = years.reduce((sum, x) => sum + x * x, 0);
  
  // 线性回归斜率公式: slope = (n*∑xy - ∑x*∑y) / (n*∑x² - (∑x)²)
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  return slope || 0;
};

/**
 * 格式化统计数值显示
 */
export const formatStatistic = (value: number, decimals: number = 1, unit: string = ''): string => {
  if (isNaN(value) || !isFinite(value)) return 'N/A';
  return `${value.toFixed(decimals)}${unit}`;
};

/**
 * 获取温度变化描述
 */
export const getTemperatureTrendDescription = (trend: number): string => {
  if (Math.abs(trend) < 0.1) return '基本稳定';
  if (trend > 0.5) return '明显上升';
  if (trend > 0.2) return '轻微上升';
  if (trend < -0.5) return '明显下降';
  if (trend < -0.2) return '轻微下降';
  return '基本稳定';
};