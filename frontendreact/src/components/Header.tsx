import React from 'react';

interface HeaderProps {
  onExport?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onExport }) => {
  return (
    <header className="bg-white shadow-sm py-4 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">ST</div>
        <h1 className="text-2xl font-semibold text-primary-dark tracking-wide">T3 Shield - Tableau de Bord National</h1>
      </div>
      <button 
        className="bg-accent text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-accent-dark transition"
        onClick={onExport}
      >
        Exporter les données
      </button>
    </header>
  );
};

export default Header;
