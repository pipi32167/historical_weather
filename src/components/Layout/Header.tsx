import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  SunIcon, 
  MoonIcon,
  CalendarDaysIcon,
  ClockIcon,
  ChartBarSquareIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '../../store/appStore';
import clsx from 'clsx';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useAppStore();

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const navigationItems = [
    {
      name: '本日历史同期',
      path: '/historical/daily',
      icon: CalendarDaysIcon,
      description: '今日历史同期天气对比'
    },
    {
      name: '本月历史同期',
      path: '/historical/monthly',
      icon: ClockIcon,
      description: '本月历史同期天气分析'
    },
    {
      name: '本季度历史同期',
      path: '/historical/quarterly',
      icon: ChartBarSquareIcon,
      description: '季度历史同期天气趋势'
    },
    {
      name: '本年度历史同期',
      path: '/historical/yearly',
      icon: PresentationChartLineIcon,
      description: '年度历史同期天气统计'
    }
  ];

  return (
    <header className={clsx(
      'bg-primary border-b border-custom h-16 flex items-center justify-between px-6',
      'transition-all duration-200',
      className
    )}>
      {/* Left section - Logo */}
      <button
        onClick={handleLogoClick}
        className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200 cursor-pointer"
      >
        <div className="flex items-center justify-center w-8 h-8 bg-primary-500 rounded-lg">
          <span className="text-white font-bold text-sm">HW</span>
        </div>
        <div className="hidden sm:block text-left">
          <h1 className="text-lg font-semibold text-primary">
            Historical Weather Analytics
          </h1>
          <p className="text-xs text-secondary">
            历史天气数据分析平台
          </p>
        </div>
        <div className="sm:hidden text-left">
          <h1 className="text-lg font-semibold text-primary">
            Weather Analytics
          </h1>
        </div>
      </button>

      {/* Center section - Navigation */}
      <nav className="hidden lg:flex items-center space-x-1">
        <button
          onClick={() => navigate('/')}
          className={clsx(
            'px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
            location.pathname === '/'
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
              : 'text-secondary hover:bg-secondary hover:text-primary'
          )}
        >
          首页
        </button>
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                isActive
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                  : 'text-secondary hover:bg-secondary hover:text-primary'
              )}
              title={item.description}
            >
              <IconComponent className="h-4 w-4" />
              <span className="hidden xl:inline">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile navigation dropdown */}
      <div className="lg:hidden relative">
        <button
          className="p-2 rounded-lg text-secondary hover:bg-secondary transition-colors duration-200"
          onClick={() => {
            // TODO: Implement mobile menu dropdown
          }}
        >
          <CalendarDaysIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Right section - Theme toggle */}
      <button
        onClick={handleThemeToggle}
        className={clsx(
          'p-2 rounded-lg text-secondary hover:bg-secondary',
          'transition-colors duration-200'
        )}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        {theme === 'light' ? (
          <MoonIcon className="h-5 w-5" />
        ) : (
          <SunIcon className="h-5 w-5" />
        )}
      </button>
    </header>
  );
};

export default Header;