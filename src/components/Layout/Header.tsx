import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Sun, 
  Moon,
  Calendar
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import LanguageSwitcher from '../common/LanguageSwitcher';
import Logo from '../common/Logo';
import CityDropdown from '../common/CityDropdown';
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
              : 'text-secondary hover:bg-secondary hover:text-primary'
          )}
        >
{t('navigation.home')}
        </button>
        
        {/* Cities Dropdown */}
        <CityDropdown />
        
        {/* About Us */}
        <button
          onClick={() => navigate('/about')}
          className={clsx(
            'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
            location.pathname === '/about'
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
              : 'text-secondary hover:bg-secondary hover:text-primary'
          )}
          title={t('navigation.aboutDescription', { defaultValue: '了解平台功能和技术架构' })}
        >
          <Calendar className="h-4 w-4" />
          <span className="hidden xl:inline">{t('navigation.about', { defaultValue: '关于我们' })}</span>
        </button>
      </nav>

      {/* Mobile navigation */}
      <div className="lg:hidden flex items-center space-x-2">
        <CityDropdown />
        <button
          onClick={() => navigate('/about')}
          className="p-2 rounded-lg text-secondary hover:bg-secondary transition-colors duration-200"
          title={t('navigation.about', { defaultValue: '关于我们' })}
        >
          <Calendar className="h-5 w-5" />
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