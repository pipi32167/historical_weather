import React from 'react';
import Header from './Header';
import { useCanonicalSeo } from '../../hooks/useCanonicalSeo';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  useCanonicalSeo();

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <Header className="sticky top-0 z-40" />
      
      {/* Main content */}
      <main className="min-h-[calc(100vh-60px)]">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;