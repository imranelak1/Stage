import React from 'react';

interface HeaderProps {
  onExport?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onExport }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-white shadow-sm py-3 px-4 md:px-6 flex items-center justify-between h-16">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">ST</div>
        <h1 className="text-lg md:text-xl font-semibold text-primary-dark tracking-wide truncate">T3 Shield</h1>
      </div>
      {onExport && (
        <button 
          className="bg-accent text-white px-3 py-1.5 text-sm rounded-md font-medium shadow-sm hover:bg-accent-dark transition"
          onClick={onExport}
        >
          Exporter
        </button>
      )}
    </header>
  );
};

export default Header;
