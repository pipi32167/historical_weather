import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  SunIcon, 
  MoonIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon 
} from '@heroicons/react/24/outline';
import { useAppStore } from '../../store/appStore';
import clsx from 'clsx';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const navigate = useNavigate();
  const { 
    theme, 
    sidebarOpen, 
    toggleSidebar, 
    setTheme 
  } = useAppStore();

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
      {/* Left section */}
      <div className="flex items-center space-x-4">
        {/* Sidebar toggle */}
        <button
          onClick={toggleSidebar}
          className={clsx(
            'p-2 rounded-lg text-secondary hover:bg-secondary',
            'transition-colors duration-200',
            'lg:hidden' // Hide on large screens where sidebar is always visible
          )}
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        {/* Logo and title */}
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
              全球天气数据分析平台
            </p>
          </div>
          <div className="sm:hidden text-left">
            <h1 className="text-lg font-semibold text-primary">
              Weather Analytics
            </h1>
          </div>
        </button>
      </div>

      {/* Navigation - Hidden on mobile */}
      <nav className="hidden md:flex items-center space-x-1">
        {[
          { name: '数据对比', href: '/', active: window.location.pathname === '/' },
          { name: '组件测试', href: '/test-chart', active: window.location.pathname === '/test-chart' },
          { name: '实时数据', href: '#', active: false },
        ].map((item) => (
          <a
            key={item.name}
            href={item.href}
            className={clsx(
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
              item.active
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                : 'text-secondary hover:bg-secondary hover:text-primary'
            )}
          >
            {item.name}
          </a>
        ))}
      </nav>

      {/* Right section */}
      <div className="flex items-center space-x-2">
        {/* Theme toggle */}
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

        {/* Settings */}
        <button
          className={clsx(
            'p-2 rounded-lg text-secondary hover:bg-secondary',
            'transition-colors duration-200'
          )}
          aria-label="Settings"
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </button>

        {/* Help */}
        <button
          className={clsx(
            'p-2 rounded-lg text-secondary hover:bg-secondary',
            'transition-colors duration-200'
          )}
          aria-label="Help"
        >
          <QuestionMarkCircleIcon className="h-5 w-5" />
        </button>

        {/* User avatar placeholder */}
        <div className="hidden sm:flex items-center ml-4 pl-4 border-l border-custom">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">U</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;