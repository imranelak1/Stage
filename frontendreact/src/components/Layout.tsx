import React, { useState } from 'react';
import type { ReactNode } from 'react';
import Header from './Header';
// import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  onExport?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onExport }) => {
  // const [sidebarOpen, setSidebarOpen] = useState(true);

  // const toggleSidebar = () => {
  //   setSidebarOpen(!sidebarOpen);
  // };

  return (
    <div className="min-h-screen bg-background-subtle font-sans">
      <Header onExport={onExport} />
      <div className="flex relative">
        {/* <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} /> */}
        <main className="flex-1 transition-all duration-300" style={{ paddingTop: '64px' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
