import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info } from 'lucide-react';

interface HeatIslandWarningProps {
  className?: string;
}

const HeatIslandWarning: React.FC<HeatIslandWarningProps> = ({ className = '' }) => {
  const { t } = useTranslation();

  return (
    <div className={`bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800 ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
            {t('homepage.heatIslandWarning.title')}
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
            {t('homepage.heatIslandWarning.description')}
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1 flex items-center">
                <Info className="h-3 w-3 mr-1" />
                {t('homepage.heatIslandWarning.factors')}
              </h4>
              <ul className="text-amber-700 dark:text-amber-300 space-y-1">
                <li>• {t('homepage.heatIslandWarning.factorsList.buildings')}</li>
                <li>• {t('homepage.heatIslandWarning.factorsList.traffic')}</li>
                <li>• {t('homepage.heatIslandWarning.factorsList.vegetation')}</li>
                <li>• {t('homepage.heatIslandWarning.factorsList.population')}</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1 flex items-center">
                <Info className="h-3 w-3 mr-1" />
                {t('homepage.heatIslandWarning.implications')}
              </h4>
              <ul className="text-amber-700 dark:text-amber-300 space-y-1">
                <li>• {t('homepage.heatIslandWarning.implicationsList.comparison')}</li>
                <li>• {t('homepage.heatIslandWarning.implicationsList.trend')}</li>
                <li>• {t('homepage.heatIslandWarning.implicationsList.location')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatIslandWarning;