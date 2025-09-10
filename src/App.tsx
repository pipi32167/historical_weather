import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import CityIndex from './components/CityIndex';
import CityWeather from './components/CityWeather';
import DynamicLocationWeather from './components/DynamicLocationWeather';
import TestChart from './pages/TestChart';
import ErrorBoundary from './components/ErrorBoundary';

function App(): React.ReactElement {
  const handleError = (error: Error, errorInfo: any) => {
    console.error('App Error:', error, errorInfo);
  };

  return (
    <ErrorBoundary onError={handleError}>
      <Router>
        <MainLayout>
          <Routes>
            {/* 首页 - 显示支持的城市列表 */}
            <Route path="/" element={<CityIndex />} />
            
            {/* 测试页面 - HistoricalWeatherChart 组件测试 */}
            <Route path="/test-chart" element={<TestChart />} />
            
            {/* 动态位置页面 - 使用坐标显示历史天气数据 */}
            <Route path="/location/:coordinates" element={<DynamicLocationWeather />} />
            
            {/* 城市页面 - 显示特定城市的历史天气数据 */}
            <Route path="/:cityName" element={<CityWeather />} />
            
            {/* 404页面 - 重定向到首页 */}
            <Route path="*" element={<CityIndex />} />
          </Routes>
        </MainLayout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;