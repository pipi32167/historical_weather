import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import HomepageHistoricalDaily from './components/HomepageHistoricalDaily';
import CityWeather from './components/CityWeather';
import DynamicLocationWeather from './components/DynamicLocationWeather';
import About from './components/About';
import NotFound from './components/NotFound';
import TestChart from './pages/TestChart';
import HistoricalDaily from './pages/HistoricalDaily';
import HistoricalMonthly from './pages/HistoricalMonthly';
import HistoricalQuarterly from './pages/HistoricalQuarterly';
import HistoricalYearly from './pages/HistoricalYearly';
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
            {/* 首页 - 带自动定位的历史气温数据 */}
            <Route path="/" element={<HomepageHistoricalDaily />} />
            
            {/* 历史同期数据页面 */}
            <Route path="/historical/daily" element={<HistoricalDaily />} />
            <Route path="/historical/monthly" element={<HistoricalMonthly />} />
            <Route path="/historical/quarterly" element={<HistoricalQuarterly />} />
            <Route path="/historical/yearly" element={<HistoricalYearly />} />
            
            {/* 关于我们页面 */}
            <Route path="/about" element={<About />} />
            
            {/* 测试页面 - HistoricalWeatherChart 组件测试 */}
            <Route path="/test-chart" element={<TestChart />} />
            
            {/* 动态位置页面 - 使用坐标显示历史气温数据 */}
            <Route path="/location/:coordinates" element={<DynamicLocationWeather />} />
            
            {/* 城市页面 - 显示特定城市的历史气温数据 */}
            <Route path="/:cityName" element={<CityWeather />} />
            
            {/* 404错误页面 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;