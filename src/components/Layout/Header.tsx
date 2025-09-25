import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sun,
  Moon,
  Calendar,
  Map
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import LanguageSwitcher from '../common/LanguageSwitcher';
import TemperatureUnitSwitcher from '../common/TemperatureUnitSwitcher';
import Logo from '../common/Logo';
import CityDropdown from '../common/CityDropdown';
import AnalysisTypeDropdown from '../common/AnalysisTypeDropdown';
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


  return (
    <header className={clsx(
      'bg-primary border-b border-custom h-16 flex items-center justify-between px-6',
      'transition-all duration-200',
      className
    )}>
      {/* Left section - Logo */}
      <div className="flex items-center">
        <Logo
          size="md"
          showText={true}
          theme="auto"
          onClick={handleLogoClick}
          className="hover:opacity-80 transition-opacity duration-200"
        />
      </div>

      {/* Center section - Navigation */}
      <nav className="hidden lg:flex items-center space-x-1">
        <button
          onClick={() => navigate('/')}
          className={clsx(
            'px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
            location.pathname === '/'
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
              : 'text-primary hover:bg-secondary hover:text-primary'
          )}
        >
          {t('navigation.home')}
        </button>

        {/* Cities Dropdown */}
        <CityDropdown />

        {/* Analysis Type Dropdown */}
        <AnalysisTypeDropdown />

        {/* Map */}
        {/* <button
          onClick={() => navigate('/map')}
          className={clsx(
            'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
            location.pathname === '/map'
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
              : 'text-primary hover:bg-secondary hover:text-primary'
          )}
          title={t('navigation.mapDescription', { defaultValue: '互动地图天气查询' })}
        >
          <Map className="h-4 w-4" />
          <span className="hidden xl:inline">{t('navigation.map', { defaultValue: '地图' })}</span>
        </button>
         */}
        {/* About Us */}
        <button
          onClick={() => navigate('/about')}
          className={clsx(
            'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
            location.pathname === '/about'
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
              : 'text-primary hover:bg-secondary hover:text-primary'
          )}
          title={t('navigation.aboutDescription', { defaultValue: '了解平台功能和技术架构' })}
        >
          <Calendar className="h-4 w-4" />
          <span className="hidden xl:inline">{t('navigation.about', { defaultValue: '关于我们' })}</span>
        </button>
      </nav>

      {/* Mobile navigation */}
      <div className="lg:hidden flex items-center space-x-1">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg text-primary hover:bg-secondary transition-colors duration-200"
          title={t('navigation.home')}
        >
          <span className="text-xs font-medium">{t('navigation.home')}</span>
        </button>
        <CityDropdown />

        {/* Mobile Analysis Type Dropdown */}
        <AnalysisTypeDropdown />

        <button
          onClick={() => navigate('/map')}
          className="p-2 rounded-lg text-primary hover:bg-secondary transition-colors duration-200"
          title={t('navigation.map', { defaultValue: '地图' })}
        >
          <Map className="h-5 w-5" />
        </button>

        <button
          onClick={() => navigate('/about')}
          className="p-2 rounded-lg text-primary hover:bg-secondary transition-colors duration-200"
          title={t('navigation.about', { defaultValue: '关于我们' })}
        >
          <Calendar className="h-5 w-5" />
        </button>
      </div>

      {/* Right section - Temperature unit, Language switcher and Theme toggle */}
      <div className="flex items-center space-x-2">
        <TemperatureUnitSwitcher />
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
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;