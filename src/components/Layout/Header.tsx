import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  SunIcon, 
  MoonIcon,
  CalendarDaysIcon,
  ChartBarSquareIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '../../store/appStore';
import LanguageSwitcher from '../common/LanguageSwitcher';
import clsx from 'clsx';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useAppStore();
  const { t } = useTranslation();

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const navigationItems = [
    {
      name: t('navigation.daily'),
      path: '/historical/daily',
      icon: ChartBarSquareIcon,
      description: t('analysis.historical')
    },
    {
      name: t('navigation.cities'),
      path: '/cities',
      icon: CalendarDaysIcon,
      description: t('location.search')
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
          <span className="text-white font-bold text-sm">🌡️</span>
        </div>
        <div className="hidden sm:block text-left">
          <h1 className="text-lg font-semibold text-primary">
            {t('app.title')}
          </h1>
        </div>
        <div className="sm:hidden text-left">
          <h1 className="text-lg font-semibold text-primary">
            {t('weather.temperature')}
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
{t('navigation.home')}
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

      {/* Mobile navigation */}
      <div className="lg:hidden flex items-center space-x-2">
        <button
          onClick={() => navigate('/historical/daily')}
          className="p-2 rounded-lg text-secondary hover:bg-secondary transition-colors duration-200"
          title="历史分析"
        >
          <ChartBarSquareIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => navigate('/cities')}
          className="p-2 rounded-lg text-secondary hover:bg-secondary transition-colors duration-200"
          title="城市索引"
        >
          <CalendarDaysIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Right section - Language switcher and Theme toggle */}
      <div className="flex items-center space-x-2">
        <LanguageSwitcher />
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
      </div>
    </header>
  );
};

export default Header;