import React from 'react';

interface FiltersProps {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  selectedRegion?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  onStartTimeChange?: (time: string) => void;
  onEndTimeChange?: (time: string) => void;
  onRegionChange?: (region: string) => void;
  onFilterChange?: (startDate: string, endDate: string, startTime: string, endTime: string, region: string) => void;
}

const Filters: React.FC<FiltersProps> = ({
  startDate,
  endDate,
  startTime,
  endTime,
  selectedRegion = 'Tous',
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onRegionChange,
  onFilterChange
}) => {
  const currentDateLabel = `${startDate} - ${endDate}`;

  return (
    <section className="px-8 py-6 bg-white shadow-sm flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Date:</span>
        <span className="text-sm text-gray-600">{currentDateLabel}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-text">Période :</span>
        <input 
          type="date" 
          className="border rounded px-2 py-1 text-text focus:outline-primary" 
          value={startDate} 
          onChange={e => {
            const newValue = e.target.value;
            if (onStartDateChange) onStartDateChange(newValue);
            if (onFilterChange) onFilterChange(newValue, endDate, startTime, endTime, selectedRegion || 'Tous');
          }}
        />
        <span className="mx-1 text-text-muted">-</span>
        <input 
          type="date" 
          className="border rounded px-2 py-1 text-text focus:outline-primary" 
          value={endDate} 
          onChange={e => {
            const newValue = e.target.value;
            if (onEndDateChange) onEndDateChange(newValue);
            if (onFilterChange) onFilterChange(startDate, newValue, startTime, endTime, selectedRegion || 'Tous');
          }}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <span className="font-medium text-text">Heures :</span>
        <input 
          type="time" 
          className="border rounded px-2 py-1 text-text focus:outline-primary" 
          value={startTime} 
          onChange={e => {
            const newValue = e.target.value;
            if (onStartTimeChange) onStartTimeChange(newValue);
            if (onFilterChange) onFilterChange(startDate, endDate, newValue, endTime, selectedRegion || 'Tous');
          }}
        />
        <span className="mx-1 text-text-muted">-</span>
        <input 
          type="time" 
          className="border rounded px-2 py-1 text-text focus:outline-primary" 
          value={endTime} 
          onChange={e => {
            const newValue = e.target.value;
            if (onEndTimeChange) onEndTimeChange(newValue);
            if (onFilterChange) onFilterChange(startDate, endDate, startTime, newValue, selectedRegion || 'Tous');
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-text">Région :</span>
        <select 
          className="border rounded px-2 py-1 text-text focus:outline-primary"
          value={selectedRegion}
          onChange={e => {
            const newValue = e.target.value;
            if (onRegionChange) onRegionChange(newValue);
            if (onFilterChange) onFilterChange(startDate, endDate, startTime, endTime, newValue);
          }}
        >
          <option value="Tous">Toutes</option>
          <option value="Casablanca-Settat">Casablanca-Settat</option>
          <option value="Rabat-Salé-Kénitra">Rabat-Salé-Kénitra</option>
          <option value="Fès-Meknès">Fès-Meknès</option>
          <option value="Marrakech-Safi">Marrakech-Safi</option>
          <option value="Tanger-Tétouan-Al Hoceima">Tanger-Tétouan-Al Hoceima</option>
          <option value="Souss-Massa">Souss-Massa</option>
          <option value="Oriental">Oriental</option>
          <option value="Béni Mellal-Khénifra">Béni Mellal-Khénifra</option>
          <option value="Drâa-Tafilalet">Drâa-Tafilalet</option>
          <option value="Guelmim-Oued Noun">Guelmim-Oued Noun</option>
        </select>
      </div>
    </section>
  );
};

export default Filters;
