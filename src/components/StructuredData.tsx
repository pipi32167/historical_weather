import { useEffect } from 'react';

interface StructuredDataProps {
  type?: 'WebPage' | 'Article' | 'DataCatalog';
  title: string;
  description: string;
  url: string;
  breadcrumb?: { name: string; url: string }[];
  datePublished?: string;
  dateModified?: string;
  keywords?: string[];
}

export const useStructuredData = ({
  type = 'WebPage',
  title,
  description,
  url,
  breadcrumb,
  datePublished,
  dateModified,
  keywords
}: StructuredDataProps) => {
  useEffect(() => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type,
      name: title,
      description: description,
      url: url,
      inLanguage: ['zh-CN', 'en-US'],
      author: {
        '@type': 'Person',
        name: 'Million',
        url: 'https://github.com/pipi32167/historical_weather_feedback'
      },
      publisher: {
        '@type': 'Person',
        name: 'Million',
        url: 'https://historicaltemperature.org/'
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url
      }
    };

    // Add optional fields
    if (breadcrumb && breadcrumb.length > 0) {
      (baseData as any).breadcrumb = {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumb.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url
        }))
      };
    }

    if (datePublished) {
      (baseData as any).datePublished = datePublished;
    }

    if (dateModified) {
      (baseData as any).dateModified = dateModified;
    }

    if (keywords && keywords.length > 0) {
      (baseData as any).keywords = keywords;
    }

    // For DataCatalog type (weather data pages)
    if (type === 'DataCatalog') {
      (baseData as any).dataset = {
        '@type': 'Dataset',
        name: 'Historical Weather Data',
        description: 'Comprehensive historical weather data from Open-Meteo API',
        provider: {
          '@type': 'Organization',
          name: 'Open-Meteo',
          url: 'https://open-meteo.com/'
        },
        license: 'https://creativecommons.org/licenses/by/4.0/',
        temporalCoverage: '1940/2024',
        spatialCoverage: {
          '@type': 'Place',
          name: 'Global'
        }
      };
    }

    // Create script element
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(baseData, null, 2);
    script.id = 'structured-data-' + type.toLowerCase();
    
    // Remove existing structured data for this page type
    const existing = document.getElementById('structured-data-' + type.toLowerCase());
    if (existing) {
      existing.remove();
    }
    
    // Add to head
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      const scriptToRemove = document.getElementById('structured-data-' + type.toLowerCase());
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [type, title, description, url, breadcrumb, datePublished, dateModified, keywords]);
};

export default useStructuredData;