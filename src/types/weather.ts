// 天气数据类型定义
export interface WeatherDataPoint {
  timestamp: string;
  date: string;
  temperature: number;
  temperatureMax: number;
  temperatureMin: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  weatherCondition: string;
  location: string;
  latitude: number;
  longitude: number;
}

// 位置信息
export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  timezone: string;
}

// 查询参数
export interface WeatherQuery {
  locations: Location[];
  startDate: Date;
  endDate: Date;
  metrics: WeatherMetric[];
  granularity: 'hourly' | 'daily' | 'monthly' | 'yearly';
}

// 天气指标
export type WeatherMetric = 
  | 'temperature'
  | 'humidity' 
  | 'pressure'
  | 'windSpeed'
  | 'precipitation';

// 图表配置
export interface ChartConfig {
  type: 'line' | 'area' | 'bar' | 'heatmap' | 'radar';
  showLegend: boolean;
  showGrid: boolean;
  colors: string[];
  height: number;
}

// 自然语言查询
export interface NLQuery {
  id: string;
  text: string;
  intent: QueryIntent;
  entities: QueryEntity[];
  timestamp: Date;
  response?: NLQueryResponse;
}

export interface QueryIntent {
  type: 'comparison' | 'trend' | 'statistics' | 'forecast';
  confidence: number;
}

export interface QueryEntity {
  type: 'location' | 'date' | 'metric' | 'period';
  value: string;
  confidence: number;
}

export interface NLQueryResponse {
  data: WeatherDataPoint[];
  chart: ChartConfig;
  summary: string;
  insights: string[];
}

// 应用状态
export interface AppState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  selectedLocations: Location[];
  currentQuery: WeatherQuery | null;
  queryHistory: NLQuery[];
  isLoading: boolean;
  error: string | null;
}

// API响应类型
export interface WeatherAPIResponse {
  success: boolean;
  data: WeatherDataPoint[];
  message?: string;
  metadata: {
    total: number;
    page: number;
    limit: number;
  };
}