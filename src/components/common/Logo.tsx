import React from 'react';

interface LogoProps {
  /** Logo尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 是否显示文字 */
  showText?: boolean;
  /** 主题色 */
  theme?: 'light' | 'dark' | 'auto';
  /** 自定义className */
  className?: string;
  /** 点击事件 */
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true, 
  theme = 'auto',
  className = '',
  onClick 
}) => {
  // 根据尺寸设置大小
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  // 根据主题设置颜色
  const getColors = () => {
    if (theme === 'dark') {
      return {
        primary: '#60A5FA', // blue-400
        secondary: '#34D399', // emerald-400
        accent: '#F59E0B', // amber-500
        text: '#F9FAFB' // gray-50
      };
    } else if (theme === 'light') {
      return {
        primary: '#3B82F6', // blue-500
        secondary: '#10B981', // emerald-500
        accent: '#F59E0B', // amber-500
        text: '#111827' // gray-900
      };
    } else {
      // auto - 使用CSS变量以支持动态主题
      return {
        primary: 'currentColor',
        secondary: '#10B981',
        accent: '#F59E0B',
        text: 'currentColor'
      };
    }
  };

  const colors = getColors();

  return (
    <div 
      className={`flex items-center space-x-2 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Logo图标 */}
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* 背景圆形 */}
          <circle
            cx="32"
            cy="32"
            r="30"
            fill="url(#gradient)"
            stroke={colors.primary}
            strokeWidth="2"
          />
          
          {/* 温度计主体 */}
          <rect
            x="28"
            y="12"
            width="8"
            height="28"
            rx="4"
            fill={colors.primary}
            opacity="0.9"
          />
          
          {/* 温度计底部球形 */}
          <circle
            cx="32"
            cy="44"
            r="6"
            fill={colors.accent}
          />
          
          {/* 温度刻度 */}
          <g stroke={colors.text} strokeWidth="1" opacity="0.7">
            <line x1="38" y1="16" x2="42" y2="16" />
            <line x1="38" y1="20" x2="40" y2="20" />
            <line x1="38" y1="24" x2="42" y2="24" />
            <line x1="38" y1="28" x2="40" y2="28" />
            <line x1="38" y1="32" x2="42" y2="32" />
            <line x1="38" y1="36" x2="40" y2="36" />
          </g>
          
          {/* 数据图表线条 */}
          <g stroke={colors.secondary} strokeWidth="2" fill="none">
            <path d="M10 45 L18 40 L26 42 L34 38 L42 35 L50 32 L58 28" opacity="0.8" />
            <circle cx="18" cy="40" r="2" fill={colors.secondary} />
            <circle cx="26" cy="42" r="2" fill={colors.secondary} />
            <circle cx="42" cy="35" r="2" fill={colors.secondary} />
            <circle cx="50" cy="32" r="2" fill={colors.secondary} />
          </g>
          
          {/* 渐变定义 */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
              <stop offset="50%" stopColor={colors.secondary} stopOpacity="0.05" />
              <stop offset="100%" stopColor={colors.accent} stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Logo文字 */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span 
            className={`font-bold ${textSizeClasses[size]} text-gray-900 dark:text-white`}
            style={{ color: theme !== 'auto' ? colors.text : undefined }}
          >
            HistoricalWeather
          </span>
          {size !== 'sm' && (
            <span 
              className={`text-xs text-gray-600 dark:text-gray-300 -mt-1`}
              style={{ color: theme !== 'auto' ? colors.text : undefined, opacity: 0.7 }}
            >
              历史气温数据
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;