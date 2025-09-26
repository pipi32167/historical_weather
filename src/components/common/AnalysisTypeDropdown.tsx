import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  Clock, 
  BarChart3, 
  LineChart,
  Settings,
  ChevronDown,
  CalendarDays
} from 'lucide-react';
import { useAnalysisStore, AnalysisType } from '../../store/analysisStore';
import clsx from 'clsx';

interface AnalysisTypeDropdownProps {
  className?: string;
}

interface AnalysisTypeConfig {
  id: AnalysisType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

const AnalysisTypeDropdown: React.FC<AnalysisTypeDropdownProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const { currentAnalysisType, setAnalysisType } = useAnalysisStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const analysisTypes: AnalysisTypeConfig[] = [
    {
      id: 'daily',
      name: t('navigation.daily'),
      icon: Calendar,
      description: t('analysisTypes.dailyDescription'),
      color: 'blue'
    },
    {
      id: 'weekly',
      name: t('navigation.historical.weekly'),
      icon: CalendarDays,
      description: t('analysisTypes.weeklyDescription'),
      color: 'teal'
    },
    {
      id: 'monthly',
      name: t('navigation.monthly'),
      icon: Clock,
      description: t('analysisTypes.monthlyDescription'),
      color: 'green'
    },
    {
      id: 'quarterly',
      name: t('navigation.quarterly'),
      icon: BarChart3,
      description: t('analysisTypes.quarterlyDescription'),
      color: 'orange'
    },
    {
      id: 'yearly',
      name: t('navigation.yearly'),
      icon: LineChart,
      description: t('analysisTypes.yearlyDescription'),
      color: 'purple'
    },
    {
      id: 'custom',
      name: t('navigation.historical.custom'),
      icon: Settings,
      description: t('analysisTypes.customDescription'),
      color: 'gray'
    }
  ];

  const currentType = analysisTypes.find(type => type.id === currentAnalysisType);
  const CurrentIcon = currentType?.icon || Calendar;

  const handleAnalysisTypeChange = (type: AnalysisType) => {
    setAnalysisType(type);
    setIsOpen(false);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-secondary hover:text-primary transition-colors duration-200"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <CurrentIcon className="h-4 w-4" />
        <span className="hidden lg:inline">{currentType?.name}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-primary border border-custom rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-custom bg-secondary">
            <h3 className="text-sm font-medium text-primary">
              {t('analysisTypes.title')}
            </h3>
          </div>

          {/* Options */}
          <div className="py-2">
            {analysisTypes.map((analysisType) => {
              const IconComponent = analysisType.icon;
              const isActive = currentAnalysisType === analysisType.id;
              
              return (
                <button
                  key={analysisType.id}
                  onClick={() => handleAnalysisTypeChange(analysisType.id)}
                  className={clsx(
                    'w-full text-left px-4 py-3 hover:bg-secondary transition-colors duration-150',
                    isActive && 'bg-primary-50 dark:bg-primary-900/20'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className={clsx(
                      'h-4 w-4 flex-shrink-0',
                      isActive ? 'text-primary-600 dark:text-primary-400' : 'text-secondary'
                    )} />
                    <div className="min-w-0 flex-1">
                      <div className={clsx(
                        'text-sm font-medium',
                        isActive ? 'text-primary-600 dark:text-primary-400' : 'text-primary'
                      )}>
                        {analysisType.name}
                      </div>
                      <div className="text-xs text-secondary mt-0.5 truncate">
                        {analysisType.description}
                      </div>
                    </div>
                    {isActive && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400"></div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisTypeDropdown;