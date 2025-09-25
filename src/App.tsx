import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AnalyticsWrapper from './components/AnalyticsWrapper';
import MainLayout from './components/Layout/MainLayout';
import HomepageHistoricalDaily from './components/HomepageHistoricalDaily';
import About from './components/About';
import MapPage from './components/MapPage';
import NotFound from './components/NotFound';
import CityPage from './pages/CityPage';
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

            {/* 城市页面 - 显示特定城市的历史气温数据 */}
            <Route path="/city/:city" element={<CityPage />} />

            {/* 地图页面 - 互动地图天气查询 */}
            <Route path="/map" element={<MapPage />} />

            {/* 关于我们页面 */}
            <Route path="/about" element={<About />} />

            {/* 404错误页面 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AnalyticsWrapper />
        </MainLayout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;