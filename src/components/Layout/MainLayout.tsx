import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAppStore } from '../../store/appStore';
import clsx from 'clsx';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <Header className="sticky top-0 z-40" />
      
      {/* Main container */}
      <div className="flex h-[calc(100vh-60px)]">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content */}
        <main className={clsx(
          'flex-1 flex flex-col min-w-0', // min-w-0 prevents flex item from overflowing
          'transition-all duration-200'
        )}>
          <div className="flex-1 overflow-auto">
            <div className="p-6 max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => useAppStore.getState().setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;